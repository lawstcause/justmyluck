const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');

const app = express();

const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'subscribers.db');

const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      source TEXT,
      created_at TEXT NOT NULL
    )`
  );
});

app.use(express.json());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || FRONTEND_ORIGINS.length === 0) return callback(null, true);
      if (FRONTEND_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    }
  })
);

app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createTransporter() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      : undefined
  });
}

const transporter = createTransporter();

app.post('/api/subscribe', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const source = String(req.body.source || 'site').trim();

  if (!emailRegex.test(email)) {
    return res.status(400).json({ status: 'error', message: 'Invalid email' });
  }

  const createdAt = new Date().toISOString();
  db.run(
    'INSERT OR IGNORE INTO subscribers (email, source, created_at) VALUES (?, ?, ?)',
    [email, source, createdAt],
    function insertCallback(err) {
      if (err) {
        return res.status(500).json({ status: 'error', message: 'Database error' });
      }

      const inserted = this.changes > 0;

      if (transporter && process.env.NOTIFY_TO) {
        transporter
          .sendMail({
            from: process.env.NOTIFY_FROM || process.env.SMTP_USER,
            to: process.env.NOTIFY_TO,
            subject: 'New Just My Luck signup',
            text: `${email} just signed up (${source}).`
          })
          .catch(() => {});
      }

      return res.json({ status: inserted ? 'ok' : 'exists' });
    }
  );
});

app.listen(PORT, () => {
  console.log(`JustMyLuck backend listening on ${PORT}`);
});

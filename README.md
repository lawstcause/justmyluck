# JustMyLuck.wtf

Casino-themed landing page with animated 3D dice, custom roll audio, and a production-ready email signup backend.

## Architecture

- Frontend: static site (`index.html`, `styles.css`, `script.js`) served by GitHub Pages.
- Backend: Node/Express API in `/backend`.
- Storage: SQLite (`/backend/data/subscribers.db`).
- Notifications: SMTP via Nodemailer.
- Anti-spam: honeypot field + rate limiting.

## Local Run

### Frontend

Open `/Users/lawrenceuhling/Documents/New project/index.html` in a browser.

### Backend

```bash
cd "/Users/lawrenceuhling/Documents/New project/backend"
npm install
cp .env.example .env
npm start
```

API health endpoint:

```bash
curl http://localhost:3000/health
```

## Production Deploy (Render)

`render.yaml` is included at `/Users/lawrenceuhling/Documents/New project/render.yaml`.

1. Push repo to GitHub.
2. In Render, create a new Blueprint/Web Service from this repo.
3. Set these required env vars in Render:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `NOTIFY_TO`
- `NOTIFY_FROM`
4. Deploy.
5. Set custom API domain in Render to `api.justmyluck.wtf`.
6. In Namecheap DNS, add a `CNAME`:
- Host: `api`
- Value: your Render service domain (example: `justmyluck-api.onrender.com`)

The frontend auto-targets:
- `http://localhost:3000` when running on localhost
- `https://api.justmyluck.wtf` when running on production hosts

## API

### `POST /api/subscribe`

Request body:

```json
{
  "email": "user@example.com",
  "source": "landing-page",
  "website": ""
}
```

Response:
- `{ "status": "ok" }`
- `{ "status": "exists" }`
- `{ "status": "error", "message": "..." }`

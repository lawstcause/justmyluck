import { useMemo, useState } from 'react';
import type { Answers, PlaybookFile } from '../types';

type QuizProps = {
  playbook: PlaybookFile;
  onBack: () => void;
  onSubmit: (answers: Answers, situation: string) => void;
};

function isFilled(playbook: PlaybookFile, answers: Answers, situation: string) {
  if (!situation.trim()) return false;
  return playbook.questions.every((question) => {
    const value = answers[question.id];
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value);
  });
}

export function Quiz({ playbook, onBack, onSubmit }: QuizProps) {
  const [situation, setSituation] = useState('');
  const [answers, setAnswers] = useState<Answers>({});

  const ready = useMemo(
    () => isFilled(playbook, answers, situation),
    [answers, playbook, situation],
  );

  function pick(questionId: string, optionId: string, multiple?: boolean) {
    setAnswers((current) => {
      if (!multiple) {
        return { ...current, [questionId]: optionId };
      }
      const existing = current[questionId];
      const list = Array.isArray(existing) ? existing : [];
      const next = list.includes(optionId)
        ? list.filter((id) => id !== optionId)
        : [...list, optionId];
      return { ...current, [questionId]: next };
    });
  }

  function selected(questionId: string, optionId: string) {
    const value = answers[questionId];
    return Array.isArray(value) ? value.includes(optionId) : value === optionId;
  }

  return (
    <div className="page quiz">
      <button className="back" onClick={onBack} type="button">
        ← All reports
      </button>
      <p className="kicker">{playbook.id.replace('-', ' ')}</p>
      <h1>{playbook.title}</h1>
      <p className="lede">{playbook.deck}</p>

      <label className="situation">
        <span>{playbook.situationPrompt}</span>
        <input
          autoComplete="off"
          onChange={(event) => setSituation(event.target.value)}
          placeholder={playbook.situationPlaceholder}
          value={situation}
        />
      </label>

      <ol className="questions">
        {playbook.questions.map((question, index) => (
          <li key={question.id}>
            <p>
              <span className="q-num">{String(index + 1).padStart(2, '0')}</span>
              {question.prompt}
              {question.multiple ? <em> pick any</em> : null}
            </p>
            <div className="chips">
              {question.options.map((option) => (
                <button
                  className={selected(question.id, option.id) ? 'chip on' : 'chip'}
                  key={option.id}
                  onClick={() => pick(question.id, option.id, question.multiple)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <button
        className="primary"
        disabled={!ready}
        onClick={() => onSubmit(answers, situation)}
        type="button"
      >
        Show me how luck will try it
      </button>
      {!ready ? <p className="hint">Answer everything. Luck needs a real night, not a vibe.</p> : null}
    </div>
  );
}

import type { Answers, Hazard, PlaybookFile, RankedHazard, Report } from './types';
import { WILD_CARDS } from './playbooks/wildcards';

function asList(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function scoreHazard(hazard: Hazard, answers: Answers): number {
  let score = hazard.base;
  for (const bump of hazard.bump) {
    if (asList(answers[bump.question]).includes(bump.option)) {
      score += bump.by;
    }
  }
  return Math.max(0, Math.min(100, score));
}

function pickWild(
  playbook: PlaybookFile,
  usedIds: Set<string>,
  answers: Answers,
  seed: number,
): RankedHazard | undefined {
  const leftovers = playbook.hazards
    .filter((hazard) => !usedIds.has(hazard.id))
    .map((hazard) => ({ ...hazard, score: scoreHazard(hazard, answers), wild: true as const }))
    .filter((hazard) => hazard.score < 18);

  const pool: RankedHazard[] =
    leftovers.length > 0
      ? leftovers
      : WILD_CARDS.map((hazard, index) => ({
          ...hazard,
          score: 20 + ((seed + index) % 17),
          wild: true as const,
        }));

  if (pool.length === 0) return undefined;
  return pool[(seed >>> 0) % pool.length];
}

export function buildReport(
  playbook: PlaybookFile,
  answers: Answers,
  situation: string,
  createdAt = Date.now(),
  wildId?: string,
): Report {
  const ranked = playbook.hazards
    .map((hazard) => ({ ...hazard, score: scoreHazard(hazard, answers) }))
    .filter((hazard) => hazard.score >= 18)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  const lines = ranked.slice(0, 8);
  const used = new Set(lines.map((line) => line.id));

  let wild: RankedHazard | undefined;
  if (wildId) {
    const fromPlaybook = playbook.hazards.find((hazard) => hazard.id === wildId);
    const fromWild = WILD_CARDS.find((hazard) => hazard.id === wildId);
    const found = fromPlaybook ?? fromWild;
    if (found) {
      wild = { ...found, score: scoreHazard(found, answers) || 24, wild: true };
    }
  }
  if (!wild) {
    wild = pickWild(playbook, used, answers, createdAt);
  }

  const filteredLines = wild ? lines.filter((line) => line.id !== wild.id) : lines;

  return {
    playbook,
    situation: situation.trim(),
    createdAt,
    answers,
    lines: filteredLines,
    wild,
  };
}

export function answerPreview(answers: Answers, playbook: PlaybookFile): string {
  return playbook.questions
    .map((question) => {
      const picked = asList(answers[question.id])
        .map((id) => question.options.find((option) => option.id === id)?.label)
        .filter(Boolean);
      return picked.length ? picked.join(', ') : null;
    })
    .filter(Boolean)
    .slice(0, 3)
    .join(' · ');
}

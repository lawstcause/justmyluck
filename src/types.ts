export type Severity = 'likely' | 'annoying' | 'cursed';

export type QuestionOption = {
  id: string;
  label: string;
};

export type Question = {
  id: string;
  prompt: string;
  hint?: string;
  multiple?: boolean;
  options: QuestionOption[];
};

export type Bump = {
  question: string;
  option: string;
  by: number;
};

export type Hazard = {
  id: string;
  name: string;
  blurb: string;
  counter: string;
  job?: string;
  kind: Severity;
  base: number;
  bump: Bump[];
};

export type Playbook = {
  id: string;
  title: string;
  deck: string;
  situationPrompt: string;
  situationPlaceholder: string;
  questions: Question[];
};

export type PlaybookFile = Playbook & {
  hazards: Hazard[];
};

export type Answers = Record<string, string | string[]>;

export type RankedHazard = Hazard & {
  score: number;
  wild?: boolean;
};

export type ReportPayload = {
  c: string;
  a: Answers;
  s: string;
  t: number;
  w?: string;
};

export type Report = {
  playbook: PlaybookFile;
  situation: string;
  createdAt: number;
  answers: Answers;
  lines: RankedHazard[];
  wild?: RankedHazard;
};

export type RecentReport = {
  id: string;
  title: string;
  situation: string;
  category: string;
  createdAt: number;
  payload: string;
};

export type DrawRecord = {
  at: number;
  names: string[];
  winner: string;
  brokeCovenant?: boolean;
};

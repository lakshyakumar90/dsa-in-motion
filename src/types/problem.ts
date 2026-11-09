export type Difficulty = "Easy" | "Medium" | "Hard";
export type Language = "cpp" | "js" | "python";
export type ApproachKind = "brute" | "better" | "optimal";

export interface ProblemResource {
  name: string;
  id: string;
  leetcode: string;
  blog: string;
  video: string;
  level: Difficulty;
  companies: string[];
}

export interface CurriculumTopic {
  id: string;
  name: string;
  resources: ProblemResource[];
}

export interface TopicLesson {
  title: string;
  short: string;
  lab: string;
  idea: string;
  invariant: string;
  explain: string[];
  pitfall: string;
  quiz: string;
  options: string[];
  answer: number;
  why: string;
}

export interface Approach {
  name: string;
  type: ApproachKind;
  idea: string;
  pros: string[];
  cons: string[];
  steps: string[];
  time: string;
  timeExplanation: string;
  space: string;
  spaceExplanation: string;
  cpp: string;
  js: string;
  python: string;
  example?: string;
}

export interface Solution extends Omit<Approach, "name" | "type" | "pros" | "cons" | "timeExplanation" | "spaceExplanation"> {
  statement: string;
  example: string;
  approaches: Approach[];
}

export interface Problem extends ProblemResource {
  topicIndex: number;
  questionIndex: number;
  topicTitle: string;
  solution?: Solution;
}

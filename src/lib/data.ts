import curriculumData from "@/data/curriculum.json";
import topicData from "@/data/topics.json";
import type { CurriculumTopic, Problem, Solution, TopicLesson } from "@/types/problem";

export const curriculum = curriculumData as { topics: CurriculumTopic[] };
export const topics = topicData as TopicLesson[];
export async function loadSolution(name: string): Promise<Solution | undefined> {
  const solutionData = await import("@/data/solutions.json");
  return (solutionData.default as unknown as Record<string, Solution>)[name];
}

export const problems: Problem[] = curriculum.topics.flatMap((topic, topicIndex) =>
  topic.resources.map((problem, questionIndex) => ({
    ...problem,
    topicIndex,
    questionIndex,
    topicTitle: topics[topicIndex]?.title ?? topic.name,
  })),
);

export const problemById = new Map(problems.map((problem) => [problem.id, problem]));

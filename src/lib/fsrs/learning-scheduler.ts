import type { Word } from "@/types/domain";
import type { FSRSState } from "@/types/domain";
import { getRetrievability } from "./algorithm";
import { shuffleArray } from "@/lib/vocabulary-utils";

/** 会话内的一个学习任务：某个词的某个模式 */
export interface LearningTask {
  wordId: string;
  wordIndex: number; // 在 words[] 中的原始索引
  modeIndex: number; // 0-3
  lastWrongCount: number; // 上一模式的错误数（首次为 0）
  insertedAt: number; // 入队时间戳 ms
}

/** 创建单个任务 */
export function createTask(
  wordId: string,
  wordIndex: number,
  modeIndex: number,
  lastWrongCount: number,
): LearningTask {
  return { wordId, wordIndex, modeIndex, lastWrongCount, insertedAt: Date.now() };
}

/** 为新词阶段构建初始队列（随机打乱，全 mode=0） */
export function createNewWordTaskQueue(words: Word[]): LearningTask[] {
  const shuffled = shuffleArray([...words]);
  return shuffled.map((word) => {
    // 找到原始索引
    const wordIndex = words.findIndex((w) => w.id === word.id);
    return createTask(word.id, wordIndex, 0, 0);
  });
}

/** 为复习阶段构建初始队列（按 FSRS retrievability 升序 + 难度降序） */
export function createReviewTaskQueue(
  words: Word[],
  fsrsMap: Record<string, FSRSState>,
): LearningTask[] {
  const tasks = words.map((word, wordIndex) =>
    createTask(word.id, wordIndex, 0, 0),
  );

  return sortQueueByPriority(tasks, false, fsrsMap);
}

/** 按优先级重排队列（优先级高的在前），返回新数组 */
export function sortQueueByPriority(
  queue: LearningTask[],
  isNewWords: boolean,
  fsrsMap?: Record<string, FSRSState>,
): LearningTask[] {
  const now = Date.now();
  const scored = queue.map((task) => ({
    task,
    priority: isNewWords
      ? computeNewWordPriority(task, now)
      : computeReviewPriority(task, now, fsrsMap),
  }));
  scored.sort((a, b) => b.priority - a.priority);
  return scored.map((s) => s.task);
}

/** 新词优先级：错越多/等越久 → 越优先 */
function computeNewWordPriority(task: LearningTask, now: number): number {
  const waitSeconds = Math.max(0, (now - task.insertedAt) / 1000);
  const wrongFactor = 1 + task.lastWrongCount * 0.4;
  const timeFactor = 1 + Math.min(waitSeconds / 60, 2); // 最多 3x
  return wrongFactor * timeFactor;
}

/** 复习词优先级：可提取性越低/错越多 → 越优先 */
function computeReviewPriority(
  task: LearningTask,
  now: number,
  fsrsMap?: Record<string, FSRSState>,
): number {
  const fsrs = fsrsMap?.[task.wordId];
  // retrievability 0-1，越低越需要复习 → 1-r 越高
  const retrievability = fsrs ? getRetrievability(fsrs, now) : 0.5;
  const wrongBonus = task.lastWrongCount * 0.3;
  return 1 - retrievability + wrongBonus;
}

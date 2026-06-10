export type DifficultyLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type FSRSRating = 1 | 2 | 3 | 4;

export interface FSRSState {
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  lastReview: number;
  state: "new" | "learning" | "review" | "relearning";
}

// ── 句子（Earthworm 风格）──

/** 运行时句子 — 由 JSON → converter 生成 */
export interface Sentence {
  id: string;
  /** 中文翻译 — 用户看到的提示 */
  chinese: string;
  /** 英文句子 — 用户打字的目标 */
  english: string;
  /** 音标 — 逐词格式，如 "/aɪ/ /laɪk/ /ðə/ /fud/" */
  soundmark?: string;
  audioUrl?: string;
  audioDuration?: number;
  difficulty: DifficultyLevel;
  source: "builtin" | "article" | "ai-generated" | "user-imported";
  wordCount: number;
  order: number;
  courseId: string;
  courseTitle: string;
  bookId: string;
  createdAt: number;
  updatedAt: number;
}

export interface Word {
  id: string;
  text: string;
  lemma: string;
  definition: string;
  definitionEn?: string;
  partOfSpeech: string;
  phonetic?: string;
  usphone?: string;
  ukphone?: string;
  audioUrl?: string;
  difficulty: DifficultyLevel;
  tags: string[];
  createdAt: number;
}

export interface SentenceWord {
  id: string;
  sentenceId: string;
  wordId: string;
  position: number;
}

export interface LearningCard {
  id: string;
  cardType: "sentence" | "word";
  contentId: string;
  fsrs: FSRSState;
  notes?: string;
  createdAt: number;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  translation?: string;
  wordCount: number;
  difficulty: DifficultyLevel;
  source: string;
  tags: string[];
  audioUrl?: string;
  createdAt: number;
}

export interface ArticleWord {
  id: string;
  articleId: string;
  wordId: string;
  paragraphIndex: number;
  sentenceIndex: number;
  position: number;
}

export type ExerciseType =
  | "dictation"
  | "cloze"
  | "multiple-choice"
  | "speaking"
  | "reading-comp";

export interface Exercise {
  id: string;
  exerciseType: ExerciseType;
  sentenceId?: string;
  articleId?: string;
  prompt: string;
  correctAnswer: string;
  acceptableAnswers?: string[];
  hints?: string[];
  difficulty: DifficultyLevel;
  points: number;
}

export interface MistakeDetail {
  type:
    | "spelling"
    | "grammar"
    | "missing-word"
    | "extra-word"
    | "word-order"
    | "punctuation";
  expected: string;
  actual: string;
  position: number;
  message: string;
}

export interface Attempt {
  id: string;
  userId: string;
  exerciseId: string;
  cardId?: string;
  userInput: string;
  normalizedInput?: string;
  isCorrect: boolean;
  score: number;
  timeSpentMs: number;
  mistakeDetails?: MistakeDetail[];
  createdAt: number;
}

export interface StudySession {
  id: string;
  userId: string;
  sessionType: "review" | "learn-new" | "test" | "mixed";
  startTime: number;
  endTime?: number;
  cardsReviewed: number;
  cardsCorrect: number;
  newCardsLearned: number;
  totalTimeSpentMs: number;
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  ttsSpeed: number;
  ttsVoice: string;
  autoPlay: boolean;
  caseStrict: boolean;
  punctuationStrict: boolean;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string;
  /** 进度条位置：贴顶或贴底 */
  progressBarPosition: "top" | "bottom";
  /** 发音偏好：美音或英音 */
  pronunciation: "us" | "uk";
}

export interface User {
  id: string;
  name: string;
  dailyGoal: number;
  targetDifficulty: DifficultyLevel;
  streakDays: number;
  totalCardsLearned: number;
  totalReviews: number;
  preferences: UserPreferences;
  createdAt: number;
}

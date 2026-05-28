import { useEffect, useRef } from "react";
import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import {
  saveLearningSession,
  loadLearningSession,
  deleteLearningSession,
} from "@/lib/db";
import { addStudySession } from "@/lib/db";
import type { WordBookId } from "@/types/vocabulary";

/**
 * 沉浸学习页面的自动保存/恢复 hook。
 * - 挂载时检查并恢复已保存的会话
 * - 每个模式完成后自动保存
 * - 页面关闭前保存
 * - 学习完成时清理
 */
export function useLearningSessionPersistence(bookId: WordBookId | null) {
  const phase = useVocabularySessionStore((s) => s.phase);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 挂载时尝试恢复会话
  useEffect(() => {
    if (!bookId) return;

    const restore = async () => {
      const record = await loadLearningSession(bookId);
      if (!record) return;

      try {
        const data = JSON.parse(record.stateJson);
        if (data.phase === "new-words" || data.phase === "review") {
          useVocabularySessionStore.getState().restoreSession(data);
        } else {
          // 已完成或空闲的旧记录，清理掉
          await deleteLearningSession(bookId);
        }
      } catch {
        // JSON 损坏，清理
        await deleteLearningSession(bookId);
      }
    };

    restore();
  }, [bookId]);

  // completedModeCount 变化时自动保存（防抖 300ms）
  useEffect(() => {
    const unsub = useVocabularySessionStore.subscribe(
      (s) => s.completedModeCount,
      () => {
        const state = useVocabularySessionStore.getState();
        if (state.phase !== "new-words" && state.phase !== "review") return;
        if (!state.selectedWordBook) return;

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          const current = useVocabularySessionStore.getState();
          if (current.phase !== "new-words" && current.phase !== "review") return;
          if (!current.selectedWordBook) return;

          const payload = serializeState(current);
          saveLearningSession({
            bookId: current.selectedWordBook,
            stateJson: JSON.stringify(payload),
            updatedAt: Date.now(),
          }).catch(() => {});
        }, 300);
      },
      { fireImmediately: false }
    );

    return () => {
      unsub();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // beforeunload 最终保存
  useEffect(() => {
    const handler = () => {
      const state = useVocabularySessionStore.getState();
      if (state.phase !== "new-words" && state.phase !== "review") return;
      if (!state.selectedWordBook) return;

      const payload = serializeState(state);
      // 同步保存，不保证一定完成但尽力
      saveLearningSession({
        bookId: state.selectedWordBook,
        stateJson: JSON.stringify(payload),
        updatedAt: Date.now(),
      }).catch(() => {});
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // finished 时记录 StudySession 并清理
  useEffect(() => {
    if (phase !== "finished") return;

    const state = useVocabularySessionStore.getState();
    const startTime = state.startTime;
    if (!startTime) return;

    const wordResults = state.wordResults;
    const wordsCorrect = wordResults.filter((r) => r.isCorrect).length;

    addStudySession({
      sessionType: "learn-new",
      startTime,
      endTime: Date.now(),
      cardsReviewed: wordResults.length,
      cardsCorrect: wordsCorrect,
      totalTimeSpentMs: Date.now() - startTime,
    }).catch(() => {});

    if (state.selectedWordBook) {
      deleteLearningSession(state.selectedWordBook).catch(() => {});
    }
  }, [phase]);
}

/** 提取 store 中需要持久化的字段 */
function serializeState(state: ReturnType<typeof useVocabularySessionStore.getState>) {
  return {
    selectedWordBook: state.selectedWordBook,
    phase: state.phase,
    typingMode: state.typingMode,
    wordsPerRound: state.wordsPerRound,
    newWords: state.newWords,
    newWordCompletions: state.newWordCompletions,
    reviewWords: state.reviewWords,
    reviewWordCompletions: state.reviewWordCompletions,
    reviewMeta: state.reviewMeta,
    taskQueue: state.taskQueue,
    currentWordIndex: state.currentWordIndex,
    completedModeCount: state.completedModeCount,
    regressionCount: state.regressionCount,
    lastCompletedWordId: state.lastCompletedWordId,
    wordResults: state.wordResults,
    totalKeystrokes: state.totalKeystrokes,
    totalCorrectKeystrokes: state.totalCorrectKeystrokes,
    startTime: state.startTime,
    elapsedSeconds: state.elapsedSeconds,
  };
}

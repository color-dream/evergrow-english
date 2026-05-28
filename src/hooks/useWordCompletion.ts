import { useCallback } from "react";
import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { useFSRSSync } from "@/hooks/useFSRSSync";
import type { WordModeResult } from "@/types/vocabulary";

/**
 * 管理单词模式完成后的调度。
 * 调度逻辑已移入 store.scheduleNextTask，此 hook 仅负责延迟触发和 FSRS 写入。
 */
export function useWordCompletion() {
  const scheduleNextTask = useVocabularySessionStore(
    (s) => s.scheduleNextTask
  );
  const { saveWordResult } = useFSRSSync();

  const recordModeComplete = useCallback(
    (result: WordModeResult) => {
      setTimeout(() => {
        // 1. 委托 store 处理所有调度逻辑（记录结果 + 选择下一个任务）
        scheduleNextTask(result);

        // 2. 检查是否有词刚完成全部 4 种模式，触发 FSRS 异步写入
        const state = useVocabularySessionStore.getState();
        if (state.lastCompletedWordId && state.selectedWordBook) {
          const wordResult = state.wordResults.find(
            (r) => r.wordId === state.lastCompletedWordId
          );
          if (wordResult) {
            saveWordResult(wordResult, state.selectedWordBook);
          }
        }
      }, 400);
    },
    [scheduleNextTask, saveWordResult]
  );

  return { recordModeComplete };
}

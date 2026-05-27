import { useCallback } from "react";
import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { useFSRSSync } from "@/hooks/useFSRSSync";
import type { WordModeResult, WordResult } from "@/types/vocabulary";
import { SKIP_WRONG_THRESHOLD } from "@/lib/constants";

/**
 * 管理单词4种模式的学习循环。
 * 每个单词需要通过4种渐进式隐藏模式才算完成。
 */
export function useWordCompletion() {
  const recordModeResult = useVocabularySessionStore(
    (s) => s.recordModeResult
  );
  const advanceToNextMode = useVocabularySessionStore(
    (s) => s.advanceToNextMode
  );
  const resetToFirstMode = useVocabularySessionStore(
    (s) => s.resetToFirstMode
  );
  const advanceToNextWord = useVocabularySessionStore(
    (s) => s.advanceToNextWord
  );
  const addWordResult = useVocabularySessionStore((s) => s.addWordResult);
  const phase = useVocabularySessionStore((s) => s.phase);
  const currentWordIndex = useVocabularySessionStore(
    (s) => s.currentWordIndex
  );
  const newWords = useVocabularySessionStore((s) => s.newWords);
  const newWordCompletions = useVocabularySessionStore(
    (s) => s.newWordCompletions
  );
  const reviewWords = useVocabularySessionStore((s) => s.reviewWords);
  const reviewWordCompletions = useVocabularySessionStore(
    (s) => s.reviewWordCompletions
  );
  const selectedWordBook = useVocabularySessionStore(
    (s) => s.selectedWordBook
  );

  const { saveWordResult } = useFSRSSync();

  const recordModeComplete = useCallback(
    (result: WordModeResult) => {
      const isNewWords = phase === "new-words";
      const words = isNewWords ? newWords : reviewWords;
      const completions = isNewWords
        ? newWordCompletions
        : reviewWordCompletions;

      const currentWord = words[currentWordIndex];
      if (!currentWord) return;

      const completion = completions[currentWord.id];
      if (!completion) return;

      // 1. 记录本模式结果
      recordModeResult(currentWord.id, result);

      // 2. 失败处理：错误>=阈值 → 跳回第1种模式
      if (result.wrongCount >= SKIP_WRONG_THRESHOLD) {
        setTimeout(() => resetToFirstMode(), 400);
        return;
      }

      // 3. 判断是否4种都完成了
      const allResults = [...completion.modeResults, result];
      if (allResults.length >= 4) {
        // 聚合评分：取最差的 wrongCount
        const worstWrongCount = Math.max(...allResults.map((r) => r.wrongCount));
        const isCorrect = allResults.every((r) => r.isCorrect);

        // 合并所有模式的 letterMistakes
        const mergedMistakes: Record<number, string[]> = {};
        for (const r of allResults) {
          for (const [pos, mistakes] of Object.entries(r.letterMistakes)) {
            const key = Number(pos);
            mergedMistakes[key] = [
              ...(mergedMistakes[key] ?? []),
              ...mistakes,
            ];
          }
        }

        const finalResult: WordResult = {
          wordId: currentWord.id,
          wordText: currentWord.text,
          definition: currentWord.definition,
          wrongCount: worstWrongCount,
          isCorrect,
          letterMistakes: mergedMistakes,
        };

        // 写入 FSRS
        addWordResult(finalResult);
        saveWordResult(finalResult, selectedWordBook ?? "");

        // 进入下一词
        setTimeout(() => advanceToNextWord(), 400);
      } else {
        // 4. 还有模式 → 切换到下一模式
        setTimeout(() => advanceToNextMode(), 400);
      }
    },
    [
      phase,
      newWords,
      reviewWords,
      newWordCompletions,
      reviewWordCompletions,
      currentWordIndex,
      selectedWordBook,
      recordModeResult,
      advanceToNextMode,
      resetToFirstMode,
      advanceToNextWord,
      addWordResult,
      saveWordResult,
    ]
  );

  return { recordModeComplete };
}

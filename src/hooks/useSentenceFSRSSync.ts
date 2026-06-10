import { useCallback } from "react";
import type { SentenceResult } from "@/stores/sentence-session-store";
import { deriveFSRSRating, applyFSRS, createNewFSRSState } from "@/lib/fsrs";
import { getCardById, upsertCard } from "@/lib/db";
import type { LearningCard } from "@/lib/fsrs/types";

export interface SentenceSyncPayload {
  result: SentenceResult;
  bookId: string;
  soundmark?: string;
}

/**
 * 将句子学习结果同步为 FSRS 学习卡片。
 */
export function useSentenceFSRSSync() {
  const saveSentenceResult = useCallback(
    (payload: SentenceSyncPayload): void => {
      const { result, bookId, soundmark } = payload;
      (async () => {
        try {
          // 用 sentenceId 作为卡片 ID
          const cardId = result.sentenceId;
          const existing = await getCardById(cardId);

          const wrongCount = result.wrongWordCount;
          const isForgotten = !result.isCorrect && wrongCount >= 3;
          const rating = deriveFSRSRating(wrongCount, isForgotten);
          const now = Date.now();

          const card: LearningCard = existing
            ? {
                ...existing,
                sentenceText: result.sentenceEnglish,
                sentenceTranslation: result.chinese,
                sentenceSoundmark: soundmark ?? existing.sentenceSoundmark,
                fsrs: applyFSRS(existing.fsrs, rating, now),
                updatedAt: now,
              }
            : {
                id: cardId,
                wordText: "",
                definition: "",
                bookId,
                cardType: "sentence",
                sentenceText: result.sentenceEnglish,
                sentenceTranslation: result.chinese,
                sentenceSoundmark: soundmark,
                fsrs: applyFSRS(createNewFSRSState(), rating, now),
                notes: "",
                createdAt: now,
                updatedAt: now,
              };

          await upsertCard(card);
        } catch {
          // 静默失败
        }
      })();
    },
    [],
  );

  return { saveSentenceResult };
}

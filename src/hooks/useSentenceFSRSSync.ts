import { useCallback } from "react";
import type { SentenceResult } from "@/stores/sentence-session-store";
import type { SyntaxSegment } from "@/types/domain";
import { deriveFSRSRating, applyFSRS, createNewFSRSState } from "@/lib/fsrs";
import { getCardById, upsertCard } from "@/lib/db";
import type { LearningCard } from "@/lib/fsrs/types";

export interface SentenceSyncPayload {
  result: SentenceResult;
  bookId: string;
  segments?: SyntaxSegment[];
  phonetic?: string;
}

/**
 * 将句子学习结果同步为 FSRS 学习卡片。
 */
export function useSentenceFSRSSync() {
  const saveSentenceResult = useCallback(
    (payload: SentenceSyncPayload): void => {
      const { result, bookId, segments, phonetic } = payload;
      (async () => {
        try {
          const cardId = result.sentenceUuid;
          const existing = await getCardById(cardId);

          const wrongCount = result.wrongWordCount;
          const isForgotten = !result.isCorrect && wrongCount >= 3;
          const rating = deriveFSRSRating(wrongCount, isForgotten);
          const now = Date.now();

          const card: LearningCard = existing
            ? {
                ...existing,
                sentenceText: result.sentenceText,
                sentenceTranslation: result.translation,
                sentencePhonetic: phonetic ?? existing.sentencePhonetic,
                sentenceSegments: segments ?? existing.sentenceSegments,
                sentenceUuid: result.sentenceUuid,
                fsrs: applyFSRS(existing.fsrs, rating, now),
                updatedAt: now,
              }
            : {
                id: cardId,
                wordText: "",
                definition: "",
                bookId,
                cardType: "sentence",
                sentenceText: result.sentenceText,
                sentenceTranslation: result.translation,
                sentencePhonetic: phonetic,
                sentenceSegments: segments,
                sentenceUuid: result.sentenceUuid,
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

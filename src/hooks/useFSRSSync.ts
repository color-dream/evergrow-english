import { useCallback } from "react";
import type { WordResult } from "@/types/vocabulary";
import { deriveFSRSRating, applyFSRS, createNewFSRSState } from "@/lib/fsrs";
import { getCardById, upsertCard } from "@/lib/db";
import type { LearningCard } from "@/lib/fsrs/types";

/** 模块级追踪所有飞行中的保存 Promise */
const pendingSaves = new Set<Promise<void>>();

/**
 * 将打字结果同步为 FSRS 学习卡片。
 * fire-and-forget，不阻塞 UI。
 */
export function useFSRSSync() {
  const saveWordResult = useCallback(
    (result: WordResult, bookId: string): void => {
      const promise = (async () => {
        try {
          const cardId = result.wordId; // 格式: "{bookId}_{lemma}"
          const existing = await getCardById(cardId);

          const rating = deriveFSRSRating(
            result.wrongCount,
            !result.isCorrect && result.wrongCount >= 4
          );
          const now = Date.now();

          const card: LearningCard = existing
            ? {
                ...existing,
                fsrs: applyFSRS(existing.fsrs, rating, now),
                updatedAt: now,
              }
            : {
                id: cardId,
                wordText: result.wordText,
                definition: result.definition,
                bookId,
                cardType: "word",
                fsrs: applyFSRS(createNewFSRSState(), rating, now),
                notes: "",
                createdAt: now,
                updatedAt: now,
              };

          await upsertCard(card);
        } catch {
          // 静默失败，不影响打字流程
        }
      })();

      pendingSaves.add(promise);
      promise.finally(() => pendingSaves.delete(promise));
    },
    []
  );

  /** 等待所有飞行中的保存完成，带超时保护 */
  const flushPendingSaves = useCallback(
    async (timeoutMs = 3000): Promise<void> => {
      if (pendingSaves.size === 0) return;
      const pending = [...pendingSaves];
      await Promise.race([
        Promise.allSettled(pending),
        new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
      ]);
    },
    []
  );

  return { saveWordResult, flushPendingSaves };
}

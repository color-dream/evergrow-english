import { useCallback, useState } from "react";
import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { useSettingsStore } from "@/stores/settings-store";
import { WordBookList } from "./WordBookList";
import { PreSettingsDialog } from "./PreSettingsDialog";
import type { WordBookId } from "@/types/vocabulary";
import { WORD_BOOK_META } from "@/lib/word-book-registry";
import { ROUTES } from "@/lib/constants";

export function VocabularyPage() {
  const wordsPerRound = useVocabularySessionStore((s) => s.wordsPerRound);

  const [preSettingsBookId, setPreSettingsBookId] =
    useState<WordBookId | null>(null);

  const handleSelectBook = useCallback(async (id: WordBookId) => {
    setPreSettingsBookId(id);
  }, []);

  const handleOpenInProgressBook = useCallback(
    (id: WordBookId) => {
      const win = window.open(
        `${ROUTES.LEARN}?bookId=${id}`,
        "_blank"
      );

      if (!win) {
        alert("页面被浏览器拦截，请允许弹窗后重试。");
      }
    },
    []
  );

  const handlePreSettingsConfirm = useCallback(
    (wordsPerRoundValue: number) => {
      const store = useVocabularySessionStore.getState();
      store.setWordsPerRound(wordsPerRoundValue);
      const bookId = preSettingsBookId;
      setPreSettingsBookId(null);
      if (!bookId) return;

      // 缓存每轮单词数到 localStorage
      useSettingsStore.getState().setBookWordsPerRound(bookId, wordsPerRoundValue);

      const win = window.open(
        `${ROUTES.LEARN}?bookId=${bookId}`,
        "_blank"
      );

      if (!win) {
        alert("页面被浏览器拦截，请允许弹窗后重试。");
      }
    },
    [preSettingsBookId]
  );

  const handlePreSettingsCancel = useCallback(() => {
    setPreSettingsBookId(null);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <WordBookList
        onSelectBook={handleSelectBook}
        onSelectInProgressBook={handleOpenInProgressBook}
      />

      {preSettingsBookId && (
        <PreSettingsDialog
          open={true}
          bookName={WORD_BOOK_META[preSettingsBookId].label}
          initialWordsPerRound={wordsPerRound}
          onConfirm={handlePreSettingsConfirm}
          onCancel={handlePreSettingsCancel}
        />
      )}
    </div>
  );
}

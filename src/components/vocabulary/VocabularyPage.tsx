import { useCallback, useState } from "react";
import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { VocabularyHeader } from "./VocabularyHeader";
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

  const handlePreSettingsConfirm = useCallback(
    (wordsPerRoundValue: number) => {
      const store = useVocabularySessionStore.getState();
      store.setWordsPerRound(wordsPerRoundValue);
      const bookId = preSettingsBookId;
      setPreSettingsBookId(null);
      if (!bookId) return;

      const win = window.open(
        `${ROUTES.LEARN}?bookId=${bookId}&wordsPerRound=${wordsPerRoundValue}`,
        "_blank",
        "width=1024,height=768"
      );

      if (!win) {
        // 弹窗被拦截，给用户提示
        alert("弹窗被浏览器拦截，请允许弹窗后重试。");
      }
    },
    [preSettingsBookId]
  );

  const handlePreSettingsCancel = useCallback(() => {
    setPreSettingsBookId(null);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <VocabularyHeader />

      <WordBookList onSelectBook={handleSelectBook} />

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

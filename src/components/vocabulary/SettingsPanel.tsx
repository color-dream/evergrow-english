import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { WORD_BOOK_OPTIONS, WORD_BOOK_META } from "@/lib/word-book-registry";
import type { TypingMode, DictationType, WordBookId } from "@/types/vocabulary";
import { cn } from "@/lib/utils";
import { BookMarked, Loader2 } from "lucide-react";

const DICTATION_OPTIONS: { key: DictationType; label: string }[] = [
  { key: "hideAll", label: "全部隐藏" },
  { key: "hideVowel", label: "隐藏元音" },
  { key: "hideConsonant", label: "隐藏辅音" },
  { key: "randomHide", label: "随机隐藏" },
];

interface SettingsPanelProps {
  onStart: () => void;
  onNewRound: () => void;
  onChangeBook: () => void;
  onSelectBook: (id: WordBookId) => void;
  isLoading: boolean;
}

export function SettingsPanel({
  onStart,
  onNewRound,
  onChangeBook,
  onSelectBook,
  isLoading,
}: SettingsPanelProps) {
  const phase = useVocabularySessionStore((s) => s.phase);
  const selectedBook = useVocabularySessionStore((s) => s.selectedWordBook);
  const mode = useVocabularySessionStore((s) => s.mode);
  const dictation = useVocabularySessionStore((s) => s.dictation);
  const currentIndex = useVocabularySessionStore((s) => s.currentIndex);
  const words = useVocabularySessionStore((s) => s.words);
  const wordResults = useVocabularySessionStore((s) => s.wordResults);

  const setMode = useVocabularySessionStore((s) => s.setMode);
  const setDictation = useVocabularySessionStore((s) => s.setDictation);

  const bookMeta = selectedBook ? WORD_BOOK_META[selectedBook] : null;

  return (
    <aside className="flex w-[280px] shrink-0 flex-col border-l border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <BookMarked className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">学习设置</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {phase === "idle" && (
          <IdlePanel
            isLoading={isLoading}
            onStart={onStart}
            onSelectBook={onSelectBook}
          />
        )}
        {phase === "active" && (
          <ActivePanel
            bookMeta={bookMeta}
            currentIndex={currentIndex}
            totalWords={words.length}
            mode={mode}
            dictation={dictation}
            onModeChange={setMode}
            onDictationChange={setDictation}
          />
        )}
        {phase === "finished" && (
          <FinishedPanel
            bookMeta={bookMeta}
            wordResults={wordResults}
            onNewRound={onNewRound}
            onChangeBook={onChangeBook}
          />
        )}
      </div>
    </aside>
  );
}

function IdlePanel({
  isLoading,
  onStart,
  onSelectBook,
}: {
  isLoading: boolean;
  onStart: () => void;
  onSelectBook: (id: WordBookId) => void;
}) {
  const selectedBook = useVocabularySessionStore((s) => s.selectedWordBook);
  const canStart = selectedBook !== null && !isLoading;

  return (
    <div className="flex h-full flex-col">
      <h3 className="mb-4 text-sm font-semibold">词库选择</h3>

      <div className="space-y-3">
        {WORD_BOOK_OPTIONS.map((book) => (
          <WordBookSelector key={book.id} book={book} onSelect={onSelectBook} />
        ))}
      </div>

      {isLoading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          正在加载词库...
        </div>
      )}

      <div className="mt-auto pt-6">
        <button
          onClick={onStart}
          disabled={!canStart}
          className={cn(
            "w-full rounded-xl py-3 text-sm font-semibold transition-all",
            canStart
              ? "bg-primary text-primary-foreground shadow-xs hover:opacity-90 active:scale-[0.98]"
              : "cursor-not-allowed bg-muted text-muted-foreground"
          )}
        >
          {selectedBook ? "开始学习 (20词)" : "请先选择词库"}
        </button>
      </div>
    </div>
  );
}

function WordBookSelector({
  book,
  onSelect,
}: {
  book: (typeof WORD_BOOK_OPTIONS)[number];
  onSelect: (id: WordBookId) => void;
}) {
  const selectedBook = useVocabularySessionStore((s) => s.selectedWordBook);
  const isSelected = selectedBook === book.id;

  return (
    <button
      onClick={() => onSelect(book.id)}
      className={cn(
        "w-full rounded-xl border p-4 text-left transition-all",
        isSelected
          ? "border-primary/40 bg-primary/8 shadow-xs"
          : "border-border bg-transparent hover:border-muted-foreground/40"
      )}
    >
      <div className="text-sm font-semibold">{book.label}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">
        {book.description}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        约 {book.wordCount.toLocaleString()} 词
      </div>
    </button>
  );
}

function ActivePanel({
  bookMeta,
  currentIndex,
  totalWords,
  mode,
  dictation,
  onModeChange,
  onDictationChange,
}: {
  bookMeta: { label: string } | null;
  currentIndex: number;
  totalWords: number;
  mode: TypingMode;
  dictation: { enabled: boolean; type: DictationType };
  onModeChange: (mode: TypingMode) => void;
  onDictationChange: (config: {
    enabled?: boolean;
    type?: DictationType;
  }) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* 词库 & 进度 */}
      <div className="mb-6">
        <div className="text-xs text-muted-foreground">当前词库</div>
        <div className="mt-0.5 text-sm font-semibold">
          {bookMeta?.label ?? "-"}
        </div>
        <div className="mt-3">
          <div className="text-xs text-muted-foreground">进度</div>
          <div className="mt-0.5 font-mono text-2xl font-bold tabular-nums">
            {currentIndex + 1}
            <span className="text-base font-normal text-muted-foreground">
              {" "}
              / {totalWords}
            </span>
          </div>
        </div>
      </div>

      <hr className="border-border" />

      {/* 打字模式 */}
      <fieldset className="mt-5">
        <legend className="mb-3 text-xs font-medium text-muted-foreground">
          打字模式
        </legend>
        <div className="flex gap-2">
          {(["strict", "loose"] as const).map((m) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={cn(
                "flex-1 rounded-lg border py-2 text-xs font-medium transition-all",
                mode === m
                  ? "border-primary/40 bg-primary/8 text-primary shadow-xs"
                  : "border-border bg-transparent text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
              )}
            >
              {m === "strict" ? "严格" : "宽松"}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
          {mode === "strict" ? "打错即重置当前词" : "允许退格，输完比对"}
        </p>
      </fieldset>

      {/* 听写模式 */}
      <fieldset className="mt-5">
        <legend className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <input
            type="checkbox"
            checked={dictation.enabled}
            onChange={(e) => onDictationChange({ enabled: e.target.checked })}
            className="h-3.5 w-3.5 rounded accent-primary"
          />
          听写模式
        </legend>
        {dictation.enabled && (
          <div className="flex flex-wrap gap-1.5">
            {DICTATION_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => onDictationChange({ type: key })}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all",
                  dictation.type === key
                    ? "border-primary/40 bg-primary/8 text-primary"
                    : "border-border bg-transparent text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </fieldset>

      {/* 快捷键提示 */}
      <div className="mt-auto pt-6">
        <div className="rounded-lg bg-muted/50 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-medium">提示：</span>
          切换模式或听写选项会立即生效；切换打字模式会重置当前词。
        </div>
      </div>
    </div>
  );
}

function FinishedPanel({
  bookMeta,
  wordResults,
  onNewRound,
  onChangeBook,
}: {
  bookMeta: { label: string } | null;
  wordResults: { isCorrect: boolean }[];
  onNewRound: () => void;
  onChangeBook: () => void;
}) {
  const wordsCorrect = wordResults.filter((r) => r.isCorrect).length;

  return (
    <div className="flex h-full flex-col">
      <h3 className="text-sm font-semibold">本轮完成</h3>

      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-border p-4 text-center">
          <div className="font-mono text-2xl font-bold tabular-nums text-success">
            {wordsCorrect}/{wordResults.length}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">正确单词</div>
        </div>

        <div className="rounded-xl border border-border p-3 text-center">
          <div className="text-xs text-muted-foreground">词库</div>
          <div className="text-sm font-semibold">{bookMeta?.label ?? "-"}</div>
        </div>
      </div>

      <div className="mt-auto space-y-2 pt-6">
        <button
          onClick={onNewRound}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-xs transition-all hover:opacity-90 active:scale-[0.98]"
        >
          再来一轮
        </button>
        <button
          onClick={onChangeBook}
          className="w-full rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
        >
          更换词库
        </button>
      </div>
    </div>
  );
}

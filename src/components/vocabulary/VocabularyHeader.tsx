import { useState } from "react";
import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import {
  WORD_BOOK_OPTIONS,
  WORD_BOOK_META,
} from "@/lib/word-book-registry";
import type { TypingMode, DictationType, WordBookId } from "@/types/vocabulary";
import { cn } from "@/lib/utils";
import {
  BookMarked,
  SkipForward,
  Eye,
  EyeOff,
  Settings,
  Play,
  Pause,
  RotateCw,
  X,
} from "lucide-react";

const DICTATION_OPTIONS: { key: DictationType; label: string }[] = [
  { key: "hideAll", label: "全部隐藏" },
  { key: "hideVowel", label: "隐藏元音" },
  { key: "hideConsonant", label: "隐藏辅音" },
  { key: "randomHide", label: "随机隐藏" },
];

interface VocabularyHeaderProps {
  onStart: () => void;
  onSelectBook: (id: WordBookId) => void;
  isLoading: boolean;
}

export function VocabularyHeader({
  onStart,
  onSelectBook,
  isLoading,
}: VocabularyHeaderProps) {
  const phase = useVocabularySessionStore((s) => s.phase);
  const selectedBook = useVocabularySessionStore((s) => s.selectedWordBook);
  const mode = useVocabularySessionStore((s) => s.mode);
  const dictation = useVocabularySessionStore((s) => s.dictation);
  const isTyping = useVocabularySessionStore((s) => s.isTyping);
  const setMode = useVocabularySessionStore((s) => s.setMode);
  const setDictation = useVocabularySessionStore((s) => s.setDictation);
  const setIsTyping = useVocabularySessionStore((s) => s.setIsTyping);
  const resetSession = useVocabularySessionStore((s) => s.resetSession);

  const [showSettings, setShowSettings] = useState(false);
  const bookMeta = selectedBook ? WORD_BOOK_META[selectedBook] : null;

  const canStart = selectedBook !== null && !isLoading;

  return (
    <>
      <header className="container z-20 mx-auto w-full px-10 py-6">
        <div className="flex w-full flex-col items-center justify-between gap-3 lg:flex-row lg:gap-0">
          {/* 左侧：标题 */}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-indigo-500 lg:text-4xl">
              Evergrow English
            </h1>
            {bookMeta && phase !== "finished" && (
              <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
                {bookMeta.label}
              </span>
            )}
          </div>

          {/* 右侧：工具栏 */}
          <nav className="my-card flex w-auto items-center gap-2 rounded-xl bg-card px-4 py-2 shadow-my-card">
            {phase === "idle" && (
              <>
                {/* 词库选择器 */}
                <select
                  value={selectedBook ?? ""}
                  onChange={(e) => onSelectBook(e.target.value as WordBookId)}
                  className="rounded-lg border border-border bg-transparent px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-indigo-400"
                >
                  <option value="" disabled>
                    选择词库
                  </option>
                  {WORD_BOOK_OPTIONS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label} ({b.wordCount.toLocaleString()}词)
                    </option>
                  ))}
                </select>

                <button
                  onClick={onStart}
                  disabled={!canStart}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
                    canStart
                      ? "bg-indigo-400 text-white hover:opacity-90 active:scale-[0.98]"
                      : "cursor-not-allowed bg-muted text-muted-foreground"
                  )}
                >
                  <Play className="h-3.5 w-3.5" />
                  {isLoading ? "加载中..." : "开始 (20词)"}
                </button>
              </>
            )}

            {phase === "active" && (
              <>
                {/* 暂停/继续 */}
                <ToolIconButton
                  onClick={() => setIsTyping(!isTyping)}
                  title={isTyping ? "暂停 (Enter)" : "继续 (Enter)"}
                >
                  {isTyping ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </ToolIconButton>

                {/* 重新开始 */}
                <ToolIconButton
                  onClick={() => {
                    resetSession();
                  }}
                  title="重新开始"
                >
                  <RotateCw className="h-4 w-4" />
                </ToolIconButton>

                <div className="mx-1 h-5 w-px bg-border" />

                {/* 打字模式 */}
                <div className="flex rounded-lg border border-border p-0.5">
                  {(["strict", "loose"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                        mode === m
                          ? "bg-indigo-400 text-white"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {m === "strict" ? "严格" : "宽松"}
                    </button>
                  ))}
                </div>

                {/* 听写 */}
                <ToolIconButton
                  onClick={() =>
                    setDictation({ enabled: !dictation.enabled })
                  }
                  active={dictation.enabled}
                  title={`听写模式 (${DICTATION_OPTIONS.find((d) => d.type === dictation.type)?.label})`}
                >
                  {dictation.enabled ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </ToolIconButton>

                {/* 设置 */}
                <div className="mx-1 h-5 w-px bg-border" />

                <ToolIconButton
                  onClick={() => setShowSettings(true)}
                  title="设置"
                >
                  <Settings className="h-4 w-4" />
                </ToolIconButton>
              </>
            )}

            {phase === "finished" && (
              <span className="text-sm font-medium text-muted-foreground">
                本轮完成
              </span>
            )}
          </nav>
        </div>
      </header>

      {/* 设置对话框 */}
      <SettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        mode={mode}
        dictation={dictation}
        onModeChange={setMode}
        onDictationChange={setDictation}
      />
    </>
  );
}

/** 工具栏图标按钮 */
function ToolIconButton({
  onClick,
  title,
  active,
  children,
}: {
  onClick: () => void;
  title: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "rounded-lg p-1.5 text-indigo-400 transition-colors hover:bg-indigo-400 hover:text-white focus:outline-none",
        active && "bg-indigo-400 text-white"
      )}
    >
      {children}
    </button>
  );
}

/** 设置对话框 */
function SettingsDialog({
  open,
  onClose,
  mode,
  dictation,
  onModeChange,
  onDictationChange,
}: {
  open: boolean;
  onClose: () => void;
  mode: TypingMode;
  dictation: { enabled: boolean; type: DictationType };
  onModeChange: (mode: TypingMode) => void;
  onDictationChange: (config: {
    enabled?: boolean;
    type?: DictationType;
  }) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="absolute inset-0 bg-gray-300 opacity-80 dark:bg-gray-600"
        onClick={onClose}
      />
      <div className="flex h-screen items-center justify-center">
        <div className="my-card relative w-[90vw] max-w-md rounded-2xl bg-card p-6 shadow-my-card animate-fade-in">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>

          <h2 className="mb-6 text-lg font-bold">学习设置</h2>

          {/* 打字模式 */}
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              打字模式
            </h3>
            <div className="flex gap-2">
              {(["strict", "loose"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => onModeChange(m)}
                  className={cn(
                    "flex-1 rounded-lg border py-2 text-sm font-medium transition-all",
                    mode === m
                      ? "border-indigo-400 bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300"
                      : "border-border text-muted-foreground hover:border-muted-foreground/40"
                  )}
                >
                  {m === "strict" ? "严格模式" : "宽松模式"}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {mode === "strict"
                ? "打错即重置当前词，从头开始"
                : "允许退格修正，输完整体比对"}
            </p>
          </div>

          {/* 听写模式 */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <input
                type="checkbox"
                checked={dictation.enabled}
                onChange={(e) =>
                  onDictationChange({ enabled: e.target.checked })
                }
                className="h-3.5 w-3.5 rounded accent-indigo-400"
              />
              听写模式
            </h3>
            {dictation.enabled && (
              <div className="flex flex-wrap gap-1.5">
                {DICTATION_OPTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => onDictationChange({ type: key })}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                      dictation.type === key
                        ? "border-indigo-400 bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300"
                        : "border-border text-muted-foreground hover:border-muted-foreground/40"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

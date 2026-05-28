import { useState } from "react";
import {
  useVocabularySessionStore,
} from "@/stores/vocabulary-session-store";
import { WORD_BOOK_META } from "@/lib/word-book-registry";
import { WORDS_PER_ROUND_MIN, WORDS_PER_ROUND_MAX, WORDS_PER_ROUND_STEP } from "@/lib/constants";
import type { TypingMode } from "@/types/vocabulary";
import { cn } from "@/lib/utils";
import { Settings, Play, Pause, RotateCw, X } from "lucide-react";

export function VocabularyHeader() {
  const phase = useVocabularySessionStore((s) => s.phase);
  const selectedBook = useVocabularySessionStore((s) => s.selectedWordBook);
  const typingMode = useVocabularySessionStore((s) => s.typingMode);
  const isTyping = useVocabularySessionStore((s) => s.isTyping);
  const setTypingMode = useVocabularySessionStore((s) => s.setTypingMode);
  const wordsPerRound = useVocabularySessionStore((s) => s.wordsPerRound);
  const setWordsPerRound = useVocabularySessionStore((s) => s.setWordsPerRound);
  const setIsTyping = useVocabularySessionStore((s) => s.setIsTyping);
  const resetSession = useVocabularySessionStore((s) => s.resetSession);

  const [showSettings, setShowSettings] = useState(false);
  const bookMeta = selectedBook ? WORD_BOOK_META[selectedBook] : null;

  const isActive = phase === "new-words" || phase === "review";
  const isReview = phase === "review";

  return (
    <>
      <header className="container z-20 mx-auto w-full px-10 py-6">
        <div className="flex w-full flex-col items-center justify-between gap-3 lg:flex-row lg:gap-0">
          {/* 左侧：标题 */}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-primary lg:text-4xl">
              Evergrow English
            </h1>
            {bookMeta && phase !== "finished" && (
              <span
                className="rounded-full px-3 py-0.5 text-xs font-medium"
                style={{
                  background: "oklch(0.55 0.195 252 / 0.08)",
                  color: "oklch(0.55 0.195 252)",
                }}
              >
                {bookMeta.label}
              </span>
            )}
            {isActive && (
              <span
                className="rounded-full px-3 py-0.5 text-xs font-medium"
                style={{
                  background: isReview
                    ? "oklch(0.72 0.18 85 / 0.12)"
                    : "oklch(0.56 0.19 148 / 0.1)",
                  color: isReview
                    ? "oklch(0.55 0.14 80)"
                    : "oklch(0.56 0.19 148)",
                }}
              >
                {isReview ? "复习阶段" : "新词学习"}
              </span>
            )}
          </div>

          {/* 右侧：工具栏 */}
          <nav
            className="flex w-auto items-center gap-2 rounded-full px-4 py-2"
            style={{
              background: "var(--glass-card-bg)",
              backdropFilter: "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
              WebkitBackdropFilter: "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
              border: "1px solid var(--glass-card-border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {isActive && (
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

                <div
                  className="mx-1 h-5 w-px"
                  style={{ background: "var(--glass-card-border)" }}
                />

                {/* 打字模式 */}
                <div
                  className="flex rounded-full p-0.5"
                  style={{
                    background: "var(--glass-pill-bg)",
                    border: "1px solid var(--glass-pill-border)",
                  }}
                >
                  {(["strict", "loose"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setTypingMode(m)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-300",
                        typingMode === m
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground/50 hover:text-foreground"
                      )}
                    >
                      {m === "strict" ? "严格" : "宽松"}
                    </button>
                  ))}
                </div>

                {/* 设置 */}
                <div
                  className="mx-1 h-5 w-px"
                  style={{ background: "var(--glass-card-border)" }}
                />

                <ToolIconButton
                  onClick={() => setShowSettings(true)}
                  title="设置"
                >
                  <Settings className="h-4 w-4" />
                </ToolIconButton>
              </>
            )}

            {phase === "finished" && (
              <span className="text-sm font-medium text-foreground/50">
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
        mode={typingMode}
        onModeChange={setTypingMode}
        wordsPerRound={wordsPerRound}
        onWordsPerRoundChange={setWordsPerRound}
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
        "rounded-full p-1.5 transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none",
        active
          ? "bg-primary text-primary-foreground"
          : "text-foreground/40 hover:text-foreground"
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
  onModeChange,
  wordsPerRound,
  onWordsPerRoundChange,
}: {
  open: boolean;
  onClose: () => void;
  mode: TypingMode;
  onModeChange: (mode: TypingMode) => void;
  wordsPerRound: number;
  onWordsPerRoundChange: (n: number) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="absolute inset-0"
        style={{
          background: "oklch(0.55 0.195 252 / 0.08)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
        onClick={onClose}
      />
      <div className="flex h-screen items-center justify-center">
        <div
          className="relative w-[90vw] max-w-md p-6 animate-spring-in"
          style={{
            background: "var(--glass-sheet-bg)",
            backdropFilter: "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
            WebkitBackdropFilter: "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
            border: "1px solid var(--glass-sheet-border)",
            borderRadius: "var(--radius-4xl)",
            boxShadow: "var(--shadow-2xl)",
          }}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-foreground/40 transition-all duration-300 hover:text-foreground hover:scale-110"
          >
            <X className="h-4 w-4" />
          </button>

          <h2 className="mb-6 text-lg font-bold">学习设置</h2>

          {/* 打字模式 */}
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-medium text-foreground/50">
              打字模式
            </h3>
            <div className="flex gap-2">
              {(["strict", "loose"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => onModeChange(m)}
                  className={cn(
                    "flex-1 rounded-full border py-2 text-sm font-medium transition-all duration-300",
                    mode === m
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-foreground/50 hover:text-foreground"
                  )}
                  style={mode === m ? {} : { borderColor: "var(--glass-card-border)" }}
                >
                  {m === "strict" ? "严格模式" : "宽松模式"}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-foreground/45">
              {mode === "strict"
                ? "打错即重置当前词，从头开始"
                : "允许退格修正，输完整体比对"}
            </p>
          </div>

          {/* 每轮单词数量 */}
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-medium text-foreground/50">
              每轮单词数量
            </h3>
            <div className="relative">
              <input
                type="range"
                min={WORDS_PER_ROUND_MIN}
                max={WORDS_PER_ROUND_MAX}
                step={WORDS_PER_ROUND_STEP}
                value={wordsPerRound}
                onChange={(e) => onWordsPerRoundChange(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="mt-1 flex justify-between text-xs text-foreground/50">
                <span>{WORDS_PER_ROUND_MIN}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    background: "oklch(0.55 0.195 252 / 0.1)",
                    color: "oklch(0.55 0.195 252)",
                  }}
                >
                  {wordsPerRound}
                </span>
                <span>{WORDS_PER_ROUND_MAX}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

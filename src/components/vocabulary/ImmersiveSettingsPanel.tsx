import { useEffect, useState } from "react";
import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { useSettingsStore } from "@/stores/settings-store";
import { cn } from "@/lib/utils";
import { WORDS_PER_ROUND_MIN, WORDS_PER_ROUND_MAX, WORDS_PER_ROUND_STEP } from "@/lib/constants";
import {
  X,
  ALargeSmall,
  Hash,
  ArrowUp,
  ArrowDown,
  Minus,
  Plus,
} from "lucide-react";

interface ImmersiveSettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ImmersiveSettingsPanel({ open, onClose }: ImmersiveSettingsPanelProps) {
  const typingMode = useVocabularySessionStore((s) => s.typingMode);
  const setTypingMode = useVocabularySessionStore((s) => s.setTypingMode);
  const wordsPerRound = useVocabularySessionStore((s) => s.wordsPerRound);
  const setWordsPerRound = useVocabularySessionStore((s) => s.setWordsPerRound);
  const progressBarPosition = useSettingsStore(
    (s) => s.preferences.progressBarPosition ?? "top"
  );
  const setPreferences = useSettingsStore((s) => s.setPreferences);

  const [showWordAdjuster, setShowWordAdjuster] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // 关闭浮条时重置子面板状态
  useEffect(() => {
    if (!open) setShowWordAdjuster(false);
  }, [open]);

  if (!open) return null;

  const toggleTypingMode = () => {
    setTypingMode(typingMode === "strict" ? "loose" : "strict");
  };

  const toggleProgressPosition = () => {
    setPreferences({
      progressBarPosition: progressBarPosition === "top" ? "bottom" : "top",
    });
  };

  const adjustWords = (delta: number) => {
    const next = wordsPerRound + delta;
    if (next >= WORDS_PER_ROUND_MIN && next <= WORDS_PER_ROUND_MAX) {
      setWordsPerRound(next);
    }
  };

  return (
    <div className="absolute inset-0 z-30">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/10" onClick={onClose} />

      {/* 图标浮条 — 设置在右上角按钮左侧 */}
      <div className="absolute top-3 right-12 z-40 flex items-center gap-0.5 rounded-lg border border-border bg-card px-1 py-1 shadow-sm animate-slide-in-right">
        {/* 打字模式 */}
        <button
          onClick={toggleTypingMode}
          title={typingMode === "strict" ? "严格模式（点按切换）" : "宽松模式（点按切换）"}
          className={cn(
            "rounded-md p-2 transition-colors hover:bg-muted",
            typingMode === "strict"
              ? "text-indigo-500"
              : "text-muted-foreground"
          )}
        >
          <ALargeSmall className="h-4 w-4" />
        </button>

        {/* 词数调整器 */}
        <div className="relative flex items-center">
          {showWordAdjuster ? (
            <div className="flex items-center gap-0.5 animate-fade-in">
              <button
                onClick={() => adjustWords(-WORDS_PER_ROUND_STEP)}
                disabled={wordsPerRound <= WORDS_PER_ROUND_MIN}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                title="减少"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-[2ch] text-center text-xs font-mono font-medium text-foreground tabular-nums">
                {wordsPerRound}
              </span>
              <button
                onClick={() => adjustWords(WORDS_PER_ROUND_STEP)}
                disabled={wordsPerRound >= WORDS_PER_ROUND_MAX}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                title="增加"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowWordAdjuster(true)}
              title={`每轮 ${wordsPerRound} 词（点按调整）`}
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Hash className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* 进度条位置 */}
        <button
          onClick={toggleProgressPosition}
          title={progressBarPosition === "top" ? "进度条在上方（点按切换）" : "进度条在下方（点按切换）"}
          className={cn(
            "rounded-md p-2 transition-colors hover:bg-muted",
            "text-muted-foreground"
          )}
        >
          {progressBarPosition === "top" ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )}
        </button>

        {/* 分隔 */}
        <div className="mx-0.5 h-5 w-px bg-border" />

        {/* 关闭 */}
        <button
          onClick={onClose}
          title="关闭设置"
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

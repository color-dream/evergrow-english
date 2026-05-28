import { useEffect, useState, useRef } from "react";
import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { useSettingsStore } from "@/stores/settings-store";
import { cn } from "@/lib/utils";
import { WORDS_PER_ROUND_MIN, WORDS_PER_ROUND_MAX, WORDS_PER_ROUND_STEP } from "@/lib/constants";
import { Settings, X, ALargeSmall, Hash, ArrowUp, ArrowDown, Minus, Plus } from "lucide-react";

interface ImmersiveSettingsPanelProps {
  open: boolean;
  onToggle: () => void;
}

export function ImmersiveSettingsPanel({ open, onToggle }: ImmersiveSettingsPanelProps) {
  const typingMode = useVocabularySessionStore((s) => s.typingMode);
  const setTypingMode = useVocabularySessionStore((s) => s.setTypingMode);
  const wordsPerRound = useVocabularySessionStore((s) => s.wordsPerRound);
  const setWordsPerRound = useVocabularySessionStore((s) => s.setWordsPerRound);
  const progressBarPosition = useSettingsStore(
    (s) => s.preferences.progressBarPosition ?? "top"
  );
  const setPreferences = useSettingsStore((s) => s.setPreferences);

  const panelRef = useRef<HTMLDivElement>(null);
  const [showWordAdjuster, setShowWordAdjuster] = useState(false);

  // 展开时点击外部关闭
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onToggle();
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open, onToggle]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onToggle();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onToggle]);

  // 关闭时重置子面板状态
  useEffect(() => {
    if (!open) setShowWordAdjuster(false);
  }, [open]);

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

  const springEasing = "cubic-bezier(0.34, 1.56, 0.64, 1)";

  return (
    <div
      ref={panelRef}
      className="absolute top-4 right-4 z-40 flex items-center gap-1 rounded-full transition-all duration-[400ms]"
      style={{
        background: "var(--glass-sheet-bg)",
        backdropFilter:
          "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
        WebkitBackdropFilter:
          "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
        border: "1px solid var(--glass-sheet-border)",
        boxShadow: open ? "var(--shadow-lg)" : "var(--shadow-sm)",
        color: "var(--color-foreground)",
        paddingLeft: open ? "0.5rem" : "0",
        paddingRight: open ? "0.5rem" : "0",
        transitionTimingFunction: springEasing,
      }}
    >
      {/* 设置项区域 — max-width 动画展开/收起 */}
      <div
        className={cn(
          "flex items-center gap-1 overflow-hidden transition-all duration-[400ms]",
          open ? "max-w-[20rem] opacity-100" : "max-w-0 opacity-0"
        )}
        style={{ transitionTimingFunction: springEasing }}
      >
        {/* 打字模式 */}
        <button
          onClick={toggleTypingMode}
          title={typingMode === "strict" ? "严格模式（点按切换）" : "宽松模式（点按切换）"}
          className={cn(
            "rounded-full p-2 transition-all duration-300 hover:scale-105 active:scale-95 shrink-0",
            typingMode === "strict"
              ? "text-primary"
              : "text-foreground/50 hover:text-foreground"
          )}
        >
          <ALargeSmall className="h-4 w-4" />
        </button>

        {/* 词数调整器 */}
        <div className="relative flex items-center shrink-0">
          {showWordAdjuster ? (
            <div className="flex items-center gap-0.5 animate-fade-in">
              <button
                onClick={() => adjustWords(-WORDS_PER_ROUND_STEP)}
                disabled={wordsPerRound <= WORDS_PER_ROUND_MIN}
                className="rounded-full p-1.5 text-foreground/60 transition-all duration-300 hover:text-foreground hover:scale-105 disabled:opacity-30"
                title="减少"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-[2ch] text-center text-xs font-mono font-semibold text-foreground tabular-nums">
                {wordsPerRound}
              </span>
              <button
                onClick={() => adjustWords(WORDS_PER_ROUND_STEP)}
                disabled={wordsPerRound >= WORDS_PER_ROUND_MAX}
                className="rounded-full p-1.5 text-foreground/60 transition-all duration-300 hover:text-foreground hover:scale-105 disabled:opacity-30"
                title="增加"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowWordAdjuster(true)}
              title={`每轮 ${wordsPerRound} 词（点按调整）`}
              className="rounded-full p-2 text-foreground/50 transition-all duration-300 hover:text-foreground hover:scale-105"
            >
              <Hash className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* 进度条位置 */}
        <button
          onClick={toggleProgressPosition}
          title={progressBarPosition === "top" ? "进度条在上方（点按切换）" : "进度条在下方（点按切换）"}
          className="rounded-full p-2 text-foreground/50 transition-all duration-300 hover:text-foreground hover:scale-105 active:scale-95 shrink-0"
        >
          {progressBarPosition === "top" ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* 触发按钮 — 始终显示 */}
      <button
        onClick={onToggle}
        className="rounded-full p-2 transition-all duration-300 hover:scale-105 active:scale-95 shrink-0 text-foreground/60 hover:text-foreground"
        title={open ? "关闭设置" : "设置"}
      >
        {open ? (
          <X className="h-4 w-4" />
        ) : (
          <Settings className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

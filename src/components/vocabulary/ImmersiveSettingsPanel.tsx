import { useEffect, useState, useRef } from "react";
import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { useSettingsStore } from "@/stores/settings-store";
import { cn } from "@/lib/utils";
import { WORDS_PER_ROUND_MIN, WORDS_PER_ROUND_MAX, WORDS_PER_ROUND_STEP } from "@/lib/constants";
import { Settings, X, Hash, ArrowUp, ArrowDown, Check } from "lucide-react";

interface ImmersiveSettingsPanelProps {
  open: boolean;
  onToggle: () => void;
}

export function ImmersiveSettingsPanel({ open, onToggle }: ImmersiveSettingsPanelProps) {
  const wordsPerRound = useVocabularySessionStore((s) => s.wordsPerRound);
  const setWordsPerRound = useVocabularySessionStore((s) => s.setWordsPerRound);
  const progressBarPosition = useSettingsStore(
    (s) => s.preferences.progressBarPosition ?? "top"
  );
  const pronunciation = useSettingsStore((s) => s.preferences.pronunciation);
  const setPreferences = useSettingsStore((s) => s.setPreferences);

  const panelRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showWordDropdown, setShowWordDropdown] = useState(false);

  // 下拉选项
  const wordOptions: number[] = [];
  for (let n = WORDS_PER_ROUND_MIN; n <= WORDS_PER_ROUND_MAX; n += WORDS_PER_ROUND_STEP) {
    wordOptions.push(n);
  }

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
    if (!open) setShowWordDropdown(false);
  }, [open]);

  // 下拉展开时点击外部关闭
  useEffect(() => {
    if (!showWordDropdown) return;
    const onMouseDown = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowWordDropdown(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [showWordDropdown]);

  const toggleProgressPosition = () => {
    setPreferences({
      progressBarPosition: progressBarPosition === "top" ? "bottom" : "top",
    });
  };

  const togglePronunciation = () => {
    setPreferences({
      pronunciation: pronunciation === "us" ? "uk" : "us",
    });
  };

  const springEasing = "cubic-bezier(0.34, 1.56, 0.64, 1)";

  return (
    <div
      ref={panelRef}
      className={cn(
        "absolute top-4 right-4 z-40 flex items-center rounded-full transition-all duration-[400ms]",
        open && "gap-1"
      )}
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
        {/* 词数选择器 */}
        <div ref={dropdownRef} className="relative flex items-center shrink-0">
          <button
            onClick={() => setShowWordDropdown(!showWordDropdown)}
            title={`每轮 ${wordsPerRound} 词（点按选择）`}
            className="rounded-full p-2 text-foreground/50 transition-all duration-300 hover:text-foreground hover:scale-105"
          >
            <Hash className="h-4 w-4" />
          </button>
          {showWordDropdown && (
            <div
              className="absolute left-0 top-full mt-1 animate-fade-in overflow-hidden rounded-2xl py-1"
              style={{
                background: "var(--glass-sheet-bg)",
                backdropFilter: "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
                WebkitBackdropFilter: "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
                border: "1px solid var(--glass-sheet-border)",
                boxShadow: "var(--shadow-lg)",
                minWidth: "4rem",
              }}
            >
              {wordOptions.map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    setWordsPerRound(n);
                    setShowWordDropdown(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-4 py-1.5 text-sm transition-colors duration-150 hover:bg-foreground/5",
                    n === wordsPerRound ? "text-primary" : "text-foreground/60"
                  )}
                >
                  <span className="font-mono tabular-nums">{n}</span>
                  {n === wordsPerRound && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
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

        {/* 英美音切换 */}
        <button
          onClick={togglePronunciation}
          title={pronunciation === "us" ? "美式发音（点按切换）" : "英式发音（点按切换）"}
          className="rounded-full p-2 transition-all duration-300 hover:scale-105 active:scale-95 shrink-0 text-foreground/60 hover:text-foreground"
        >
          <span className="flex h-4 w-4 items-center justify-center text-xs font-mono font-bold tabular-nums">
            {pronunciation === "us" ? "美" : "英"}
          </span>
        </button>
      </div>

      {/* 触发按钮 — 始终显示 */}
      <button
        onClick={onToggle}
        className="rounded-full p-2 transition-all duration-300 hover:scale-105 active:scale-95 shrink-0 text-foreground/60 hover:text-foreground"
        title={open ? "关闭设置" : "设置"}
      >
        <span className="relative flex h-4 w-4">
          <X
            className={cn(
              "absolute inset-0 h-4 w-4 transition-all duration-300",
              open ? "opacity-100 rotate-0" : "opacity-0 rotate-90"
            )}
          />
          <Settings
            className={cn(
              "absolute inset-0 h-4 w-4 transition-all duration-300",
              open ? "opacity-0 -rotate-90" : "opacity-100 rotate-0"
            )}
          />
        </span>
      </button>
    </div>
  );
}

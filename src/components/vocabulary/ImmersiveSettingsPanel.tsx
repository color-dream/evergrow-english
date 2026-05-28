import { useEffect } from "react";
import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { useSettingsStore } from "@/stores/settings-store";
import { cn } from "@/lib/utils";
import { WORDS_PER_ROUND_MIN, WORDS_PER_ROUND_MAX, WORDS_PER_ROUND_STEP } from "@/lib/constants";
import type { TypingMode } from "@/types/vocabulary";
import { X } from "lucide-react";

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

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-30">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/10" onClick={onClose} />
      {/* 右侧滑入面板 */}
      <div className="absolute top-0 right-0 h-full w-72 max-w-[80vw] border-l border-border bg-card shadow-lg animate-slide-in-right">
        {/* 标题栏 */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-base font-semibold text-foreground">学习设置</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 px-4 py-5">
          {/* 打字模式 */}
          <section>
            <h4 className="mb-3 text-sm font-medium text-muted-foreground">
              打字模式
            </h4>
            <div className="flex rounded-lg border border-border p-0.5">
              {(["strict", "loose"] as TypingMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setTypingMode(m)}
                  className={cn(
                    "flex-1 rounded-md py-1.5 text-sm font-medium transition-all",
                    typingMode === m
                      ? "bg-indigo-400 text-white"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m === "strict" ? "严格" : "宽松"}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {typingMode === "strict"
                ? "打错即重置当前词，从头开始"
                : "允许退格修正，输完整体比对"}
            </p>
          </section>

          {/* 每轮单词数量 */}
          <section>
            <h4 className="mb-3 text-sm font-medium text-muted-foreground">
              每轮单词数量
            </h4>
            <input
              type="range"
              min={WORDS_PER_ROUND_MIN}
              max={WORDS_PER_ROUND_MAX}
              step={WORDS_PER_ROUND_STEP}
              value={wordsPerRound}
              onChange={(e) => setWordsPerRound(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>{WORDS_PER_ROUND_MIN}</span>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
                {wordsPerRound}
              </span>
              <span>{WORDS_PER_ROUND_MAX}</span>
            </div>
          </section>

          {/* 进度条位置 */}
          <section>
            <h4 className="mb-3 text-sm font-medium text-muted-foreground">
              进度条位置
            </h4>
            <div className="flex rounded-lg border border-border p-0.5">
              {(["top", "bottom"] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => setPreferences({ progressBarPosition: pos })}
                  className={cn(
                    "flex-1 rounded-md py-1.5 text-sm font-medium transition-all",
                    progressBarPosition === pos
                      ? "bg-indigo-400 text-white"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {pos === "top" ? "上方" : "下方"}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

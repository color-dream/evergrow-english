import { useState } from "react";
import { WORDS_PER_ROUND_MIN, WORDS_PER_ROUND_MAX, WORDS_PER_ROUND_STEP } from "@/lib/constants";
import { X } from "lucide-react";

interface PreSettingsDialogProps {
  open: boolean;
  bookName: string;
  initialWordsPerRound: number;
  onConfirm: (wordsPerRound: number) => void;
  onCancel: () => void;
}

export function PreSettingsDialog({
  open,
  bookName,
  initialWordsPerRound,
  onConfirm,
  onCancel,
}: PreSettingsDialogProps) {
  const [selected, setSelected] = useState(initialWordsPerRound);

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
        onClick={onCancel}
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
            onClick={onCancel}
            className="absolute right-4 top-4 rounded-full p-1.5 text-foreground/40 transition-all duration-300 hover:text-foreground hover:scale-110"
          >
            <X className="h-4 w-4" />
          </button>

          <h2 className="mb-1 text-lg font-bold">选择每轮单词数量</h2>
          <p className="mb-6 text-sm text-foreground/55">
            单词本：{bookName}
          </p>

          <div className="mb-6">
            <div className="relative">
              <input
                type="range"
                min={WORDS_PER_ROUND_MIN}
                max={WORDS_PER_ROUND_MAX}
                step={WORDS_PER_ROUND_STEP}
                value={selected}
                onChange={(e) => setSelected(Number(e.target.value))}
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
                  {selected}
                </span>
                <span>{WORDS_PER_ROUND_MAX}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onConfirm(selected)}
            className="w-full rounded-full py-2.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, oklch(0.55 0.195 252), oklch(0.5 0.17 265))",
              boxShadow: "0 4px 16px oklch(0.55 0.195 252 / 0.35)",
            }}
          >
            开始学习
          </button>
        </div>
      </div>
    </div>
  );
}

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
        className="absolute inset-0 bg-gray-300 opacity-80 dark:bg-gray-600"
        onClick={onCancel}
      />
      <div className="flex h-screen items-center justify-center">
        <div className="my-card relative w-[90vw] max-w-md rounded-2xl bg-card p-6 shadow-my-card animate-fade-in">
          <button
            onClick={onCancel}
            className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>

          <h2 className="mb-1 text-lg font-bold">选择每轮单词数量</h2>
          <p className="mb-6 text-sm text-muted-foreground">
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
                className="w-full accent-indigo-500"
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>{WORDS_PER_ROUND_MIN}</span>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
                  {selected}
                </span>
                <span>{WORDS_PER_ROUND_MAX}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onConfirm(selected)}
            className="w-full rounded-lg bg-indigo-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-600"
          >
            开始学习
          </button>
        </div>
      </div>
    </div>
  );
}

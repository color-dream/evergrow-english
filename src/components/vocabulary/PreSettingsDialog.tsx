import { useState } from "react";
import { WORDS_PER_ROUND_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
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
            <div className="flex gap-2">
              {WORDS_PER_ROUND_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setSelected(n)}
                  className={cn(
                    "flex-1 rounded-lg border py-2 text-sm font-medium transition-all",
                    selected === n
                      ? "border-indigo-400 bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300"
                      : "border-border text-muted-foreground hover:border-muted-foreground/40"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              共 {selected} 个单词 × 4 种模式 = {selected * 4} 个练习任务
            </p>
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

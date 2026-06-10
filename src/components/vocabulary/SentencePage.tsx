import { SENTENCE_BOOK_OPTIONS } from "@/lib/sentence-book-registry";
import type { SentenceBookId } from "@/types/sentence";
import { MessageSquareText } from "lucide-react";
import { DIFFICULTY_LABELS, BASE_PATH } from "@/lib/constants";

const bookAccent: Record<string, { accent: string; bg: string }> = {
  "xingrong-1": { accent: "oklch(0.55 0.195 252)", bg: "oklch(0.55 0.195 252 / 0.08)" },
  "xingrong-2": { accent: "oklch(0.52 0.16 285)", bg: "oklch(0.52 0.16 285 / 0.08)" },
  "xingrong-3": { accent: "oklch(0.56 0.19 148)", bg: "oklch(0.56 0.19 148 / 0.08)" },
  "xingrong-4": { accent: "oklch(0.72 0.18 85)", bg: "oklch(0.72 0.18 85 / 0.08)" },
  "xingrong-5": { accent: "oklch(0.52 0.18 325)", bg: "oklch(0.52 0.18 325 / 0.08)" },
};

const glassCardStyle = {
  background: "var(--glass-card-bg)",
  backdropFilter: "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
  WebkitBackdropFilter: "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
  border: "1px solid var(--glass-card-border)",
} as const;

export function SentencePage() {
  const handleSelectBook = (id: SentenceBookId) => {
    const win = window.open(
      `${BASE_PATH}learn-sentence?bookId=${id}`,
      "_blank",
    );
    if (!win) {
      alert("页面被浏览器拦截，请允许弹窗后重试。");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 animate-fade-in">
      <div className="mb-8 animate-spring-up">
        <h1 className="text-2xl font-bold text-foreground">句子打字</h1>
        <p className="mt-2 text-sm text-foreground/50">
          逐词输入整句英语，理解语法结构。每句标注了主语、谓语、宾语等成分，打字的同时学习语法。
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 justify-items-center">
        {SENTENCE_BOOK_OPTIONS.map((book) => {
          const theme = bookAccent[book.id] ?? bookAccent["daily-a1"];
          return (
            <button
              key={book.id}
              onClick={() => handleSelectBook(book.id)}
              className="group flex w-full max-w-[260px] flex-col rounded-2xl p-5 text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                ...glassCardStyle,
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {/* 图标 + 等级标签 */}
              <div className="mb-3 flex items-center justify-between">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105"
                  style={{ background: theme.bg }}
                >
                  <MessageSquareText className="h-5 w-5" style={{ color: theme.accent }} />
                </div>
                <span
                  className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap"
                  style={{ background: theme.bg, color: theme.accent }}
                >
                  {DIFFICULTY_LABELS[book.level]}
                </span>
              </div>

              {/* 标题 */}
              <h3 className="truncate text-[15px] font-bold text-foreground leading-snug">
                {book.label}
              </h3>

              {/* 描述 */}
              <p className="mt-0.5 truncate text-xs text-foreground/45">
                {book.description}
              </p>

              {/* 统计 */}
              <p className="mt-0.5 font-mono text-xs text-foreground/30 tabular-nums whitespace-nowrap">
                {book.courseCount} 课
              </p>

              {/* 主题标签 */}
              <div className="mt-3 flex items-center gap-1.5">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: theme.bg, color: theme.accent }}
                >
                  {book.level}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

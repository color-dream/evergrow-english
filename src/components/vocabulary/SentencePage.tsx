import { SENTENCE_BOOK_OPTIONS } from "@/lib/sentence-book-registry";
import type { SentenceBookId } from "@/types/sentence";
import { MessageSquareText, ChevronRight } from "lucide-react";
import { DIFFICULTY_LABELS, ROUTES } from "@/lib/constants";
import { useNavigate } from "react-router-dom";

/** 按 bookId 预设的课程总数统计 */
const BOOK_TOTAL_STATEMENTS: Record<string, number> = {
  xingrong: 8865,
};

const glassCardStyle = {
  background: "var(--glass-card-bg)",
  backdropFilter: "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
  WebkitBackdropFilter: "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
  border: "1px solid var(--glass-card-border)",
} as const;

const theme = { accent: "oklch(0.55 0.195 252)", bg: "oklch(0.55 0.195 252 / 0.08)" };

export function SentencePage() {
  const navigate = useNavigate();

  const handleSelectBook = (id: SentenceBookId) => {
    navigate(ROUTES.SENTENCE_COURSES.replace(":bookId", id));
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 animate-fade-in">
      {/* 页面标题 */}
      <div className="mb-8 animate-spring-up">
        <h1 className="text-2xl font-bold text-foreground">句子打字</h1>
        <p className="mt-2 text-sm text-foreground/50">
          逐词输入整句英语，采用星荣零基础英语课程，从单词到完整句渐进式学习。
        </p>
      </div>

      {/* 卡片列表 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SENTENCE_BOOK_OPTIONS.map((book) => {
          const totalStmts = BOOK_TOTAL_STATEMENTS[book.id] ?? 0;
          return (
            <button
              key={book.id}
              onClick={() => handleSelectBook(book.id)}
              className="group flex flex-col rounded-2xl p-6 text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                ...glassCardStyle,
                boxShadow: "var(--shadow-md)",
              }}
            >
              {/* 图标 + 等级 */}
              <div className="mb-4 flex items-center justify-between">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105"
                  style={{ background: theme.bg }}
                >
                  <MessageSquareText className="h-6 w-6" style={{ color: theme.accent }} />
                </div>
                <span
                  className="shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold"
                  style={{ background: theme.bg, color: theme.accent }}
                >
                  {DIFFICULTY_LABELS[book.level]}
                </span>
              </div>

              {/* 标题 */}
              <h3 className="text-lg font-bold text-foreground leading-snug">
                {book.title}
              </h3>

              {/* 描述 */}
              <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-foreground/45">
                {book.description}
              </p>

              {/* 统计信息 */}
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-xl font-bold" style={{ color: theme.accent }}>
                    {book.courseCount}
                  </span>
                  <span className="text-xs text-foreground/35">课</span>
                </div>
                <div className="h-4 w-px rounded-full bg-foreground/10" />
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-lg font-semibold text-foreground/55">
                    {totalStmts.toLocaleString()}
                  </span>
                  <span className="text-xs text-foreground/30">句</span>
                </div>
              </div>

              {/* 底部标签 + 箭头 */}
              <div className="mt-4 flex items-center justify-between">
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-medium"
                  style={{ background: theme.bg, color: theme.accent }}
                >
                  零基础 → 中高级
                </span>
                <ChevronRight className="h-4 w-4 text-foreground/20 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-foreground/40" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

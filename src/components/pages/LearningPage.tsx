import { useCallback, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookMarked,
  MessageSquareText,
  ChevronRight,
} from "lucide-react";
import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { useWordBookStats } from "@/hooks/useWordBookStats";
import { WORD_BOOK_OPTIONS } from "@/lib/word-book-registry";
import { WordBookCard } from "@/components/vocabulary/WordBookCard";
import { SENTENCE_BOOK_OPTIONS } from "@/lib/sentence-book-registry";
import { DIFFICULTY_LABELS, ROUTES, BASE_PATH, DEFAULT_WORDS_PER_ROUND } from "@/lib/constants";
import type { WordBookId } from "@/types/vocabulary";
import type { SentenceBookId } from "@/types/sentence";

// ── 玻璃卡片样式 ──
const glassCardStyle = {
  background: "var(--glass-card-bg)",
  backdropFilter: "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
  WebkitBackdropFilter: "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
  border: "1px solid var(--glass-card-border)",
} as const;

// ── 句子课程统计 ──
const BOOK_TOTAL_STATEMENTS: Record<string, number> = {
  xingrong: 8865,
};

const sentenceTheme = {
  accent: "oklch(0.55 0.195 252)",
  bg: "oklch(0.55 0.195 252 / 0.08)",
};

type LearningTab = "vocab" | "sentence";

export function LearningPage() {
  const navigate = useNavigate();

  // ── Tab 切换 ──
  const [activeTab, setActiveTab] = useState<LearningTab>("vocab");

  // ── 词汇书统计数据 ──
  const { stats, isLoading } = useWordBookStats();
  const { inProgress, notStarted } = useMemo(() => {
    const ip: typeof WORD_BOOK_OPTIONS = [];
    const ns: typeof WORD_BOOK_OPTIONS = [];
    for (const book of WORD_BOOK_OPTIONS) {
      const s = stats.get(book.id);
      if (s && s.totalCards > 0) {
        ip.push(book);
      } else {
        ns.push(book);
      }
    }
    return { inProgress: ip, notStarted: ns };
  }, [stats]);

  // ── 词汇书：点击 → 直接打开学习窗口（默认每轮词数） ──
  const handleSelectBook = useCallback((id: WordBookId) => {
    const store = useVocabularySessionStore.getState();
    store.setWordsPerRound(DEFAULT_WORDS_PER_ROUND);
    const win = window.open(`${BASE_PATH}learn?bookId=${id}`, "_blank");
    if (!win) {
      alert("页面被浏览器拦截，请允许弹窗后重试。");
    }
  }, []);

  // ── 句子书：点击 → 跳转课程列表 ──
  const handleSelectSentenceBook = useCallback(
    (id: SentenceBookId) => {
      navigate(ROUTES.SENTENCE_COURSES.replace(":bookId", id));
    },
    [navigate],
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 animate-fade-in">
      {/* ==================== Tab 切换栏 ==================== */}
      <div className="mb-8 flex items-center justify-center animate-spring-up">
        <div
          className="inline-flex items-center gap-0.5 rounded-full p-1"
          style={{
            background: "var(--glass-pill-bg)",
            backdropFilter: "blur(var(--glass-pill-blur)) saturate(1.8)",
            WebkitBackdropFilter: "blur(var(--glass-pill-blur)) saturate(1.8)",
            border: "1px solid var(--glass-pill-border)",
          }}
        >
          <button
            onClick={() => setActiveTab("vocab")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.97] ${
              activeTab === "vocab"
                ? "bg-primary/10 text-primary"
                : "text-foreground/50 hover:text-foreground"
            }`}
          >
            <BookMarked className="h-4 w-4" />
            词汇
          </button>
          <button
            onClick={() => setActiveTab("sentence")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.97] ${
              activeTab === "sentence"
                ? "bg-primary/10 text-primary"
                : "text-foreground/50 hover:text-foreground"
            }`}
          >
            <MessageSquareText className="h-4 w-4" />
            句子
          </button>
        </div>
      </div>

      {/* ==================== 词汇打字区 ==================== */}
      {activeTab === "vocab" && (
        <section className="animate-spring-up">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {WORD_BOOK_OPTIONS.map((book) => (
                <div
                  key={book.id}
                  className="h-52 w-full max-w-[260px] animate-pulse rounded-2xl"
                  style={{
                    background: "var(--glass-card-bg)",
                    border: "1px solid var(--glass-card-border)",
                  }}
                />
              ))}
            </div>
          ) : (
            <>
              {inProgress.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-semibold text-foreground/50">
                    进行中
                  </h3>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 justify-items-center">
                    {inProgress.map((book) => (
                      <WordBookCard
                        key={book.id}
                        meta={book}
                        stats={stats.get(book.id)}
                        onSelect={() => handleSelectBook(book.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {notStarted.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-foreground/50">
                    未开始
                  </h3>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 justify-items-center">
                    {notStarted.map((book) => (
                      <WordBookCard
                        key={book.id}
                        meta={book}
                        stats={stats.get(book.id)}
                        onSelect={() => handleSelectBook(book.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ==================== 句子打字区 ==================== */}
      {activeTab === "sentence" && (
        <section className="animate-spring-up">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SENTENCE_BOOK_OPTIONS.map((book) => {
              const totalStmts = BOOK_TOTAL_STATEMENTS[book.id] ?? 0;
              return (
                <button
                  key={book.id}
                  onClick={() => handleSelectSentenceBook(book.id)}
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
                      style={{ background: sentenceTheme.bg }}
                    >
                      <MessageSquareText
                        className="h-6 w-6"
                        style={{ color: sentenceTheme.accent }}
                      />
                    </div>
                    <span
                      className="shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold"
                      style={{
                        background: sentenceTheme.bg,
                        color: sentenceTheme.accent,
                      }}
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
                      <span
                        className="font-mono text-xl font-bold"
                        style={{ color: sentenceTheme.accent }}
                      >
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
                      style={{
                        background: sentenceTheme.bg,
                        color: sentenceTheme.accent,
                      }}
                    >
                      零基础 → 中高级
                    </span>
                    <ChevronRight className="h-4 w-4 text-foreground/20 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-foreground/40" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}

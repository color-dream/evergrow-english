import { useCallback, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookMarked,
  MessageSquareText,
  ChevronRight,
} from "lucide-react";
import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useWordBookStats } from "@/hooks/useWordBookStats";
import { WORD_BOOK_OPTIONS } from "@/lib/word-book-registry";
import { WordBookCard } from "@/components/vocabulary/WordBookCard";
import { PreSettingsDialog } from "@/components/vocabulary/PreSettingsDialog";
import { SENTENCE_BOOK_OPTIONS } from "@/lib/sentence-book-registry";
import { DIFFICULTY_LABELS, ROUTES, BASE_PATH } from "@/lib/constants";
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

export function LearningPage() {
  const navigate = useNavigate();
  const wordsPerRound = useVocabularySessionStore((s) => s.wordsPerRound);

  // ── 词汇书 pre-settings 弹窗 ──
  const [preSettingsBookId, setPreSettingsBookId] =
    useState<WordBookId | null>(null);

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

  // ── 词汇书：选择已开始的书 → 直接打开新窗口 ──
  const handleOpenInProgressBook = useCallback((id: WordBookId) => {
    const win = window.open(`${BASE_PATH}learn?bookId=${id}`, "_blank");
    if (!win) {
      alert("页面被浏览器拦截，请允许弹窗后重试。");
    }
  }, []);

  // ── 词汇书：选择未开始的书 → 弹出设置对话框 ──
  const handleSelectBook = useCallback((id: WordBookId) => {
    setPreSettingsBookId(id);
  }, []);

  // ── 词汇书：设置确认 → 打开学习窗口 ──
  const handlePreSettingsConfirm = useCallback(
    (wordsPerRoundValue: number) => {
      const store = useVocabularySessionStore.getState();
      store.setWordsPerRound(wordsPerRoundValue);
      const bookId = preSettingsBookId;
      setPreSettingsBookId(null);
      if (!bookId) return;

      useSettingsStore.getState().setBookWordsPerRound(bookId, wordsPerRoundValue);

      const win = window.open(`${BASE_PATH}learn?bookId=${bookId}`, "_blank");
      if (!win) {
        alert("页面被浏览器拦截，请允许弹窗后重试。");
      }
    },
    [preSettingsBookId],
  );

  const handlePreSettingsCancel = useCallback(() => {
    setPreSettingsBookId(null);
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
      {/* ==================== 词汇打字区 ==================== */}
      <section className="animate-spring-up">
        <div className="mb-4 flex items-center gap-2">
          <BookMarked className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">词汇打字</h2>
          <span className="text-xs text-foreground/35">逐字母输入，强化拼写记忆</span>
        </div>

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
                      onSelect={() => handleOpenInProgressBook(book.id)}
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

      {/* ==================== 分隔线 ==================== */}
      <div className="my-10 flex items-center gap-4">
        <div className="h-px flex-1 rounded-full bg-foreground/8" />
        <span className="shrink-0 text-xs font-medium text-foreground/25">
          更多练习
        </span>
        <div className="h-px flex-1 rounded-full bg-foreground/8" />
      </div>

      {/* ==================== 句子打字区 ==================== */}
      <section
        className="animate-spring-up"
        style={{
          animation: "spring-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both",
        }}
      >
        <div className="mb-4 flex items-center gap-2">
          <MessageSquareText
            className="h-5 w-5"
            style={{ color: sentenceTheme.accent }}
          />
          <h2 className="text-lg font-bold text-foreground">句子打字</h2>
          <span className="text-xs text-foreground/35">
            逐词输入整句，理解语法结构
          </span>
        </div>

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

      {/* PreSettingsDialog */}
      {preSettingsBookId && (
        <PreSettingsDialog
          open={true}
          bookName={WORD_BOOK_OPTIONS.find((b) => b.id === preSettingsBookId)
            ?.label ?? ""}
          initialWordsPerRound={wordsPerRound}
          onConfirm={handlePreSettingsConfirm}
          onCancel={handlePreSettingsCancel}
        />
      )}
    </div>
  );
}

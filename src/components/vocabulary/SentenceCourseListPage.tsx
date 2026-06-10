import { useParams, useNavigate } from "react-router-dom";
import {
  getCourseInfosForBook,
  SENTENCE_BOOK_META,
} from "@/lib/sentence-book-registry";
import type { SentenceBookId } from "@/types/sentence";
import { DIFFICULTY_LABELS, BASE_PATH, ROUTES } from "@/lib/constants";
import { ArrowLeft, BookOpen, Hash } from "lucide-react";

const glassCardStyle = {
  background: "var(--glass-card-bg)",
  backdropFilter: "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
  WebkitBackdropFilter: "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
  border: "1px solid var(--glass-card-border)",
} as const;

const levelAccent: Record<string, { accent: string; bg: string; label: string }> = {
  A1: { accent: "oklch(0.55 0.195 252)", bg: "oklch(0.55 0.195 252 / 0.08)", label: "入门" },
  A2: { accent: "oklch(0.52 0.16 285)", bg: "oklch(0.52 0.16 285 / 0.08)", label: "基础" },
  B1: { accent: "oklch(0.56 0.19 148)", bg: "oklch(0.56 0.19 148 / 0.08)", label: "中级" },
  B2: { accent: "oklch(0.52 0.18 325)", bg: "oklch(0.52 0.18 325 / 0.08)", label: "进阶" },
};

export function SentenceCourseListPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();

  if (!bookId || !(bookId in SENTENCE_BOOK_META)) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12 text-center">
        <p className="text-lg text-foreground">未找到该分册</p>
        <button
          onClick={() => navigate(ROUTES.SENTENCE)}
          className="mt-4 rounded-full bg-primary px-4 py-2 text-sm text-white transition-all duration-300 hover:scale-105 active:scale-95"
        >
          返回课程包列表
        </button>
      </div>
    );
  }

  const id = bookId as SentenceBookId;
  const book = SENTENCE_BOOK_META[id];
  const courses = getCourseInfosForBook(id);
  const totalStmts = courses.reduce((s, c) => s + c.statementCount, 0);

  const handleSelectCourse = (fileName: string) => {
    const win = window.open(
      `${BASE_PATH}learn-sentence?courseId=${fileName}&bookId=${id}`,
      "_blank",
    );
    if (!win) {
      alert("页面被浏览器拦截，请允许弹窗后重试。");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 animate-fade-in">
      {/* 返回 */}
      <button
        onClick={() => navigate(ROUTES.SENTENCE)}
        className="mb-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-foreground/50 transition-all duration-300 hover:text-foreground hover:bg-foreground/5"
      >
        <ArrowLeft className="h-4 w-4" />
        课程包列表
      </button>

      {/* 分册信息头部 */}
      <div className="mb-8 animate-spring-up">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">{book.title}</h1>
          <span
            className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{
              background: levelAccent[book.level]?.bg ?? levelAccent["A1"].bg,
              color: levelAccent[book.level]?.accent ?? levelAccent["A1"].accent,
            }}
          >
            {DIFFICULTY_LABELS[book.level]}
          </span>
        </div>
        <p className="mt-2 text-sm text-foreground/45">{book.description}</p>
        {/* 统计 */}
        <div className="mt-3 flex items-center gap-4 font-mono text-xs text-foreground/35">
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {book.courseCount} 课
          </span>
          <span className="h-3 w-px rounded-full bg-foreground/10" />
          <span className="inline-flex items-center gap-1">
            <Hash className="h-3 w-3" />
            {totalStmts.toLocaleString()} 句
          </span>
        </div>
      </div>

      {/* 难度分区 */}
      {(["A1", "A2", "B1", "B2"] as const).map((level) => {
        const ofLevel = courses.filter((c) => c.level === level);
        if (!ofLevel.length) return null;
        const stmts = ofLevel.reduce((s, c) => s + c.statementCount, 0);
        const theme = levelAccent[level];
        const first = ofLevel[0].courseNum;
        const last = ofLevel[ofLevel.length - 1].courseNum;

        return (
          <div key={level} className="mb-8">
            {/* 难度分区标题 */}
            <div className="mb-3 flex items-center gap-3">
              <div className="h-px flex-1 rounded-full bg-foreground/6" />
              <span
                className="shrink-0 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
                style={{ background: theme.bg, color: theme.accent }}
              >
                {theme.label}（{level}）
                <span className="font-mono text-[10px] opacity-60">
                  第{first}-{last}课 · {stmts}句
                </span>
              </span>
              <div className="h-px flex-1 rounded-full bg-foreground/6" />
            </div>

            {/* 课程卡片网格 */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-2.5">
              {ofLevel.map((course) => (
                <button
                  key={course.fileName}
                  onClick={() => handleSelectCourse(course.fileName)}
                  className="group flex items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    ...glassCardStyle,
                    boxShadow: "0 1px 3px oklch(0.55 0.195 252 / 0.06)",
                  }}
                >
                  {/* 课程序号 */}
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold transition-transform duration-300 group-hover:scale-105"
                    style={{ background: theme.bg, color: theme.accent }}
                  >
                    {course.courseNum}
                  </span>
                  {/* 课名 + 语句数 */}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[13px] font-semibold text-foreground">
                      {course.title}
                    </h3>
                    <p className="mt-0.5 font-mono text-[10px] text-foreground/30">
                      {course.statementCount} 句
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

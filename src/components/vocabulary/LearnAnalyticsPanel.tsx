import { useEffect } from "react";
import { X, TrendingUp } from "lucide-react";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import type { DailyActivity } from "@/hooks/useAnalyticsData";

interface LearnAnalyticsPanelProps {
  open: boolean;
  onClose: () => void;
}

// ── 色彩定义 ──
const masteredColor = "oklch(0.56 0.19 148)";   // green
const learningColor = "oklch(0.72 0.18 85)";     // yellow
const remainingColor = "oklch(0.6 0.01 260 / 0.15)"; // gray

// ── 热力图等级色（primary 饱和度递增） ──
const heatColors = [
  "oklch(0.55 0.195 252 / 0.06)",  // 0: 空
  "oklch(0.55 0.195 252 / 0.18)",  // 1: 低
  "oklch(0.55 0.195 252 / 0.42)",  // 2: 中
  "oklch(0.55 0.195 252 / 0.72)",  // 3: 高
  "oklch(0.55 0.195 252)",         // 4: 最高
];

function heatLevel(total: number): number {
  if (total === 0) return 0;
  if (total <= 5) return 1;
  if (total <= 15) return 2;
  if (total <= 40) return 3;
  return 4;
}

// ── GitHub 风格热力图配置 ──
const HEAT_ROWS = 7;
const MONTH_NAMES = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

export function LearnAnalyticsPanel({ open, onClose }: LearnAnalyticsPanelProps) {
  const { mastered, learning, remaining, totalWords, dailyActivity, forecast, isLoading } =
    useAnalyticsData();

  // ── Escape 关闭 ──
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const progressTotal = mastered + learning + remaining || 1;
  const masteredPct = (mastered / progressTotal) * 100;
  const learningPct = (learning / progressTotal) * 100;

  // ── GitHub 风格热力图：自然年 53 周 × 7 天 ──
  const WEEKS_COUNT = 53;
  const totalCells = WEEKS_COUNT * HEAT_ROWS;

  // 计算需要在前方补几个空位（对齐周一）
  const firstDate = dailyActivity[0]?.date;
  let padLeft = 0;
  if (firstDate) {
    // getDay() 0=Sun, 1=Mon ... 6=Sat；对齐到周一(1)
    const dow = new Date(firstDate).getDay();
    padLeft = dow === 0 ? 6 : dow - 1; // Sunday→6, Monday→0, etc.
  }

  const padded: (DailyActivity | null)[] = [
    ...Array<null>(padLeft).fill(null),
    ...dailyActivity,
    ...Array<null>(Math.max(0, totalCells - dailyActivity.length - padLeft)).fill(null),
  ];

  // 按列（周）分组，每列 7 天
  const weeks: (DailyActivity | null)[][] = [];
  for (let c = 0; c < WEEKS_COUNT; c++) {
    weeks.push(padded.slice(c * HEAT_ROWS, (c + 1) * HEAT_ROWS));
  }

  // 月份标签：找到每月的第一列
  const monthLabels: { col: number; label: string }[] = [];
  let lastMonth = -1;
  for (let c = 0; c < WEEKS_COUNT; c++) {
    const week = weeks[c];
    if (!week) continue;
    const firstDay = week.find((d) => d !== null);
    if (!firstDay) continue;
    const month = new Date(firstDay.date).getMonth();
    if (month !== lastMonth) {
      monthLabels.push({ col: c, label: MONTH_NAMES[month] });
      lastMonth = month;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-4">
      {/* ── 蒙层 ── */}
      <div
        className="absolute inset-0"
        style={{
          background: "oklch(0 0 0 / 0.2)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
        onClick={onClose}
      />

      {/* ── 面板 ── */}
      <div
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl animate-spring-in"
        style={{
          background: "var(--glass-sheet-bg)",
          backdropFilter:
            "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
          WebkitBackdropFilter:
            "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
          border: "1px solid var(--glass-sheet-border)",
          boxShadow: "var(--shadow-2xl)",
        }}
      >
        {/* ── 标题栏 ── */}
        <div
          className="flex h-14 shrink-0 items-center justify-between px-5"
          style={{
            borderBottom: "1px solid var(--glass-sheet-border)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <TrendingUp
              className="h-5 w-5"
              style={{ color: "oklch(0.55 0.195 252)" }}
            />
            <h2 className="text-base font-bold text-foreground">整体分析</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-foreground/40 transition-all duration-300 hover:text-foreground hover:scale-110"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── 内容区 ── */}
        <div className="flex-1 px-5 py-6">
          <div className="mx-auto max-w-3xl space-y-5">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/40 border-t-primary" />
            </div>
          ) : (
            <>
              {/* ══════ 1. 进度条 ══════ */}
              <section>
                <h3 className="mb-3 text-xs font-semibold text-foreground/50">
                  整体进度
                </h3>
                {/* 进度条 */}
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-foreground/5">
                  <span
                    className="h-full shrink-0 transition-all duration-700"
                    style={{ width: `${masteredPct}%`, background: masteredColor }}
                  />
                  <span
                    className="h-full shrink-0 transition-all duration-700"
                    style={{ width: `${learningPct}%`, background: learningColor }}
                  />
                  <span
                    className="h-full flex-1 transition-all duration-700"
                    style={{ background: remainingColor }}
                  />
                </div>
                {/* 图例 */}
                <div className="mt-2.5 flex flex-wrap gap-x-6 gap-y-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-sm"
                      style={{ background: masteredColor }}
                    />
                    <span className="text-foreground/60">
                      已掌握{" "}
                      <span className="font-mono font-semibold text-foreground">
                        {mastered}
                      </span>{" "}
                      词
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-sm"
                      style={{ background: learningColor }}
                    />
                    <span className="text-foreground/60">
                      学习中{" "}
                      <span className="font-mono font-semibold text-foreground">
                        {learning}
                      </span>{" "}
                      词
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-sm"
                      style={{ background: remainingColor }}
                    />
                    <span className="text-foreground/60">
                      待学习{" "}
                      <span className="font-mono font-semibold text-foreground">
                        {remaining}
                      </span>{" "}
                      词
                    </span>
                  </div>
                  <span className="text-foreground/35">
                    共 {totalWords.toLocaleString()} 词
                  </span>
                </div>
              </section>

              {/* ══════ 2. 热力图 ══════ */}
              <section>
                <h3 className="mb-3 text-xs font-semibold text-foreground/50">
                  {new Date().getFullYear()} 年
                </h3>
                <div>
                  <div className="flex gap-0.5">
                    {/* 左侧：行标签（只标部分） */}
                    <div className="flex shrink-0 flex-col gap-0.5 pr-1.5">
                      {/* 月份标签占位 */}
                      <div className="h-3" />
                      {Array.from({ length: HEAT_ROWS }).map((_, i) => (
                        <span
                          key={i}
                          className="flex h-3 w-5 items-center text-[8px] text-foreground/20"
                        >
                          {i % 2 === 0 ? ["", "一", "", "三", "", "五", ""][i] : ""}
                        </span>
                      ))}
                    </div>
                    {/* 右侧：格子 + 顶部月份 */}
                    <div className="flex flex-col gap-0.5">
                      {/* 月份标签 */}
                      <div className="relative h-3">
                        {monthLabels.map((m, i) => {
                          const leftPct = (m.col / WEEKS_COUNT) * 100;
                          return (
                            <span
                              key={i}
                              className="absolute text-[9px] text-foreground/25"
                              style={{ left: `${leftPct}%` }}
                            >
                              {m.label}
                            </span>
                          );
                        })}
                      </div>
                      {/* 格子行 */}
                      <div className="flex gap-0.5">
                        {weeks.map((week, wi) => (
                          <div key={wi} className="flex flex-col gap-0.5">
                            {week.map((day, di) => {
                              if (!day) {
                                return (
                                  <div
                                    key={di}
                                    className="h-3 w-3 rounded-sm opacity-20"
                                    style={{ background: "oklch(0.55 0.195 252 / 0.06)" }}
                                  />
                                );
                              }
                              const total = day.learned + day.reviewed;
                              const level = heatLevel(total);
                              const title = `${day.date}\n学习 ${day.learned} 词 · 复习 ${day.reviewed} 词`;
                              return (
                                <div
                                  key={di}
                                  className="h-3 w-3 rounded-sm cursor-default ring-offset-1 transition-all hover:ring-2 hover:ring-primary/40 hover:z-10"
                                  style={{ background: heatColors[level] }}
                                  title={title}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {/* 图例 */}
                <div className="mt-2 flex items-center gap-1.5 text-[9px] text-foreground/30">
                  <span>少</span>
                  {heatColors.map((c, i) => (
                    <span
                      key={i}
                      className="inline-block h-2.5 w-2.5 rounded-sm"
                      style={{ background: c }}
                    />
                  ))}
                  <span>多</span>
                </div>
              </section>

              {/* ══════ 3. 复习预报 ══════ */}
              <section>
                <h3 className="mb-3 text-xs font-semibold text-foreground/50">
                  未来 7 天复习量
                </h3>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2">
                    {forecast.map((f) => {
                      const d = new Date(f.date);
                      const month = d.getMonth() + 1;
                      const day = d.getDate();
                      const weekDay = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
                      return (
                        <div
                          key={f.date}
                          className="flex flex-col items-center rounded-xl px-3 py-3 transition-all duration-300 hover:scale-[1.02]"
                          style={{
                            background: "var(--glass-card-bg)",
                            backdropFilter:
                              "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
                            WebkitBackdropFilter:
                              "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
                            border: "1px solid var(--glass-card-border)",
                          }}
                        >
                          <span className="text-[10px] text-foreground/35">
                            {month}/{day} 周{weekDay}
                          </span>
                          <span
                            className="mt-1 font-mono text-xl font-bold"
                            style={{ color: "oklch(0.55 0.195 252)" }}
                          >
                            {f.count}
                          </span>
                          <span className="text-[10px] text-foreground/35">词</span>
                        </div>
                      );
                    })}
                  </div>
              </section>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

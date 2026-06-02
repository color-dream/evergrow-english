import { useEffect, useRef, useCallback, useMemo } from "react";
import type { Sentence } from "@/types/domain";
import type { SentenceLearnMode } from "@/types/sentence";
import { useSentenceTyping } from "@/hooks/useSentenceTyping";
import { useKeyboardCapture } from "@/hooks/useKeyboardCapture";
import LetterBox from "./LetterBox";
import type { LetterState } from "@/types/vocabulary";
import { cn } from "@/lib/utils";

// ── 音效（与 WordCard 保持一致） ──
let _audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext {
  if (!_audioCtx) _audioCtx = new AudioContext();
  return _audioCtx;
}
function playCorrectSound() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1760, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.12);
  } catch { /* 静默 */ }
}
function playWrongSound() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "triangle";
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
  } catch { /* 静默 */ }
}
function playCompleteSound() {
  try {
    const ctx = getAudioCtx();
    const t = ctx.currentTime;
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      const start = t + i * 0.08;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.07, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
      osc.start(start); osc.stop(start + 0.18);
    });
  } catch { /* 静默 */ }
}

// ── 语法角色中文缩写 ──
const ROLE_ABBR: Record<string, string> = {
  subject: "主",
  predicate: "谓",
  "linking-verb": "系",
  object: "宾",
  "indirect-object": "间宾",
  "direct-object": "直宾",
  predicative: "表",
  "object-complement": "宾补",
  attributive: "定",
  adverbial: "状",
  conjunction: "连",
  interjection: "叹",
};

// ── 语法角色文字颜色（敲完后的着色） ──
const ROLE_TEXT_COLORS: Record<string, string> = {
  subject: "oklch(0.55 0.20 252)",
  predicate: "oklch(0.56 0.19 148)",
  "linking-verb": "oklch(0.50 0.15 160)",
  object: "oklch(0.72 0.18 85)",
  "indirect-object": "oklch(0.68 0.15 75)",
  "direct-object": "oklch(0.72 0.18 85)",
  predicative: "oklch(0.52 0.18 325)",
  "object-complement": "oklch(0.48 0.15 320)",
  attributive: "oklch(0.58 0.17 30)",
  adverbial: "oklch(0.50 0.12 200)",
  conjunction: "oklch(0.55 0.05 260)",
  interjection: "oklch(0.55 0.15 350)",
};

interface SentenceCardProps {
  sentence: Sentence;
  learnMode: SentenceLearnMode;
  isTyping: boolean;
  onComplete: (wrongWordIndices: number[]) => void;
}

/** 按 segments 把词分组 → { segment, wordIndices[] }[] */
function groupWordsBySegment(
  words: string[],
  segments: Sentence["segments"],
): { seg: (typeof segments extends (infer U)[] | undefined ? U : never) | null; wordIndices: number[] }[] {
  if (!segments) return words.map((_, i) => ({ seg: null, wordIndices: [i] }));
  const groups: { seg: typeof segments[number] | null; wordIndices: number[] }[] = [];
  let pos = 0;
  for (const seg of segments) {
    const count = seg.text.split(/\s+/).filter(Boolean).length;
    groups.push({ seg, wordIndices: Array.from({ length: count }, (_, i) => pos + i) });
    pos += count;
  }
  // 剩余词（如果 segments 不完整）
  while (pos < words.length) {
    groups.push({ seg: null, wordIndices: [pos] });
    pos++;
  }
  return groups;
}

export function SentenceCard({
  sentence,
  learnMode,
  isTyping,
  onComplete,
}: SentenceCardProps) {
  const { state, handleChar } = useSentenceTyping(sentence.text);
  const completedRef = useRef(false);

  useEffect(() => {
    completedRef.current = false;
  }, [sentence.id, learnMode]);

  const onChar = useCallback(
    (char: string) => {
      if (state.isSentenceFinished) return;
      const result = handleChar(char);
      if (result.accepted) {
        if (result.correct) playCorrectSound();
        else playWrongSound();
      }
    },
    [handleChar, state.isSentenceFinished],
  );

  useKeyboardCapture(onChar, isTyping && !state.isSentenceFinished);

  useEffect(() => {
    if (state.isSentenceFinished && !completedRef.current) {
      completedRef.current = true;
      if (state.wrongWordIndices.length === 0) playCompleteSound();
      onComplete([...state.wrongWordIndices]);
    }
  }, [state.isSentenceFinished, onComplete, state.wrongWordIndices]);

  // 按 segment 分组（用于判断缩写标签显示位置）— 必须在所有条件渲染之前
  const wordGroups = useMemo(
    () => groupWordsBySegment(state.words, sentence.segments),
    [state.words, sentence.segments],
  );
  const wordSegmentMap = useMemo(() => {
    const map = new Map<number, (typeof sentence.segments extends (infer U)[] | undefined ? U : never) | null>();
    for (const group of wordGroups) {
      if (group.wordIndices.length > 0) map.set(group.wordIndices[0], group.seg);
    }
    return map;
  }, [wordGroups, sentence.segments]);

  const vis = {
    showText: learnMode === "sentenceWithText",
    showTranslation: learnMode !== "sentenceFullBlind",
  };

  // 将句子 token 化：词 + 标点交替（在所有条件渲染之前计算）
  const tokens = useMemo(() => {
    const result: { text: string; wordIdx: number | null }[] = [];
    const src = sentence.text;
    let pos = 0;
    for (let wi = 0; wi < state.words.length; wi++) {
      const w = state.words[wi];
      const idx = src.indexOf(w, pos);
      if (idx > pos) result.push({ text: src.slice(pos, idx), wordIdx: null });
      result.push({ text: w, wordIdx: wi });
      pos = idx + w.length;
    }
    if (pos < src.length) result.push({ text: src.slice(pos), wordIdx: null });
    return result;
  }, [sentence.text, state.words]);

  const tokenSegments = useMemo(() => {
    const result: { seg: (typeof sentence.segments extends (infer U)[] | undefined ? U : never) | null; tokens: typeof tokens }[] = [];
    let currentGroupTokens: typeof tokens = [];
    let currentSeg: typeof result[number]["seg"] = null;
    for (const token of tokens) {
      if (token.wordIdx !== null && wordSegmentMap.has(token.wordIdx)) {
        if (currentGroupTokens.length > 0) result.push({ seg: currentSeg, tokens: currentGroupTokens });
        currentGroupTokens = [token];
        currentSeg = wordSegmentMap.get(token.wordIdx) ?? null;
      } else {
        currentGroupTokens.push(token);
      }
    }
    if (currentGroupTokens.length > 0) result.push({ seg: currentSeg, tokens: currentGroupTokens });
    return result;
  }, [tokens, wordSegmentMap, sentence.segments]);

  // 防御：words 为空时渲染占位（所有 hooks 已在此之前调用）
  if (!state.words.length) {
    return (
      <div className="flex w-full max-w-3xl flex-col items-center gap-5 px-4">
        <p className="text-sm text-foreground/40">加载中...</p>
      </div>
    );
  }

  // ── 渲染 ──

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-5 px-4">
      {/* 逐词逐字母显示区 — 按 segment 分组，标签跨整个词段居中 */}
      <div className="flex flex-wrap items-end justify-center gap-x-2 gap-y-4 leading-loose animate-spring-up">
        {tokenSegments.map((group, gi) => {
          // 词段内所有词是否已输入完毕
          const allWordsInGroupTyped = group.tokens.every(
            (t) => t.wordIdx === null || t.wordIdx < state.currentWordIndex,
          );
          const abbr = (vis.showText && group.seg && allWordsInGroupTyped)
            ? (ROLE_ABBR[group.seg.role] ?? "")
            : "";

          return (
            <span key={gi} className="inline-flex flex-col items-center gap-2">
              {/* 语法缩写 — 跨整个词段居中 */}
              {abbr && (
                <span className="text-[10px] font-medium text-foreground/30 select-none leading-none">
                  {abbr}
                </span>
              )}

              {/* 词段内的 tokens */}
              <span className="inline-flex items-end">
                {group.tokens.map((token, ti) => {
                  // 标点
                  if (token.wordIdx === null) {
                    return (
                      <span key={`p-${gi}-${ti}`} className="inline-flex items-end font-mono text-5xl md:text-6xl font-medium text-foreground/35 select-none tracking-tight">
                        {token.text}
                      </span>
                    );
                  }

                  // 词
                  const wordIdx = token.wordIdx;
                  const word = state.words[wordIdx];
                  const isPast = wordIdx < state.currentWordIndex;
                  const isWrongWord = state.wrongWordIndices.includes(wordIdx);
                  const roleColor = group.seg ? ROLE_TEXT_COLORS[group.seg.role] : undefined;
                  const pastColor = isWrongWord ? "oklch(0.55 0.22 20)" : roleColor;

                  return (
                    <span
                      key={wordIdx}
                      className={cn(
                        "inline-flex items-center rounded-lg px-1 py-0.5 transition-all duration-200",
                        wordIdx === state.currentWordIndex && state.hasWrong && "animate-shake",
                      )}
                      style={{
                        color: isPast ? pastColor : undefined,
                        ...(isPast && !isWrongWord && roleColor
                          ? { ["--color-letter-correct" as string]: roleColor }
                          : {}),
                      }}
                    >
                      {word.split("").map((letter, letterIdx) => {
                        const letterState: LetterState =
                          wordIdx < state.currentWordIndex
                            ? isWrongWord ? "wrong" : "correct"
                            : wordIdx === state.currentWordIndex && letterIdx < state.inputWord.length
                              ? state.letterStates[letterIdx] ?? "normal"
                              : "normal";

                        return (
                          <LetterBox
                            key={`${wordIdx}-${letterIdx}`}
                            letter={letter}
                            state={letterState}
                            visible={vis.showText || wordIdx <= state.currentWordIndex}
                            userChar={
                              wordIdx === state.currentWordIndex && letterIdx < state.inputWord.length
                                ? state.inputWord[letterIdx] ?? null
                                : null
                            }
                          />
                        );
                      })}
                    </span>
                  );
                })}
              </span>
            </span>
          );
        })}
      </div>

      {/* 翻译 — 在句子下方 */}
      {vis.showTranslation && (
        <p className="text-base text-foreground/50 animate-spring-up">{sentence.translation}</p>
      )}

    </div>
  );
}

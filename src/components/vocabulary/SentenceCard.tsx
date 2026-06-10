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

interface SentenceCardProps {
  sentence: Sentence;
  learnMode: SentenceLearnMode;
  isTyping: boolean;
  onComplete: (wrongWordIndices: number[]) => void;
}

export function SentenceCard({
  sentence,
  learnMode,
  isTyping,
  onComplete,
}: SentenceCardProps) {
  const { state, handleChar } = useSentenceTyping(sentence.english);
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

  const vis = {
    showText: learnMode === "sentenceWithText",
    showTranslation: learnMode !== "sentenceFullBlind",
  };

  // 将句子 token 化：词 + 标点交替
  const tokens = useMemo(() => {
    const result: { text: string; wordIdx: number | null }[] = [];
    const src = sentence.english;
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
  }, [sentence.english, state.words]);

  // 防御：words 为空时渲染占位
  if (!state.words.length) {
    return (
      <div className="flex w-full max-w-3xl flex-col items-center gap-5 px-4">
        <p className="text-sm text-foreground/40">加载中...</p>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-5 px-4">
      {/* 逐词逐字母显示区 */}
      <div className="flex flex-wrap items-end justify-center gap-x-2 gap-y-4 leading-loose animate-spring-up">
        {tokens.map((token, ti) => {
          // 标点
          if (token.wordIdx === null) {
            return (
              <span
                key={`p-${ti}`}
                className="inline-flex items-end font-mono text-5xl md:text-6xl font-medium text-foreground/35 select-none tracking-tight"
              >
                {token.text}
              </span>
            );
          }

          // 词
          const wordIdx = token.wordIdx;
          const word = state.words[wordIdx];
          const isPast = wordIdx < state.currentWordIndex;
          const isWrongWord = state.wrongWordIndices.includes(wordIdx);

          return (
            <span
              key={wordIdx}
              className={cn(
                "inline-flex items-center rounded-lg px-1 py-0.5 transition-all duration-200",
                wordIdx === state.currentWordIndex && state.hasWrong && "animate-shake",
              )}
            >
              {word.split("").map((letter, letterIdx) => {
                const letterState: LetterState =
                  wordIdx < state.currentWordIndex
                    ? isWrongWord
                      ? "wrong"
                      : "correct"
                    : wordIdx === state.currentWordIndex &&
                        letterIdx < state.inputWord.length
                      ? state.letterStates[letterIdx] ?? "normal"
                      : "normal";

                return (
                  <LetterBox
                    key={`${wordIdx}-${letterIdx}`}
                    letter={letter}
                    state={letterState}
                    visible={
                      vis.showText ||
                      wordIdx < state.currentWordIndex ||
                      (wordIdx === state.currentWordIndex &&
                        letterIdx < state.inputWord.length)
                    }
                    userChar={
                      wordIdx === state.currentWordIndex &&
                      letterIdx < state.inputWord.length
                        ? state.inputWord[letterIdx] ?? null
                        : null
                    }
                  />
                );
              })}
            </span>
          );
        })}
      </div>

      {/* 翻译 — 在句子下方 */}
      {vis.showTranslation && (
        <p className="text-base text-foreground/50 animate-spring-up">
          {sentence.chinese}
        </p>
      )}
    </div>
  );
}

import { useEffect, useRef, useCallback } from "react";
import type { Sentence } from "@/types/domain";
import { useSentenceTyping } from "@/hooks/useSentenceTyping";
import { cn } from "@/lib/utils";

// ── 音效 ──
let _audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext {
  if (!_audioCtx) _audioCtx = new AudioContext();
  return _audioCtx;
}
function playCorrectSound() {
  try {
    const ctx = getAudioCtx();
    const t = ctx.currentTime;
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t + i * 0.08);
      gain.gain.setValueAtTime(0.07, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.start(t + i * 0.08); osc.stop(t + i * 0.08 + 0.2);
    });
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

interface SentenceCardProps {
  sentence: Sentence;
  isTyping: boolean;
  onComplete: (wrongWordIndices: number[]) => void;
}

export function SentenceCard({
  sentence,
  isTyping,
  onComplete,
}: SentenceCardProps) {
  const {
    state,
    dispatch,
    setInput,
    submit,
    startFix,
    fixNext,
    fixDone,
    checkAllCorrect,
    getWrongIndices,
    isFixPending,
    isFixInput,
  } = useSentenceTyping(sentence.english);

  const inputRef = useRef<HTMLInputElement>(null);
  const completedRef = useRef(false);

  // 重置
  useEffect(() => {
    completedRef.current = false;
  }, [sentence.id]);

  // 聚焦输入框
  useEffect(() => {
    if (isTyping && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isTyping]);

  // 暂停/恢复：失焦时自动重新聚焦
  useEffect(() => {
    if (!isTyping) return;
    const onBlur = () => {
      setTimeout(() => inputRef.current?.focus(), 100);
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [isTyping]);

  // 提交后检查结果
  useEffect(() => {
    if (!state.submitted) return;
    const allCorrect = checkAllCorrect();
    if (allCorrect) {
      playCorrectSound();
      completedRef.current = true;
      onComplete([]);
    } else {
      playWrongSound();
    }
  }, [state.submitted, checkAllCorrect, onComplete]);

  // fix 模式下监听任意键 → startFix, space → fixNext
  useEffect(() => {
    if (state.mode !== "fix") return;

    const onFixKey = (e: KeyboardEvent) => {
      if (["Alt", "Control", "Meta", "Shift"].some((k) => e.key === k)) return;

      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        fixNext();
        return;
      }

      // 任意其他字符 → 进入 fix-input
      e.preventDefault();
      startFix();
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.value = "";
          inputRef.current.focus();
        }
      }, 10);
    };

    window.addEventListener("keydown", onFixKey);
    return () => window.removeEventListener("keydown", onFixKey);
  }, [state.mode, startFix, fixNext]);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (state.mode === "fix") return;
      setInput(e.target.value);
    },
    [state.mode, setInput],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // 禁止方向键
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        return;
      }

      // Ctrl+H 留给父组件处理（显示/隐藏答案），其余 Ctrl 组合忽略
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() !== "h") {
        e.preventDefault();
        return;
      }

      // Enter 提交
      if (e.key === "Enter" && state.mode === "input") {
        e.preventDefault();
        submit();
        return;
      }

      // fix-input 模式下 Enter 提交当前 fix
      if (e.key === "Enter" && state.mode === "fix-input") {
        e.preventDefault();
        fixDone();
        return;
      }

      // fix-input 模式下空格 → 修正下一个错误词
      if ((e.key === " " || e.code === "Space") && state.mode === "fix-input") {
        e.preventDefault();
        fixNext();
        return;
      }

      // fix-input 模式下退格 清空当前词 → 回到上一个错误词
      if (e.key === "Backspace" && state.mode === "fix-input" && state.inputValue === "") {
        e.preventDefault();
        // 简单处理：重新进入 fix 模式
        dispatch({ type: "FIX_DONE" });
        return;
      }
    },
    [state.mode, submit, fixDone, fixNext, dispatch],
  );

  // fix-input 模式下 空格 在 input 处理之外也监听
  useEffect(() => {
    if (state.mode !== "fix-input") return;
    const onSpace = (e: KeyboardEvent) => {
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        fixNext();
      }
    };
    window.addEventListener("keydown", onSpace);
    return () => window.removeEventListener("keydown", onSpace);
  }, [state.mode, fixNext]);

  // 点击容器聚焦
  const handleContainerClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  if (!state.targetWords.length) {
    return (
      <div className="flex w-full max-w-3xl flex-col items-center gap-5 px-4">
        <p className="text-sm text-foreground/40">加载中...</p>
      </div>
    );
  }

  return (
    <div
      className="flex w-full max-w-3xl flex-col items-center gap-6 px-4"
      onClick={handleContainerClick}
    >
      {/* 中文提示 */}
      <p className="text-lg font-medium text-foreground/80 animate-spring-up select-none">
        {sentence.chinese}
      </p>

      {/* 词盒区 — 与 LetterBox 风格一致 */}
      <div className="relative flex flex-wrap justify-center gap-x-3 gap-y-2 animate-spring-up">
        {state.userWords.map((word, i) => {
          const isActive = state.mode === "input" && word.isActive;

          const isFixTarget =
            (state.mode === "fix" || state.mode === "fix-input") &&
            i === state.fixWordIndex;

          const isWrong = word.incorrect && state.submitted;
          const isCorrect = word.userInput && !word.incorrect && state.submitted;

          let color = "var(--color-letter-normal)";
          let borderColor = "oklch(0.60 0.01 260 / 0.2)";
          let bg = "transparent";
          if (isFixTarget) { color = "oklch(0.58 0.2 22)"; borderColor = "oklch(0.58 0.2 22 / 0.4)"; }
          else if (isWrong) { color = "var(--color-letter-wrong)"; borderColor = "oklch(0.58 0.2 22 / 0.4)"; }
          else if (isCorrect) { color = "var(--color-letter-correct)"; borderColor = "oklch(0.68 0.19 155 / 0.4)"; }
          else if (isActive) { color = "oklch(0.55 0.195 252)"; borderColor = "oklch(0.55 0.195 252)"; bg = "oklch(0.55 0.195 252 / 0.06)"; }

          return (
            <span
              key={i}
              className={cn(
                "inline-flex flex-col items-center gap-1 shrink-0 font-mono text-5xl md:text-6xl font-medium tracking-tight leading-normal transition-all duration-200",
                isWrong && "animate-shake",
              )}
              style={{ width: `${word.text.length + 0.8}ch` }}
            >
              <span
                className="w-full rounded-lg text-center"
                style={{ background: bg, color, textShadow: "0 1px 0 oklch(0 0 0 / 0.04)" }}
              >
                {isFixTarget ? "" : word.userInput || " "}
              </span>
              <span className="block w-full border-b-[3px]" style={{ borderColor }} />
            </span>
          );
        })}
      </div>

      {/* 隐藏输入框 */}
      <input
        ref={inputRef}
        className="absolute h-0 w-0 opacity-0"
        type="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        lang="en"
        value={state.mode === "fix" ? "" : state.inputValue}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
      />
    </div>
  );
}

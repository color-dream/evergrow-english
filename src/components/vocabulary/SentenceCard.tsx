import { useEffect, useRef, useCallback } from "react";
import type { Sentence } from "@/types/domain";
import { useSentenceTyping } from "@/hooks/useSentenceTyping";
import { useAudio } from "@/app/providers/AudioProvider";
import { cn } from "@/lib/utils";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";

// ── 字符视觉宽度表（ch 单位）──
const CHAR_WIDTH: Record<string, number> = {
  f: 0.6, j: 0.6, i: 0.6, l: 0.6, r: 0.6, t: 0.6,
  w: 1.2, m: 1.2,
};
/** 单词左右内边距（ch） */
const WORD_PADDING = 0.6;

function wordChWidth(text: string): number {
  let w = 0;
  for (const ch of text.toLowerCase()) {
    w += CHAR_WIDTH[ch] ?? 1;
  }
  return w + WORD_PADDING;
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
    fixPrev,
    fixDone,
    checkAllCorrect,
    getWrongIndices,
    isFixPending,
    isFixInput,
  } = useSentenceTyping(sentence.english);

  const audio = useAudio();
  const inputRef = useRef<HTMLInputElement>(null);
  const completedRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const canFixRef = useRef(false);

  // 新句子自动播放发音（首次渲染时）
  useEffect(() => {
    audio.speak(sentence.english, { rate: 0.8 }).catch(() => {});
  }, [sentence.id]); // sentence.id 变化触发，audio 稳定引用

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

  // fix-input 模式下自动聚焦
  useEffect(() => {
    if (state.mode === "fix-input") {
      inputRef.current?.focus();
    }
  }, [state.mode]);

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
      // 显示错误状态，等待用户按任意键进入修正
    }
  }, [state.submitted, checkAllCorrect, onComplete, startFix]);

  // fix 模式：显示红色 400ms → 自动清空进入输入状态；也可按任意键提前触发
  useEffect(() => {
    if (state.mode !== "fix") {
      canFixRef.current = false;
      return;
    }
    canFixRef.current = false;
    // 400ms 后自动清空并进入输入状态
    const autoTimer = setTimeout(() => {
      startFix();
      inputRef.current?.focus();
    }, 400);

    // 按任意键可提前触发
    const onFixKey = (e: KeyboardEvent) => {
      if (canFixRef.current) return; // 已自动触发过
      if (["Alt", "Control", "Meta", "Shift"].some((k) => e.key === k)) return;
      if (e.key === " " || e.code === "Space") return;
      canFixRef.current = true;
      clearTimeout(autoTimer);
      e.preventDefault();
      if (e.key.length === 1) {
        dispatch({ type: "START_FIX", firstChar: e.key });
      } else {
        startFix();
      }
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onFixKey);
    return () => {
      clearTimeout(autoTimer);
      window.removeEventListener("keydown", onFixKey);
    };
  }, [state.mode, startFix, dispatch]);

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

      // 空格在最后一个单词时 = 提交（对标 earthworm）
      if ((e.key === " " || e.code === "Space") && stateRef.current.mode === "input") {
        const s = stateRef.current;
        const filledCount = s.userWords.filter((w) => w.userInput.length > 0).length;
        if (filledCount === s.targetWords.length) {
          e.preventDefault();
          submit();
          return;
        }
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

      // fix-input 模式下空格 → 修正下一个错误词；若是最后一个错误词则提交
      if ((e.key === " " || e.code === "Space") && state.mode === "fix-input") {
        e.preventDefault();
        const s = stateRef.current;
        const hasNext = s.userWords.some(
          (w, i) => i > s.fixWordIndex && w.incorrect,
        );
        if (hasNext) {
          fixNext();
        } else {
          fixDone();
        }
        return;
      }

      // fix-input 模式下退格且输入为空 → 回到上一个错误词（不重新评估正确性）
      if (e.key === "Backspace" && state.mode === "fix-input" && stateRef.current.inputValue === "") {
        e.preventDefault();
        fixPrev();
        return;
      }

      // input/fix-input 模式下退格：手动删除最后一个字符
      if (e.key === "Backspace" && (state.mode === "input" || state.mode === "fix-input")) {
        const iv = stateRef.current.inputValue;
        if (iv.length > 0) {
          e.preventDefault();
          setInput(iv.slice(0, -1));
        }
        return;
      }

      // 可打字字符：播放提示音（与单词学习一致）
      if (/^[a-zA-Z0-9']$/.test(e.key)) {
        playCorrectSound();
      }
    },
    [state.mode, submit, fixDone, fixNext, fixPrev, dispatch],
  );

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
      <div className="relative flex flex-wrap justify-center gap-x-1.5 gap-y-1.5 animate-spring-up">
        {state.userWords.map((word, i) => {
          const isFixTarget =
            (state.mode === "fix" || state.mode === "fix-input") &&
            i === state.fixWordIndex;

          const isActive = (state.mode === "input" && word.isActive) || (state.mode === "fix-input" && isFixTarget);

          const isWrong = word.incorrect && state.submitted;
          const isCorrect = word.userInput && !word.incorrect && state.submitted;

          let color = "var(--color-letter-normal)";
          let borderColor = "oklch(0.60 0.01 260 / 0.2)";
          let bg = "transparent";
          if (isFixTarget && state.mode === "fix") { color = "oklch(0.58 0.2 22)"; borderColor = "oklch(0.58 0.2 22 / 0.4)"; }
          else if (isFixTarget && state.mode === "fix-input") { color = "oklch(0.55 0.195 252)"; borderColor = "oklch(0.55 0.195 252)"; bg = "oklch(0.55 0.195 252 / 0.06)"; }
          else if (isWrong) { color = "var(--color-letter-wrong)"; borderColor = "oklch(0.58 0.2 22 / 0.4)"; }
          else if (isCorrect) { color = "var(--color-letter-correct)"; borderColor = "oklch(0.68 0.19 155 / 0.4)"; }
          else if (isActive) { color = "oklch(0.55 0.195 252)"; borderColor = "oklch(0.55 0.195 252)"; bg = "oklch(0.55 0.195 252 / 0.06)"; }

          return (
            <span
              key={i}
              className={cn(
                "inline-flex flex-col items-center gap-1 shrink-0 font-mono text-4xl md:text-5xl font-medium tracking-tight leading-normal transition-all duration-200",
                isWrong && "animate-shake",
              )}
              style={{ width: `${wordChWidth(word.text)}ch` }}
            >
              <span
                className="w-full rounded-lg text-center"
                style={{
                  background: bg,
                  color,
                  textShadow: "0 1px 0 oklch(0 0 0 / 0.04)",
                }}
              >
                {word.userInput || " "}
              </span>
              <span
                className="block w-full border-b-[3px]"
                style={{ borderColor }}
              />
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

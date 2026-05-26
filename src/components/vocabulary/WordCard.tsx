import { useEffect, useRef, useCallback } from "react";
import type { Word } from "@/types/domain";
import type {
  TypingMode,
  DictationConfig,
  WordResult,
} from "@/types/vocabulary";
import { useWordTyping } from "@/hooks/useWordTyping";
import { useKeyboardCapture } from "@/hooks/useKeyboardCapture";
import { useAudio } from "@/app/providers/AudioProvider";
import LetterBox from "./LetterBox";
import { cn } from "@/lib/utils";

interface WordCardProps {
  word: Word;
  mode: TypingMode;
  dictation: DictationConfig;
  onComplete: (result: WordResult) => void;
  onKeystroke: (correct: boolean) => void;
}

export function WordCard({
  word,
  mode,
  dictation,
  onComplete,
  onKeystroke,
}: WordCardProps) {
  const isIgnoreCase = true;
  const {
    state,
    handleChar,
    handleBackspace,
    setMode,
    getLetterVisible,
    getLetterMistakes,
  } = useWordTyping(word.text, isIgnoreCase);
  const audio = useAudio();
  const completedRef = useRef(false);

  useEffect(() => {
    setMode(mode);
  }, [mode, setMode]);

  useEffect(() => {
    audio.speak(word.text, { rate: 0.8 }).catch(() => {});
  }, [word.text, audio]);

  useEffect(() => {
    completedRef.current = false;
  }, [word.id]);

  const onChar = useCallback(
    (char: string) => {
      const result = handleChar(char, mode);
      if (result.accepted) {
        onKeystroke(result.correct);
      }
    },
    [handleChar, mode, onKeystroke]
  );

  const onBackspace = useCallback(() => {
    if (mode === "loose") {
      handleBackspace();
    }
  }, [mode, handleBackspace]);

  useKeyboardCapture(onChar, onBackspace, !state.isFinished);

  useEffect(() => {
    if (state.isFinished && !completedRef.current) {
      completedRef.current = true;
      const letterMistakes = getLetterMistakes();
      onComplete({
        wordId: word.id,
        wordText: word.text,
        definition: word.definition,
        wrongCount: state.wrongCount,
        isCorrect: state.wrongCount === 0,
        letterMistakes,
      });
    }
  }, [state.isFinished, state.wrongCount, word, onComplete, getLetterMistakes]);

  const showSkip = state.wrongCount >= 4;

  return (
    <div className="flex flex-col items-center gap-10 py-16 animate-fade-in">
      {/* 释义 + 音标 */}
      <div className="text-center select-none">
        <p className="text-xl font-medium text-foreground">{word.definition}</p>
        {word.phonetic && (
          <p className="mt-1.5 font-mono text-sm text-muted-foreground/60">
            {word.phonetic}
          </p>
        )}
      </div>

      {/* 字母行 */}
      <div
        className={cn(
          "flex items-center justify-center gap-1 rounded-xl bg-card border border-border px-8 py-8 shadow-xs transition-colors",
          state.hasWrong && "animate-shake border-destructive/30"
        )}
      >
        {state.displayWord.split("").map((letter, index) => (
          <LetterBox
            key={`${index}-${letter}`}
            letter={letter}
            state={state.letterStates[index]}
            visible={getLetterVisible(
              index,
              dictation,
              state.letterStates[index]
            )}
          />
        ))}
      </div>

      {/* 宽松模式：显示用户已输入内容 */}
      {mode === "loose" &&
        state.inputWord.length > 0 &&
        !state.hasWrong &&
        !state.isFinished && (
          <div className="-mt-6 flex items-center justify-center gap-1 font-mono text-xl text-muted-foreground/25">
            {state.inputWord.split("").map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </div>
        )}

      {/* 底部操作区 */}
      <div className="flex flex-col items-center gap-4">
        {showSkip && (
          <button
            onClick={() => {
              completedRef.current = true;
              const letterMistakes = getLetterMistakes();
              onComplete({
                wordId: word.id,
                wordText: word.text,
                definition: word.definition,
                wrongCount: state.wrongCount,
                isCorrect: false,
                letterMistakes,
              });
            }}
            className="rounded-lg border border-border px-4 py-1.5 text-sm text-muted-foreground transition-all hover:border-destructive/40 hover:text-destructive"
          >
            跳过此词
          </button>
        )}

        {/* 模式提示 */}
        <div className="flex gap-2">
          <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
            {mode === "strict" ? "严格模式" : "宽松模式"}
          </span>
          {dictation.enabled && (
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              听写模式
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

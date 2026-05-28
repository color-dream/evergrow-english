import { useEffect, useRef, useCallback, useState } from "react";
import type { Word } from "@/types/domain";
import type {
  TypingMode,
  WordLearnMode,
  WordModeResult,
} from "@/types/vocabulary";
import type { ReviewWordMeta } from "@/stores/vocabulary-session-store";
import { useWordTyping } from "@/hooks/useWordTyping";
import { useKeyboardCapture } from "@/hooks/useKeyboardCapture";
import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { useAudio } from "@/app/providers/AudioProvider";
import LetterBox from "./LetterBox";
import { cn } from "@/lib/utils";
import { Volume2 } from "lucide-react";
import { FSRS_RATING_LABELS } from "@/lib/constants";

interface WordCardProps {
  word: Word;
  learnMode: WordLearnMode;
  typingMode: TypingMode;
  onComplete: (result: WordModeResult) => void;
  onKeystroke: (correct: boolean) => void;
  isReview?: boolean;
  reviewMeta?: ReviewWordMeta;
}

/** 根据 learnMode 决定各元素是否可见 */
function getVisibility(learnMode: WordLearnMode) {
  return {
    showWord: learnMode === "typeWithWord",
    showTranslation:
      learnMode === "typeWithWord" || learnMode === "typeWithoutWord",
    showPhonetic: learnMode !== "typeWithoutWordAndTranslationAndPhonetic",
  };
}

export function WordCard({
  word,
  learnMode,
  typingMode,
  onComplete,
  onKeystroke,
  isReview,
  reviewMeta,
}: WordCardProps) {
  const isIgnoreCase = true;
  const {
    state,
    handleChar,
    handleBackspace,
    setMode,
    getLetterMistakes,
  } = useWordTyping(word.text, isIgnoreCase);
  const audio = useAudio();
  const [isPlaying, setIsPlaying] = useState(false);
  const completedRef = useRef(false);
  const isTyping = useVocabularySessionStore((s) => s.isTyping);
  const setIsTyping = useVocabularySessionStore((s) => s.setIsTyping);

  const { showWord, showTranslation, showPhonetic } =
    getVisibility(learnMode);

  useEffect(() => {
    setMode(typingMode);
  }, [typingMode, setMode]);

  useEffect(() => {
    audio.speak(word.text, { rate: 0.8 }).catch(() => {});
  }, [word.text, audio]);

  useEffect(() => {
    completedRef.current = false;
  }, [word.id, learnMode]);

  const onChar = useCallback(
    (char: string) => {
      if (!isTyping) {
        setIsTyping(true);
        return;
      }
      const result = handleChar(char, typingMode);
      if (result.accepted) {
        onKeystroke(result.correct);
      }
    },
    [handleChar, typingMode, onKeystroke, isTyping, setIsTyping]
  );

  const onBackspace = useCallback(() => {
    if (typingMode === "loose") {
      handleBackspace();
    }
  }, [typingMode, handleBackspace]);

  const onEnter = useCallback(() => {
    setIsTyping(!isTyping);
  }, [isTyping, setIsTyping]);

  useKeyboardCapture(onChar, onBackspace, !state.isFinished, onEnter);

  useEffect(() => {
    if (state.isFinished && !completedRef.current) {
      completedRef.current = true;
      const letterMistakes = getLetterMistakes();
      onComplete({
        mode: learnMode,
        wrongCount: state.wrongCount,
        isCorrect: state.wrongCount === 0,
        letterMistakes,
      });
    }
  }, [state.isFinished, state.wrongCount, learnMode, onComplete, getLetterMistakes]);

  // 暂停遮罩提示文字
  const pauseHint = !showWord
    ? "按任意键凭记忆输入"
    : state.inputWord.length > 0
    ? "按任意键继续"
    : "按任意键开始";

  return (
    <div className="flex flex-grow flex-col items-center justify-center">
      {/* 复习标记 */}
      {isReview && reviewMeta && (
        <div className="mb-4 flex items-center gap-2">
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            复习
          </span>
          <span className="text-xs text-muted-foreground">
            上次评分: {FSRS_RATING_LABELS[reviewMeta.previousRating] ?? "未知"}
          </span>
        </div>
      )}

      {/* 词条区域 */}
      <div className="container flex flex-grow flex-col items-center justify-center">
        <div className="relative flex w-full justify-center">
          {/* 暂停遮罩 */}
          {!isTyping && (
            <div className="absolute z-10 flex h-full w-full items-center justify-center">
              <div className="flex w-full items-center backdrop-blur-sm">
                <p className="w-full select-none text-center text-xl text-gray-600 dark:text-gray-50">
                  {pauseHint}
                </p>
              </div>
            </div>
          )}

          <div className="relative flex flex-col items-center gap-10">
            {/* 字母行 */}
            <div
              className={cn(
                "flex items-center justify-center",
                state.hasWrong && "animate-shake"
              )}
            >
              {state.displayWord.split("").map((letter, index) => {
                const hasTyped = index < state.inputWord.length;
                return (
                  <LetterBox
                    key={`${index}-${letter}`}
                    letter={letter}
                    state={state.letterStates[index]}
                    visible={showWord}
                    userChar={hasTyped ? state.inputWord[index] : null}
                  />
                );
              })}
            </div>

            {/* 音标 & 播放按钮 */}
            {showPhonetic && (word.phonetic || audio.supported) && (
              <div className="-mt-8 flex items-center gap-2">
                {word.phonetic && (
                  <span className="font-mono text-sm font-normal text-muted-foreground/60">
                    {word.phonetic}
                  </span>
                )}
                {audio.supported && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaying(true);
                      audio
                        .speak(word.text, { rate: 0.8 })
                        .catch(() => {})
                        .finally(() => setIsPlaying(false));
                    }}
                    aria-label={isPlaying ? "正在播放" : "播放发音"}
                    title="播放发音"
                    className="inline-flex"
                  >
                    <Volume2
                      className={cn(
                        "h-5 w-5 transition-colors",
                        isPlaying
                          ? "text-indigo-400 animate-breathe"
                          : "text-muted-foreground/40 hover:text-indigo-400 cursor-pointer"
                      )}
                    />
                  </button>
                )}
              </div>
            )}

            {/* 释义 */}
            {showTranslation && (
              <p className="-mt-4 select-none text-lg text-muted-foreground">
                {word.definition}
              </p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

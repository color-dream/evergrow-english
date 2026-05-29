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
import { useSettingsStore } from "@/stores/settings-store";
import { useAudio } from "@/app/providers/AudioProvider";
import LetterBox from "./LetterBox";
import { cn } from "@/lib/utils";
import { Volume2 } from "lucide-react";
import { FSRS_RATING_LABELS } from "@/lib/constants";

/** 播放正确输入提示音 */
let audioCtx: AudioContext | null = null;
function playCorrectSound() {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = "sine";
    // 快速滑音：低→高，清脆短促
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(1760, audioCtx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.12);
  } catch {
    // 静默失败
  }
}

/** 播放错误输入提示音 */
function playWrongSound() {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = "triangle";
    // 低沉短促：低→更低，钝感反馈
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(120, audioCtx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.15);
  } catch {
    // 静默失败
  }
}

/** 播放单词完美完成庆祝音效 */
function playCompleteSound() {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const t = audioCtx.currentTime;
    [523, 659, 784].forEach((freq, i) => {
      const osc = audioCtx!.createOscillator();
      const gain = audioCtx!.createGain();
      osc.connect(gain);
      gain.connect(audioCtx!.destination);
      osc.type = "sine";
      const start = t + i * 0.08;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.07, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
      osc.start(start);
      osc.stop(start + 0.18);
    });
  } catch {
    // 静默失败
  }
}

const POS_LABELS: Record<string, string> = {
  noun: "名",
  verb: "动",
  adjective: "形",
  adverb: "副",
  preposition: "介",
  conjunction: "连",
  pronoun: "代",
  interjection: "叹",
  other: "",
};

interface WordCardProps {
  word: Word;
  learnMode: WordLearnMode;
  typingMode: TypingMode;
  onComplete: (result: WordModeResult) => void;
  onKeystroke: (correct: boolean) => void;
  onWrongChar?: () => void;
  isReview?: boolean;
  reviewMeta?: ReviewWordMeta;
  /** 禁用键盘捕获（面板打开时） */
  disabled?: boolean;
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
  onWrongChar,
  isReview,
  reviewMeta,
  disabled,
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
  const pronunciation = useSettingsStore((s) => s.preferences.pronunciation);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showCompleteAnim, setShowCompleteAnim] = useState(false);
  const completedRef = useRef(false);
  const prevHasWrong = useRef(false);
  const isTyping = useVocabularySessionStore((s) => s.isTyping);
  const setIsTyping = useVocabularySessionStore((s) => s.setIsTyping);

  const vis = getVisibility(learnMode);
  const showWord = showResult ? true : vis.showWord;
  const showTranslation = showResult ? true : vis.showTranslation;
  const showPhonetic = showResult ? true : vis.showPhonetic;

  // 按发音偏好选择音标：首选对应口音，缺省回退
  const displayPhonetic =
    pronunciation === "uk"
      ? word.ukphone || word.usphone || word.phonetic
      : word.usphone || word.ukphone || word.phonetic;
  const accentLabel = pronunciation === "uk" ? "英" : "美";

  useEffect(() => {
    setMode(typingMode);
  }, [typingMode, setMode]);

  // 暂停时不播放发音，暂停恢复时播放一次
  useEffect(() => {
    if (isTyping) {
      setIsPlaying(true);
      audio.speak(word.text, { rate: 0.8, accent: pronunciation }).catch(() => {}).finally(() => setIsPlaying(false));
    }
  }, [isTyping, word.text, audio, pronunciation]);

  // 错误回退：检测 hasWrong 上跳沿 → 通知父组件回退模式
  useEffect(() => {
    if (state.hasWrong && !prevHasWrong.current) {
      onWrongChar?.();
    }
    prevHasWrong.current = state.hasWrong;
  }, [state.hasWrong, onWrongChar]);

  useEffect(() => {
    completedRef.current = false;
    setShowResult(false);
    setShowCompleteAnim(false);
    prevHasWrong.current = false;
  }, [word.id, learnMode]);

  const onChar = useCallback(
    (char: string) => {
      if (!isTyping) {
        setIsTyping(true);
        return;
      }
      const result = handleChar(char, typingMode);
      if (result.accepted) {
        if (result.correct) {
          playCorrectSound();
        } else {
          playWrongSound();
        }
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

  useKeyboardCapture(onChar, onBackspace, isTyping && !state.isFinished && !showResult && !disabled, onEnter);

  useEffect(() => {
    if (state.isFinished && !completedRef.current) {
      completedRef.current = true;
      setShowResult(true);
      const isPerfect = state.wrongCount === 0;
      if (isPerfect) {
        playCompleteSound();
        setShowCompleteAnim(true);
      }
      const letterMistakes = getLetterMistakes();
      const result: WordModeResult = {
        mode: learnMode,
        wrongCount: state.wrongCount,
        isCorrect: isPerfect,
        letterMistakes,
      };
      const timer = setTimeout(() => {
        onComplete(result);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.isFinished, state.wrongCount, learnMode, onComplete, getLetterMistakes, word.text, audio]);

  return (
    <div className="flex flex-grow flex-col items-center justify-center">
      {/* 复习标记 */}
      {isReview && reviewMeta && (
        <div className="mb-4 flex items-center gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300"
            style={{
              background: "oklch(0.9 0.06 85 / 0.55)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid oklch(0.82 0.08 85 / 0.4)",
            }}
          >
            复习
          </span>
          <span className="text-xs text-foreground/45">
            上次评分: {FSRS_RATING_LABELS[reviewMeta.previousRating] ?? "未知"}
          </span>
        </div>
      )}

      {/* 词条区域 */}
      <div className="container flex flex-grow flex-col items-center justify-center">
        <div className="relative flex w-full justify-center">
          <div className="relative flex flex-col items-center gap-10">
            {/* 字母行 */}
            <div
              className={cn(
                "flex items-center justify-center",
                state.hasWrong && "animate-shake",
                showCompleteAnim && "animate-word-success"
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
            {showPhonetic && (displayPhonetic || audio.supported) && (
              <div className="-mt-4 flex items-center gap-2">
                {displayPhonetic && (
                  <span className="font-mono text-sm font-normal text-muted-foreground/50">
                    [{displayPhonetic}]
                    <span className="ml-0.5 font-sans text-xs text-muted-foreground/35">{accentLabel}</span>
                  </span>
                )}
                {audio.supported && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaying(true);
                      audio
                        .speak(word.text, { rate: 0.8, accent: pronunciation })
                        .catch(() => {})
                        .finally(() => setIsPlaying(false));
                    }}
                    aria-label={isPlaying ? "正在播放" : "播放发音"}
                    title="播放发音"
                    className="inline-flex"
                  >
                    <Volume2
                      className={cn(
                        "h-5 w-5 transition-colors duration-300",
                        isPlaying
                          ? "text-primary"
                          : "text-muted-foreground/30 hover:text-primary cursor-pointer hover:scale-110"
                      )}
                      style={
                        isPlaying
                          ? { animation: "breathe 0.6s ease-in-out infinite" }
                          : undefined
                      }
                    />
                  </button>
                )}
              </div>
            )}

            {/* 释义 */}
            {showTranslation && (
              <p className="-mt-4 select-none text-xl text-foreground/55">
                {POS_LABELS[word.partOfSpeech] && (
                  <span className="mr-1.5 text-sm text-foreground/35">{POS_LABELS[word.partOfSpeech]}</span>
                )}
                {word.definition}
              </p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

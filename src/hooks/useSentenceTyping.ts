import { useReducer, useRef, useCallback, useEffect } from "react";
import type { LetterState } from "@/types/vocabulary";
import { WRONG_RESET_DELAY_MS } from "@/lib/constants";

/** 去除词首尾标点（保留 don't 等缩写中的撇号） */
function cleanWord(w: string): string {
  return w.replace(/^[.,!?;:"]+|[.,!?;:"]+$/g, "");
}

// ── 类型 ──

export interface SentenceTypingState {
  /** 句子的所有词 */
  words: string[];
  /** 当前正在输入第几个词 */
  currentWordIndex: number;
  /** 当前词的每个字母状态 */
  letterStates: LetterState[];
  /** 当前词已输入的字母 */
  inputWord: string;
  /** 当前词是否全部正确输入完成 */
  isWordFinished: boolean;
  /** 整句所有词是否完成 */
  isSentenceFinished: boolean;
  /** 当前词是否有过错误 */
  hasWrong: boolean;
  /** 当前词累计错误次数 */
  wrongCount: number;
  /** 已完成的词中打错的索引列表 */
  wrongWordIndices: number[];
}

export type SentenceTypingAction =
  | { type: "INIT_SENTENCE"; words: string[] }
  | { type: "ADD_CORRECT"; position: number; char: string }
  | { type: "ADD_WRONG"; position: number; char: string }
  | { type: "ADVANCE_WORD" }
  | { type: "RESET_CURRENT_WORD" }
  | { type: "FINISH_SENTENCE" };

// ── Reducer ──

function reducer(state: SentenceTypingState, action: SentenceTypingAction): SentenceTypingState {
  switch (action.type) {
    case "INIT_SENTENCE":
      return {
        words: action.words,
        currentWordIndex: 0,
        letterStates: new Array(action.words[0]?.length ?? 0).fill("normal"),
        inputWord: "",
        isWordFinished: false,
        isSentenceFinished: false,
        hasWrong: false,
        wrongCount: 0,
        wrongWordIndices: [],
      };

    case "ADD_CORRECT": {
      const next = [...state.letterStates];
      next[action.position] = "correct";
      const newInput = state.inputWord + action.char;
      const wordFinished = newInput.length >= (state.words[state.currentWordIndex]?.length ?? 0);
      return {
        ...state,
        inputWord: newInput,
        letterStates: next,
        isWordFinished: wordFinished,
      };
    }

    case "ADD_WRONG": {
      const next = [...state.letterStates];
      next[action.position] = "wrong";
      return {
        ...state,
        inputWord: state.inputWord + action.char,
        letterStates: next,
        hasWrong: true,
        wrongCount: state.wrongCount + 1,
      };
    }

    case "ADVANCE_WORD": {
      const nextIdx = state.currentWordIndex + 1;
      const isLast = nextIdx >= state.words.length;
      const nextWord = state.words[nextIdx] ?? "";
      const wordHadError = state.hasWrong || state.wrongCount > 0;
      return {
        ...state,
        currentWordIndex: isLast ? state.currentWordIndex : nextIdx,
        letterStates: new Array(nextWord.length).fill("normal"),
        inputWord: "",
        isWordFinished: false,
        hasWrong: false,
        wrongCount: 0,
        isSentenceFinished: isLast,
        wrongWordIndices: wordHadError
          ? [...state.wrongWordIndices, state.currentWordIndex]
          : state.wrongWordIndices,
      };
    }

    case "RESET_CURRENT_WORD": {
      const word = state.words[state.currentWordIndex] ?? "";
      return {
        ...state,
        letterStates: new Array(word.length).fill("normal"),
        inputWord: "",
        hasWrong: false,
      };
    }

    case "FINISH_SENTENCE":
      return { ...state, isSentenceFinished: true };

    default:
      return state;
  }
}

// ── Hook ──

export function useSentenceTyping(sentenceText: string) {
  const words = sentenceText.split(/\s+/).filter(Boolean).map(cleanWord).filter(Boolean);

  const [state, dispatch] = useReducer(reducer, {
    words,
    currentWordIndex: 0,
    letterStates: new Array(words[0]?.length ?? 0).fill("normal"),
    inputWord: "",
    isWordFinished: false,
    isSentenceFinished: false,
    hasWrong: false,
    wrongCount: 0,
    wrongWordIndices: [],
  });

  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // 句子文本变了 → 重新初始化（去除标点）
  useEffect(() => {
    const rawWords = sentenceText.split(/\s+/).filter(Boolean).map(cleanWord).filter(Boolean);
    dispatch({ type: "INIT_SENTENCE", words: rawWords });
  }, [sentenceText]);

  // 错字后定时重置
  useEffect(() => {
    if (!state.hasWrong) return;
    const timer = setTimeout(() => dispatch({ type: "RESET_CURRENT_WORD" }), WRONG_RESET_DELAY_MS);
    return () => clearTimeout(timer);
  }, [state.hasWrong]);

  // 当前词完成后短暂延迟 → 自动推进到下一词
  const wordFinishedRef = useRef(false);
  useEffect(() => {
    if (!state.isWordFinished || wordFinishedRef.current) return;
    wordFinishedRef.current = true;
    const timer = setTimeout(() => {
      dispatch({ type: "ADVANCE_WORD" });
      wordFinishedRef.current = false;
    }, 200);
    return () => { clearTimeout(timer); wordFinishedRef.current = false; };
  }, [state.isWordFinished]);

  /** 处理单个字符输入 */
  const handleChar = useCallback(
    (char: string): { accepted: boolean; correct: boolean } => {
      const s = stateRef.current;
      if (s.isSentenceFinished || s.isWordFinished || s.hasWrong)
        return { accepted: false, correct: false };

      const word = s.words[s.currentWordIndex];
      if (!word) return { accepted: false, correct: false };

      const pos = s.inputWord.length;
      if (pos >= word.length) return { accepted: false, correct: false };

      const expected = word[pos];
      const equal = char.toLowerCase() === expected.toLowerCase();

      if (equal) {
        dispatch({ type: "ADD_CORRECT", position: pos, char });
        return { accepted: true, correct: true };
      }

      dispatch({ type: "ADD_WRONG", position: pos, char });
      return { accepted: true, correct: false };
    },
    [],
  );

  return { state, handleChar };
}

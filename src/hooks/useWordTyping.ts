import { useReducer, useEffect, useRef, useCallback } from "react";
import type {
  WordTypingState,
  WordTypingAction,
} from "@/types/vocabulary";
import { WRONG_RESET_DELAY_MS } from "@/lib/constants";

// ── Reducer ──

function wordTypingReducer(
  state: WordTypingState,
  action: WordTypingAction
): WordTypingState {
  switch (action.type) {
    case "INIT":
      return {
        displayWord: action.displayWord,
        inputWord: "",
        letterStates: new Array(action.displayWord.length).fill("normal"),
        isFinished: false,
        hasWrong: false,
        wrongCount: 0,
        randomLetterVisible: action.randomVisible,
      };

    case "ADD_CORRECT": {
      const next = [...state.letterStates];
      next[action.position] = "correct";
      return {
        ...state,
        inputWord: state.inputWord + action.char,
        letterStates: next,
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

    case "RESET":
      return {
        ...state,
        inputWord: "",
        letterStates: new Array(state.displayWord.length).fill("normal"),
        hasWrong: false,
      };

    case "FINISH":
      return { ...state, isFinished: true };

    default:
      return state;
  }
}

export type { WordTypingState, WordTypingAction };

// ── Hook ──

export function useWordTyping(displayWord: string, isIgnoreCase: boolean) {
  const [state, dispatch] = useReducer(wordTypingReducer, {
    displayWord,
    inputWord: "",
    letterStates: new Array(displayWord.length).fill("normal"),
    isFinished: false,
    hasWrong: false,
    wrongCount: 0,
    randomLetterVisible: [],
  });

  const stateRef = useRef(state);
  const mistakesRef = useRef<Record<number, string[]>>({});

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const rv = displayWord.split("").map(() => Math.random() > 0.4);
    mistakesRef.current = {};
    dispatch({ type: "INIT", displayWord, randomVisible: rv });
  }, [displayWord]);

  // 错误重置定时器
  useEffect(() => {
    if (!state.hasWrong) return;
    const timer = setTimeout(() => {
      dispatch({ type: "RESET" });
    }, WRONG_RESET_DELAY_MS);
    return () => clearTimeout(timer);
  }, [state.hasWrong]);

  // 记录错误
  const recordMistake = useCallback((position: number, char: string) => {
    if (!mistakesRef.current[position]) {
      mistakesRef.current[position] = [];
    }
    if (!mistakesRef.current[position].includes(char)) {
      mistakesRef.current[position].push(char);
    }
  }, []);

  /** 处理字符输入：即时逐字比对，打错立刻标记 */
  const handleChar = useCallback(
    (char: string): { accepted: boolean; correct: boolean } => {
      const current = stateRef.current;
      if (current.isFinished || current.hasWrong)
        return { accepted: false, correct: false };

      const position = current.inputWord.length;
      if (position >= current.displayWord.length)
        return { accepted: false, correct: false };

      const correctChar = current.displayWord[position];
      const equal = isIgnoreCase
        ? char.toLowerCase() === correctChar.toLowerCase()
        : char === correctChar;

      if (equal) {
        dispatch({ type: "ADD_CORRECT", position, char });
        if (position >= current.displayWord.length - 1) {
          dispatch({ type: "FINISH" });
        }
        return { accepted: true, correct: true };
      }

      recordMistake(position, char);
      dispatch({ type: "ADD_WRONG", position, char });
      return { accepted: true, correct: false };
    },
    [isIgnoreCase, recordMistake]
  );

  /** 获取累计错误记录 */
  const getLetterMistakes = useCallback((): Record<number, string[]> => {
    return { ...mistakesRef.current };
  }, []);

  return {
    state,
    handleChar,
    getLetterMistakes,
  };
}

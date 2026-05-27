import { useReducer, useEffect, useRef, useCallback } from "react";
import type {
  WordTypingState,
  WordTypingAction,
  TypingMode,
} from "@/types/vocabulary";
import {
  WRONG_RESET_DELAY_MS,
  LOOSE_WRONG_RESET_DELAY_MS,
} from "@/lib/constants";

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

    case "ADD_CHAR":
      return {
        ...state,
        inputWord: state.inputWord + action.char,
      };

    case "DELETE_CHAR": {
      if (state.inputWord.length === 0) return state;
      const newLen = state.inputWord.length - 1;
      const next = [...state.letterStates];
      next[newLen] = "normal";
      return {
        ...state,
        inputWord: state.inputWord.slice(0, -1),
        letterStates: next,
      };
    }

    case "COMPARE_ALL": {
      const next = [...state.letterStates];
      for (const r of action.results) {
        next[r.position] = r.correct ? "correct" : "wrong";
      }
      const allCorrect = action.results.every((r) => r.correct);
      return {
        ...state,
        letterStates: next,
        isFinished: allCorrect,
        hasWrong: !allCorrect,
        wrongCount: allCorrect ? state.wrongCount : state.wrongCount + 1,
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

  // 同步 state 到 ref（在 effect 中更新，避免 lint 报错）
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // displayWord 变化时重新初始化
  useEffect(() => {
    const rv = displayWord.split("").map(() => Math.random() > 0.4);
    mistakesRef.current = {};
    dispatch({ type: "INIT", displayWord, randomVisible: rv });
  }, [displayWord]);

  // 模式引用（避免 handleChar 闭包过期）
  const modeRef = useRef<TypingMode>("strict");
  const setMode = useCallback((m: TypingMode) => {
    modeRef.current = m;
  }, []);

  // 错误重置定时器
  useEffect(() => {
    if (!state.hasWrong) return;
    const delay =
      modeRef.current === "strict"
        ? WRONG_RESET_DELAY_MS
        : LOOSE_WRONG_RESET_DELAY_MS;
    const timer = setTimeout(() => {
      dispatch({ type: "RESET" });
    }, delay);
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

  /** 处理字符输入，返回 { accepted, correct } */
  const handleChar = useCallback(
    (
      char: string,
      mode: TypingMode
    ): { accepted: boolean; correct: boolean } => {
      const current = stateRef.current;
      if (current.isFinished || current.hasWrong)
        return { accepted: false, correct: false };

      const position = current.inputWord.length;
      if (position >= current.displayWord.length)
        return { accepted: false, correct: false };

      if (mode === "strict") {
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
      }

      // 宽松模式：追加字符，输完后统一对比
      dispatch({ type: "ADD_CHAR", position, char });

      if (position >= current.displayWord.length - 1) {
        const inputWord = current.inputWord + char;
        const results: Array<{ position: number; correct: boolean }> = [];
        let allCorrect = true;
        for (let i = 0; i < current.displayWord.length; i++) {
          const equal = isIgnoreCase
            ? inputWord[i].toLowerCase() ===
              current.displayWord[i].toLowerCase()
            : inputWord[i] === current.displayWord[i];
          results.push({ position: i, correct: equal });
          if (!equal) {
            allCorrect = false;
            recordMistake(i, inputWord[i]);
          }
        }
        dispatch({ type: "COMPARE_ALL", results });
        return { accepted: true, correct: allCorrect };
      }

      return { accepted: true, correct: true }; // 中间字符暂不判断
    },
    [isIgnoreCase, recordMistake]
  );

  /** 退格（仅宽松模式有效） */
  const handleBackspace = useCallback(() => {
    const current = stateRef.current;
    if (current.isFinished || current.hasWrong) return;
    if (current.inputWord.length === 0) return;
    dispatch({ type: "DELETE_CHAR" });
  }, []);

  /** 获取累计错误记录 */
  const getLetterMistakes = useCallback((): Record<number, string[]> => {
    return { ...mistakesRef.current };
  }, []);

  return {
    state,
    dispatch,
    handleChar,
    handleBackspace,
    setMode,
    getLetterMistakes,
  };
}

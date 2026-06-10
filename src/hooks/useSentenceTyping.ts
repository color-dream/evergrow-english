import { useReducer, useRef, useCallback, useEffect } from "react";

// ── 类型 ──

export interface SentenceWord {
  text: string;
  isActive: boolean;
  userInput: string;
  incorrect: boolean;
}

export type InputMode = "input" | "fix" | "fix-input";

export interface SentenceTypingState {
  /** 目标单词列表 */
  targetWords: string[];
  /** 对应用户输入（与 targetWords 对齐） */
  userWords: SentenceWord[];
  /** 原始输入值 */
  inputValue: string;
  /** 当前输入模式 */
  mode: InputMode;
  /** Fix 模式下正在修正的词在 userWords 中的索引 */
  fixWordIndex: number;
  /** 本轮是否已提交过（用于判断是否进入 fix 模式） */
  submitted: boolean;
}

export type SentenceTypingAction =
  | { type: "INIT"; targetWords: string[] }
  | { type: "SET_INPUT"; value: string }
  | { type: "SUBMIT" }
  | { type: "START_FIX"; firstChar?: string }
  | { type: "FIX_NEXT" }
  | { type: "FIX_PREV" }
  | { type: "FIX_DONE" };

// ── 工具函数 ──

/** 去除标点噪声（earthworm 的 formatInputText） */
function normalizeWord(w: string): string {
  return w
    .toLowerCase()
    .replace(/[.,!?;:'"()]+/g, "")
    .replace(/['‘’“”]/g, "'")
    .trim();
}

/** 将原始 input 按空格分词并与 targetWords 对齐 */
function syncWords(inputValue: string, targetWords: string[]): SentenceWord[] {
  const parts = inputValue.split(" ");
  return targetWords.map((target, i) => {
    const userInput = parts[i] ?? "";
    return {
      text: target,
      isActive: i === parts.length - 1 || (i < parts.length && parts[i + 1] === undefined && i === targetWords.length - 1),
      userInput,
      incorrect: false,
    };
  });
}

function findFirstWrongIndex(words: SentenceWord[]): number {
  return words.findIndex((w) => {
    const formatted = normalizeWord(w.userInput);
    const target = normalizeWord(w.text);
    return formatted !== target;
  });
}

// ── Reducer ──

function reducer(state: SentenceTypingState, action: SentenceTypingAction): SentenceTypingState {
  switch (action.type) {
    case "INIT":
      return {
        targetWords: action.targetWords,
        userWords: action.targetWords.map((text, i) => ({
          text,
          isActive: i === 0,
          userInput: "",
          incorrect: false,
        })),
        inputValue: "",
        mode: "input",
        fixWordIndex: -1,
        submitted: false,
      };

    case "SET_INPUT": {
      if (state.mode === "fix") return state; // fix 模式下等待任意键清除
      // 在 fix-input 模式下，inputValue 由外部特殊处理
      if (state.mode === "fix-input") {
        const words = state.userWords.map((w, i) =>
          i === state.fixWordIndex ? { ...w, userInput: action.value } : w,
        );
        const liveWords = state.targetWords.map((text, i) => {
          const w = words[i];
          return w ?? { text, isActive: false, userInput: "", incorrect: false };
        });
        return { ...state, userWords: liveWords, inputValue: action.value };
      }

      // input 模式：正常分词同步
      const words = syncWords(action.value, state.targetWords);
      // 按空格后才跳到下个单词；当前活跃词 = 最后一个被分词到的位置
      const parts = action.value.split(" ");
      const activeIdx = Math.min(parts.length - 1, state.targetWords.length - 1);
      const finalWords = words.map((w, i) => ({
        ...w,
        isActive: i === (activeIdx === -1 ? state.targetWords.length - 1 : activeIdx),
      }));
      return { ...state, userWords: finalWords, inputValue: action.value };
    }

    case "SUBMIT": {
      const words = state.userWords.map((w) => {
        const formatted = normalizeWord(w.userInput);
        const target = normalizeWord(w.text);
        return { ...w, incorrect: formatted !== target };
      });
      const allCorrect = words.every((w) => !w.incorrect);
      if (allCorrect) {
        return { ...state, userWords: words, mode: "input", submitted: true };
      }
      return { ...state, userWords: words, mode: "fix", submitted: true };
    }

    case "START_FIX": {
      const firstWrong = findFirstWrongIndex(state.userWords);
      if (firstWrong === -1) return { ...state, mode: "input", fixWordIndex: -1 };
      const firstChar = action.firstChar ?? "";
      // 清空所有错误词，保留 correct 词；第一个错误词激活；保留 incorrect 标记用于 fixNext/fixPrev 导航
      const words = state.userWords.map((w, i) =>
        w.incorrect
          ? { ...w, userInput: i === firstWrong ? firstChar : "", isActive: i === firstWrong }
          : { ...w, isActive: false },
      );
      return { ...state, userWords: words, mode: "fix-input", fixWordIndex: firstWrong, inputValue: firstChar, submitted: false };
    }

    case "FIX_NEXT": {
      const nextWrong = state.userWords.findIndex(
        (w, i) => i > state.fixWordIndex && w.incorrect,
      );
      if (nextWrong === -1) return { ...state, mode: "input", fixWordIndex: -1, submitted: false };
      // 保留 incorrect 标记，便于 FIX_PREV 回退查找
      const words = state.userWords.map((w, i) =>
        i === nextWrong ? { ...w, userInput: "", isActive: true } : { ...w, isActive: false },
      );
      return { ...state, userWords: words, mode: "fix-input", fixWordIndex: nextWrong, inputValue: "" };
    }

    case "FIX_PREV": {
      let prevWrong = -1;
      for (let i = state.fixWordIndex - 1; i >= 0; i--) {
        if (state.userWords[i].incorrect) {
          prevWrong = i;
          break;
        }
      }
      if (prevWrong === -1) {
        prevWrong = state.userWords.findIndex((w) => w.incorrect);
      }
      if (prevWrong === -1) return { ...state, mode: "input", fixWordIndex: -1, submitted: false };
      // 保留 incorrect 标记
      const words = state.userWords.map((w, i) =>
        i === prevWrong ? { ...w, userInput: "", isActive: true } : { ...w, isActive: false },
      );
      return { ...state, userWords: words, mode: "fix-input", fixWordIndex: prevWrong, inputValue: "" };
    }

    case "FIX_DONE": {
      // 重新检查所有词
      const words = state.userWords.map((w) => {
        const formatted = normalizeWord(w.userInput);
        const target = normalizeWord(w.text);
        return { ...w, incorrect: formatted !== target };
      });
      const allCorrect = words.every((w) => !w.incorrect);
      if (allCorrect) {
        return { ...state, userWords: words, mode: "input", fixWordIndex: -1, submitted: true };
      }
      // 还有错误，继续 fix
      return { ...state, userWords: words, mode: "fix", fixWordIndex: -1 };
    }

    default:
      return state;
  }
}

// ── Hook ──

export function useSentenceTyping(sentenceEnglish: string) {
  const rawWords = sentenceEnglish.split(/\s+/).filter(Boolean);
  const targetWords = rawWords.map((w) =>
    w.replace(/^[.,!?;:'"()]+|[.,!?;:'"()]+$/g, ""),
  ).filter(Boolean);

  const [state, dispatch] = useReducer(reducer, {
    targetWords,
    userWords: targetWords.map((text) => ({ text, isActive: false, userInput: "", incorrect: false })),
    inputValue: "",
    mode: "input",
    fixWordIndex: -1,
    submitted: false,
  });

  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // 句子文本变了 → 重新初始化
  useEffect(() => {
    dispatch({ type: "INIT", targetWords });
  }, [sentenceEnglish]);

  /** 设置输入值 */
  const setInput = useCallback((value: string) => {
    dispatch({ type: "SET_INPUT", value });
  }, []);

  /** 提交答案 → 返回是否正确 */
  const submit = useCallback((): boolean => {
    dispatch({ type: "SUBMIT" });
    // 需要等下一帧读取 state
    return true;
  }, []);

  /** 进入 fix 模式（修正第一个错误词） */
  const startFix = useCallback(() => {
    dispatch({ type: "START_FIX" });
  }, []);

  /** 修正下一个错误词 */
  const fixNext = useCallback(() => {
    dispatch({ type: "FIX_NEXT" });
  }, []);

  /** 回到上一个错误词 */
  const fixPrev = useCallback(() => {
    dispatch({ type: "FIX_PREV" });
  }, []);

  /** 完成 fix 后重新判定 */
  const fixDone = useCallback(() => {
    dispatch({ type: "FIX_DONE" });
  }, []);

  /** 检查是否全部正确（在 submit 后使用） */
  const checkAllCorrect = useCallback((): boolean => {
    const s = stateRef.current;
    return s.userWords.every((w) => {
      const formatted = normalizeWord(w.userInput);
      const target = normalizeWord(w.text);
      return formatted === target;
    });
  }, []);

  /** 获取错误词索引列表 */
  const getWrongIndices = useCallback((): number[] => {
    return stateRef.current.userWords
      .map((w, i) => ({ w, i }))
      .filter(({ w }) => {
        const formatted = normalizeWord(w.userInput);
        const target = normalizeWord(w.text);
        return formatted !== target;
      })
      .map(({ i }) => i);
  }, []);

  /** 检查是否处于 fix 等待状态（需要任意键触发） */
  const isFixPending = useCallback((): boolean => {
    return stateRef.current.mode === "fix";
  }, []);

  /** 检查是否处于 fix-input 状态 */
  const isFixInput = useCallback((): boolean => {
    return stateRef.current.mode === "fix-input";
  }, []);

  return {
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
    targetWords,
  };
}

import React from "react";
import type { LetterState } from "@/types/vocabulary";

interface LetterBoxProps {
  letter: string;
  state: LetterState;
  visible: boolean;
  /** 用户在当前位置实际输入的字符，null 表示尚未输入 */
  userChar?: string | null;
}

const EXPLICIT_SPACE = "␣";

const visibleColorMap: Record<LetterState, string> = {
  normal: "text-letter-normal",
  correct: "text-letter-correct",
  wrong: "text-letter-wrong",
};

const hiddenColorMap: Record<LetterState, string> = {
  normal: "text-letter-hidden",
  correct: "text-letter-correct",
  wrong: "text-letter-wrong-hidden",
};

function formatChar(ch: string) {
  if (ch === " ") return EXPLICIT_SPACE;
  if (ch === "...") return "..";
  return ch;
}

const LetterBox = React.memo(function LetterBox({
  letter,
  state,
  visible,
  userChar,
}: LetterBoxProps) {
  const colorClass = visible ? visibleColorMap[state] : hiddenColorMap[state];

  const displayChar = (() => {
    if (visible) return formatChar(letter);
    if (userChar != null) return formatChar(userChar);
    return "_";
  })();

  const aria = (() => {
    if (visible) return letter;
    if (userChar != null) return userChar;
    return "隐藏字母";
  })();

  return (
    <span
      className={`m-0 p-0 pr-[0.3rem] font-mono text-5xl md:text-6xl font-medium select-none tracking-tight ${colorClass}`}
      aria-label={aria}
      style={{ textShadow: "0 1px 0 oklch(0 0 0 / 0.04)" }}
    >
      {displayChar}
    </span>
  );
});

export default LetterBox;

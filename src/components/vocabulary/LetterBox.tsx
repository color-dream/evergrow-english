import React from "react";
import type { LetterState } from "@/types/vocabulary";

interface LetterBoxProps {
  letter: string;
  state: LetterState;
  visible: boolean;
}

const EXPLICIT_SPACE = "␣";

const visibleColorMap: Record<LetterState, string> = {
  normal: "text-letter-normal",
  correct: "text-letter-correct",
  wrong: "text-letter-wrong",
};

const hiddenColorMap: Record<LetterState, string> = {
  normal: "text-letter-hidden",
  correct: "text-letter-correct-hidden",
  wrong: "text-letter-wrong-hidden",
};

const LetterBox = React.memo(function LetterBox({
  letter,
  state,
  visible,
}: LetterBoxProps) {
  const displayChar =
    letter === " " ? EXPLICIT_SPACE : letter === "..." ? ".." : letter;
  const colorClass = visible ? visibleColorMap[state] : hiddenColorMap[state];

  return (
    <span
      className={`m-0 p-0 pr-[0.2rem] font-mono text-5xl font-normal select-none ${colorClass}`}
      aria-label={visible ? letter : "隐藏字母"}
    >
      {visible ? displayChar : "_"}
    </span>
  );
});

export default LetterBox;

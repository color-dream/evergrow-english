import React from "react";
import type { LetterState } from "@/types/vocabulary";
import { cn } from "@/lib/utils";

interface LetterBoxProps {
  letter: string;
  state: LetterState;
  visible: boolean;
}

const colorMap: Record<LetterState, string> = {
  normal: "text-foreground",
  correct: "text-success",
  wrong: "text-destructive",
};

const boxMap: Record<LetterState, string> = {
  normal: "",
  correct: "scale-110",
  wrong: "animate-shake",
};

const LetterBox = React.memo(function LetterBox({
  letter,
  state,
  visible,
}: LetterBoxProps) {
  return (
    <span
      className={cn(
        "inline-flex h-14 w-9 items-center justify-center font-mono text-4xl font-medium select-none rounded-md transition-all duration-100",
        visible
          ? cn(colorMap[state], boxMap[state])
          : "text-muted-foreground/40"
      )}
      aria-label={visible ? letter : "隐藏字母"}
    >
      {visible ? letter : "_"}
    </span>
  );
});

export default LetterBox;

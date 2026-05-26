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

const LetterBox = React.memo(function LetterBox({
  letter,
  state,
  visible,
}: LetterBoxProps) {
  return (
    <span
      className={cn(
        "font-mono text-3xl select-none transition-colors duration-75",
        visible ? colorMap[state] : "text-muted-foreground"
      )}
    >
      {visible ? letter : "_"}
    </span>
  );
});

export default LetterBox;

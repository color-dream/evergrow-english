import { useEffect, useRef } from "react";
import { isLegal, isChineseSymbol } from "@/lib/keyboard-utils";

/** 全局键盘事件捕获。enabled 为 true 时监听 window keydown。 */
export function useKeyboardCapture(
  onChar: (char: string) => void,
  onBackspace: () => void,
  enabled: boolean,
  onEnter?: () => void
): void {
  const onCharRef = useRef(onChar);
  const onBackspaceRef = useRef(onBackspace);
  const onEnterRef = useRef(onEnter);

  useEffect(() => {
    onCharRef.current = onChar;
    onBackspaceRef.current = onBackspace;
    onEnterRef.current = onEnter;
  });

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      if (e.key === "Enter") {
        e.preventDefault();
        onEnterRef.current?.();
        return;
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        onBackspaceRef.current();
        return;
      }

      if (isChineseSymbol(e.key)) {
        alert("请关闭中文输入法后继续");
        return;
      }

      if (isLegal(e.key)) {
        e.preventDefault();
        onCharRef.current(e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}

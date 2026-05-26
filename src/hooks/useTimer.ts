import { useEffect, useRef, useState } from "react";

/** 返回从 startTime 开始的已过秒数。startTime 为 null 时返回 0。 */
export function useTimer(startTime: number | null): number {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (startTime === null) {
      // 重置计时器
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setElapsed(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const tick = () => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [startTime]);

  return elapsed;
}

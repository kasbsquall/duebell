import { useCallback, useEffect, useRef, useState } from "react";

// A seekable clock driven by requestAnimationFrame. It stops at the end and holds there.
export function usePlayhead(duration: number) {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const tRef = useRef(0);
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) {
      lastRef.current = null;
      return;
    }
    let frame = 0;
    const step = (now: number) => {
      const last = lastRef.current ?? now;
      lastRef.current = now;
      const next = Math.min(tRef.current + (now - last) / 1000, duration);
      tRef.current = next;
      setT(next);
      if (next >= duration) {
        setPlaying(false);
        return;
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [playing, duration]);

  const seek = useCallback(
    (to: number) => {
      const clamped = Math.max(0, Math.min(to, duration));
      tRef.current = clamped;
      lastRef.current = null;
      setT(clamped);
    },
    [duration],
  );

  const toggle = useCallback(() => {
    if (tRef.current >= duration) {
      seek(0);
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  }, [duration, seek]);

  const restart = useCallback(() => {
    seek(0);
    setPlaying(true);
  }, [seek]);

  return { t, playing, seek, toggle, restart, setPlaying };
}

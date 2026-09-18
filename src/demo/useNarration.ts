import { useEffect, useRef } from "react";
import type { Chapter, ChapterId } from "./timeline";

// One short voice clip per chapter. Muted until the viewer turns the sound on; after that,
// entering a chapter (by playback or by a click on the rail) plays its clip from the
// matching offset, and pausing the replay pauses the voice.
export function useNarration(chapter: Chapter, t: number, playing: boolean, enabled: boolean, seekKey: number) {
  const clips = useRef<Partial<Record<ChapterId, HTMLAudioElement>>>({});
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    const all = clips.current;
    Object.values(all).forEach((a) => a?.pause());
    if (!enabled || !playing) return;
    const audio = all[chapter.id] ?? new Audio(`/narration/${chapter.id}.mp3`);
    all[chapter.id] = audio;
    const offset = Math.max(0, tRef.current - chapter.start);
    audio.currentTime = offset;
    audio.play().catch(() => {
      // Autoplay refused or the clip failed to load: the replay keeps running silently.
    });
  }, [chapter, enabled, playing, seekKey]);

  useEffect(() => () => Object.values(clips.current).forEach((a) => a?.pause()), []);
}

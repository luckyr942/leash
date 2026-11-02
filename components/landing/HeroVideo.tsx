"use client";
import { useEffect, useRef, useState } from "react";

/** Full-bleed product video (a real recording of Leash). Pausable; respects reduced motion. */
export default function HeroVideo({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.pause();
      setPlaying(false);
      return;
    }
    v.play().catch(() => setPlaying(false));
  }, []);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <>
      <video ref={ref} className={`lp-video ${className}`} muted loop playsInline preload="metadata" poster="/media/hero-poster.webp" aria-hidden="true" tabIndex={-1}>
        <source src="/media/hero.webm" type="video/webm" />
        <source src="/media/hero.mp4" type="video/mp4" />
      </video>
      <button className="lp-video-toggle" onClick={toggle} aria-label={playing ? "Pause background video" : "Play background video"}>
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 4l13 8-13 8z" fill="currentColor" />
          </svg>
        )}
      </button>
    </>
  );
}

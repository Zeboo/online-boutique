"use client";

import { useEffect } from "react";

export function CinematicAtmosphere() {
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      document.documentElement.style.setProperty("--cinematic-scroll", (max > 0 ? window.scrollY / max : 0).toFixed(4));
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (frame) window.cancelAnimationFrame(frame); };
  }, []);

  return <div className="cinematic-atmosphere" aria-hidden="true"><div className="cinematic-vignette" /><svg className="cinematic-grain" viewBox="0 0 180 180" preserveAspectRatio="none"><filter id="cinematic-noise"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" stitchTiles="stitch" /></filter><rect width="100%" height="100%" filter="url(#cinematic-noise)" /></svg></div>;
}

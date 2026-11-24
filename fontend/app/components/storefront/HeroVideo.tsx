"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

export function HeroVideo({ src }: { src?: string | null }) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVideo = !src || /\.(mp4|webm)(?:$|\?)/i.test(src);

  useEffect(() => {
    const media = mediaRef.current;
    const video = videoRef.current;
    const scene = media?.closest<HTMLElement>(".hero-scroll-scene");
    const hero = media?.closest<HTMLElement>(".hero");
    if (!scene || !hero || !video) return;

    let frame = 0;
    let duration = 0;
    let targetTime = 0;

    const update = () => {
      const rect = scene.getBoundingClientRect();
      const scrollableDistance = Math.max(scene.offsetHeight - window.innerHeight, 1);
      const progress = Math.min(1, Math.max(0, -rect.top / scrollableDistance));
      hero.style.setProperty("--hero-scroll", progress.toFixed(4));

      if (duration > 0) {
        // Avoid a black encoded tail frame while still reaching the visual end.
        targetTime = progress * Math.max(duration - 0.04, 0);
        const difference = targetTime - video.currentTime;

        if (Math.abs(difference) > 0.012) {
          video.currentTime += difference * 0.2;
          frame = window.requestAnimationFrame(update);
          return;
        }

        video.currentTime = targetTime;
      }

      frame = 0;
    };

    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    const onMetadata = () => {
      duration = Number.isFinite(video.duration) ? video.duration : 0;
      video.pause();
      requestUpdate();
    };

    video.pause();
    video.addEventListener("loadedmetadata", onMetadata);
    if (video.readyState >= 1) onMetadata();
    else requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      video.removeEventListener("loadedmetadata", onMetadata);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
      hero.style.removeProperty("--hero-scroll");
    };
  }, [isVideo, src]);

  if (src && !isVideo) {
    return <div ref={mediaRef} className="hero-video-wrap hero-uploaded-image" aria-hidden="true"><Image src={src} alt="" fill sizes="100vw" unoptimized /></div>;
  }

  return (
    <div ref={mediaRef} className="hero-video-wrap" aria-hidden="true">
      <video
        ref={videoRef}
        className="hero-video"
        muted
        playsInline
        preload="auto"
        poster="/hero-banner.png"
        tabIndex={-1}
      >
        <source src={src ?? "/Product_demo_commercial_showcase_d67c3e5c.mp4"} type={src && /\.webm(?:$|\?)/i.test(src) ? "video/webm" : "video/mp4"} />
      </video>
    </div>
  );
}

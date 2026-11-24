"use client";

import { useEffect, useRef, type CSSProperties, type PropsWithChildren } from "react";

export function Reveal({ children, className = "", delay = 0 }: PropsWithChildren<{ className?: string; delay?: number }>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.dataset.revealed = "true";
      return;
    }
    const reveal = () => {
      element.dataset.revealed = "true";
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        reveal();
        observer.unobserve(element);
      }
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    observer.observe(element);
    // Never leave content hidden if an embedded browser delays intersection events.
    const fallback = window.setTimeout(reveal, 350);
    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return <div ref={ref} className={`cinematic-reveal ${className}`} style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}>{children}</div>;
}

"use client";

import { useEffect, useRef, type CSSProperties, type PropsWithChildren } from "react";

export function ScrollReveal({ children, className = "", delay = 0 }: PropsWithChildren<{ className?: string; delay?: number }>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const show = () => { element.dataset.visible = "true"; };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      show();
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        show();
        observer.unobserve(element);
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -10% 0px" });
    observer.observe(element);
    const fallback = window.setTimeout(show, 1800);
    return () => { observer.disconnect(); window.clearTimeout(fallback); };
  }, []);

  return <div ref={ref} className={`scroll-scene ${className}`} style={{ "--scene-delay": `${delay}ms` } as CSSProperties}>{children}</div>;
}

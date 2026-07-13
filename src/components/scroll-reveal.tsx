"use client";

import { useEffect, useRef, type ReactNode, type CSSProperties } from "react";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
  style?: CSSProperties;
};

export function ScrollReveal({
  children,
  className,
  delay = 0,
  threshold = 0.15,
  style,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      element.style.opacity = "1";
      element.style.transform = "none";
      element.style.filter = "none";
      return;
    }

    element.style.opacity = "0";
    element.style.transform = "translateY(28px) scale(0.98)";
    element.style.filter = "blur(8px)";
    element.style.transition =
      "opacity 680ms cubic-bezier(0.23, 1, 0.32, 1), transform 680ms cubic-bezier(0.23, 1, 0.32, 1), filter 680ms cubic-bezier(0.23, 1, 0.32, 1)";
    element.style.transitionDelay = `${delay}ms`;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            element.style.opacity = "1";
            element.style.transform = "translateY(0) scale(1)";
            element.style.filter = "blur(0)";
            observer.unobserve(element);
          }
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [delay, threshold]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}

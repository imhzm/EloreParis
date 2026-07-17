"use client";

import { useEffect, useRef, type RefObject } from "react";

type ScrollSceneProgressOptions = {
  selector: string;
  enterEnd?: number;
  exitStart?: number;
};

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);

function readHeaderOffset(root: HTMLElement) {
  const styles = getComputedStyle(root);

  for (const token of ["--cinematic-header-offset", "--header-offset"]) {
    const parsed = Number.parseFloat(styles.getPropertyValue(token));
    if (Number.isFinite(parsed)) return parsed;
  }

  return 0;
}

/** Keeps CSS animation variables in sync while CSS owns the sticky layout. */
export function useScrollSceneProgress<T extends HTMLElement>({
  selector,
  enterEnd = 0.2,
  exitStart = 0.78,
}: ScrollSceneProgressOptions): RefObject<T | null> {
  const rootRef = useRef<T>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scenes = Array.from(root.querySelectorAll<HTMLElement>(selector));
    let requestId = 0;

    const setReducedMotionState = () => {
      for (const scene of scenes) {
        scene.dataset.sceneState = "reduced";
        scene.style.setProperty("--progress", "0");
        scene.style.setProperty("--enter", "1");
        scene.style.setProperty("--exit", "0");
      }
    };

    const update = () => {
      requestId = 0;
      if (motionQuery.matches) {
        setReducedMotionState();
        return;
      }

      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const headerOffset = readHeaderOffset(root);
      const frameHeight = Math.max(viewportHeight - headerOffset, 1);

      // Two passes, and the split is the whole point. This loop used to read a
      // scene's geometry and then write that scene's --progress/--enter/--exit
      // in the same iteration. Each write invalidates style, so the NEXT
      // scene's getBoundingClientRect had to flush it — a synchronous reflow per
      // scene, every scroll frame. The home page has nine scenes and each
      // cinematic page five to nine, so a single scroll frame forced five to
      // nine full layout recalcs. That was the largest scroll-jank source on the
      // site.
      //
      // Pass one reads every rect up front, so the frame pays one layout flush.
      // Pass two only writes; nothing reads again until the next frame, so no
      // write triggers a reflow.
      const bounds = scenes.map((scene) => scene.getBoundingClientRect());

      for (let index = 0; index < scenes.length; index += 1) {
        const scene = scenes[index];
        const rect = bounds[index];
        const stickyTravel = rect.height - frameHeight;
        const progress =
          stickyTravel > 1
            ? clamp((headerOffset - rect.top) / stickyTravel)
            : clamp(
                (frameHeight - (rect.top - headerOffset)) /
                  Math.max(frameHeight + rect.height, 1),
              );

        scene.dataset.sceneState =
          rect.top > headerOffset
            ? "before"
            : rect.bottom <= viewportHeight
              ? "after"
              : "active";
        scene.style.setProperty("--progress", progress.toFixed(5));
        scene.style.setProperty("--enter", clamp(progress / enterEnd).toFixed(5));
        scene.style.setProperty(
          "--exit",
          clamp((progress - exitStart) / Math.max(1 - exitStart, 0.01)).toFixed(5),
        );
      }
    };

    const schedule = () => {
      if (!requestId) requestId = window.requestAnimationFrame(update);
    };

    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(root);
    for (const scene of scenes) resizeObserver.observe(scene);

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    motionQuery.addEventListener("change", schedule);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      motionQuery.removeEventListener("change", schedule);
      resizeObserver.disconnect();
      if (requestId) window.cancelAnimationFrame(requestId);
    };
  }, [enterEnd, exitStart, selector]);

  return rootRef;
}

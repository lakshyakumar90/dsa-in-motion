import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * Measures the real content for every frame and eases between those natural
 * heights. It does not reserve the largest possible frame or impose a fixed
 * panel height, so short explanations stay compact and long ones have room.
 */
export function AnimatedHeight({ contentKey, className, children, holdGrowth = false }: {
  contentKey: string | number;
  className?: string;
  children: React.ReactNode;
  holdGrowth?: boolean;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastNaturalHeight = useRef<number | null>(null);
  const reservedHeight = useRef(0);
  const runId = useRef(0);

  useEffect(() => {
    const shell = shellRef.current;
    const content = contentRef.current;
    if (!shell || !content || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      // Track responsive reflow. Animated stages may grow to fit a larger
      // layout, but do not shrink on every shorter sentence in the next frame.
      const naturalHeight = content.getBoundingClientRect().height;
      if (holdGrowth) {
        if (!shell.dataset.animating && naturalHeight > reservedHeight.current + 1) {
          reservedHeight.current = naturalHeight;
          shell.style.height = `${naturalHeight}px`;
        }
      } else if (!shell.dataset.animating) lastNaturalHeight.current = naturalHeight;
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, [holdGrowth]);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    const content = contentRef.current;
    if (!shell || !content) return;

    const nextHeight = content.getBoundingClientRect().height;
    if (holdGrowth) {
      const currentHeight = shell.dataset.animating ? shell.getBoundingClientRect().height : shell.getBoundingClientRect().height;
      const targetHeight = Math.max(reservedHeight.current, nextHeight);
      reservedHeight.current = targetHeight;
      lastNaturalHeight.current = nextHeight;
      if (reservedHeight.current === nextHeight && currentHeight < 1) {
        shell.style.height = `${targetHeight}px`;
        return;
      }
      if (targetHeight <= currentHeight + 1) {
        shell.style.height = `${Math.max(targetHeight, currentHeight)}px`;
        return;
      }
      const currentRun = ++runId.current;
      shell.dataset.animating = String(currentRun);
      shell.style.height = `${currentHeight}px`;
      void shell.offsetHeight;
      const animationFrame = window.requestAnimationFrame(() => {
        if (runId.current === currentRun) shell.style.height = `${targetHeight}px`;
      });
      const fallback = window.setTimeout(() => {
        if (runId.current === currentRun) {
          shell.style.height = `${reservedHeight.current}px`;
          delete shell.dataset.animating;
        }
      }, 560);
      return () => { window.cancelAnimationFrame(animationFrame); window.clearTimeout(fallback); };
    }
    const previousHeight = lastNaturalHeight.current;
    lastNaturalHeight.current = nextHeight;

    // First paint uses the browser's natural layout with no entrance resize.
    if (previousHeight === null) return;

    // If a learner advances again mid-transition, continue from the visible
    // height instead of jumping back to the previous target.
    const currentHeight = shell.dataset.animating
      ? shell.getBoundingClientRect().height
      : previousHeight;
    if (Math.abs(currentHeight - nextHeight) < 1) return;

    const currentRun = ++runId.current;
    shell.dataset.animating = String(currentRun);
    shell.style.height = `${currentHeight}px`;
    void shell.offsetHeight;
    const animationFrame = window.requestAnimationFrame(() => {
      if (runId.current === currentRun) shell.style.height = `${nextHeight}px`;
    });
    const fallback = window.setTimeout(() => {
      if (runId.current === currentRun) {
        shell.style.height = "auto";
        delete shell.dataset.animating;
        lastNaturalHeight.current = content.getBoundingClientRect().height;
      }
    }, 560);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(fallback);
    };
  }, [contentKey, holdGrowth]);

  function finishResize(event: React.TransitionEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || event.propertyName !== "height") return;
    const shell = shellRef.current;
    if (!shell || Number(shell.dataset.animating) !== runId.current) return;
    if (holdGrowth) {
      shell.style.height = `${reservedHeight.current}px`;
      delete shell.dataset.animating;
      return;
    }
    shell.style.height = "auto";
    delete shell.dataset.animating;
    lastNaturalHeight.current = contentRef.current?.getBoundingClientRect().height ?? lastNaturalHeight.current;
  }

  return <div ref={shellRef} className={`animated-height ${className ?? ""}`} onTransitionEnd={finishResize}>
    <div ref={contentRef} className="animated-height-content">{children}</div>
  </div>;
}

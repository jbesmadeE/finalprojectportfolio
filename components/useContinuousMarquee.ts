import { useCallback, useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

/** Shared continuous track motion and drag-click handling. */
type MarqueeOptions = {
  desktopSpeedPxPerSecond: number;
  mobileSpeedPxPerSecond: number;
  hoverPlaybackRate?: number;
};

export function useContinuousMarquee({
  desktopSpeedPxPerSecond,
  mobileSpeedPxPerSecond,
  hoverPlaybackRate = 0.55,
}: MarqueeOptions) {
  const trackRef = useRef<HTMLDivElement>(null);
  const firstGroupRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<Animation | null>(null);
  const durationRef = useRef(0);
  const distanceRef = useRef(0);
  const hoveringRef = useRef(false);
  const focusedRef = useRef(false);
  const dragRef = useRef<{ pointerId: number; lastX: number } | null>(null);
  const reducedMotion = useReducedMotion();
  const reducedMotionRef = useRef(reducedMotion);

  const syncPlayback = useCallback(() => {
    const animation = animationRef.current;
    if (!animation) return;

    animation.playbackRate = hoveringRef.current ? hoverPlaybackRate : 1;
    if (
      reducedMotionRef.current ||
      document.hidden ||
      dragRef.current ||
      focusedRef.current
    ) {
      animation.pause();
    } else {
      animation.play();
    }
  }, [hoverPlaybackRate]);

  const adjustByPixels = useCallback((deltaX: number) => {
    const animation = animationRef.current;
    const duration = durationRef.current;
    const distance = distanceRef.current;
    if (!animation || !duration || !distance) return;

    const currentTime = Number(animation.currentTime ?? 0);
    const progress = ((currentTime % duration) + duration) % duration;
    const deltaTime = (-deltaX / distance) * duration;
    animation.currentTime = ((progress + deltaTime) % duration + duration) % duration;
  }, []);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
    syncPlayback();
  }, [reducedMotion, syncPlayback]);

  useEffect(() => {
    const track = trackRef.current;
    const firstGroup = firstGroupRef.current;
    if (!track || !firstGroup) return;

    const viewportQuery = window.matchMedia("(max-width: 639px)");
    const updateAnimation = () => {
      const distance = firstGroup.getBoundingClientRect().width;
      if (distance <= 0) return;

      const previousDuration = durationRef.current;
      const previousTime = Number(animationRef.current?.currentTime ?? 0);
      const progress =
        previousDuration > 0
          ? (((previousTime % previousDuration) + previousDuration) % previousDuration) /
            previousDuration
          : 0;
      const speed = viewportQuery.matches
        ? mobileSpeedPxPerSecond
        : desktopSpeedPxPerSecond;
      const duration = (distance / speed) * 1000;

      animationRef.current?.cancel();
      const animation = track.animate(
        [
          { transform: "translate3d(0, 0, 0)" },
          { transform: `translate3d(${-distance}px, 0, 0)` },
        ],
        { duration, iterations: Infinity, easing: "linear" },
      );
      animation.currentTime = progress * duration;
      animationRef.current = animation;
      durationRef.current = duration;
      distanceRef.current = distance;
      syncPlayback();
    };

    const resizeObserver = new ResizeObserver(updateAnimation);
    resizeObserver.observe(firstGroup);
    viewportQuery.addEventListener("change", updateAnimation);
    window.addEventListener("resize", updateAnimation);
    document.addEventListener("visibilitychange", syncPlayback);
    updateAnimation();

    return () => {
      resizeObserver.disconnect();
      viewportQuery.removeEventListener("change", updateAnimation);
      window.removeEventListener("resize", updateAnimation);
      document.removeEventListener("visibilitychange", syncPlayback);
      animationRef.current?.cancel();
      animationRef.current = null;
    };
  }, [
    desktopSpeedPxPerSecond,
    mobileSpeedPxPerSecond,
    reducedMotion,
    syncPlayback,
  ]);

  const onPointerEnter = useCallback(() => {
    hoveringRef.current = true;
    syncPlayback();
  }, [syncPlayback]);
  const onPointerLeave = useCallback(() => {
    hoveringRef.current = false;
    syncPlayback();
  }, [syncPlayback]);
  const onFocus = useCallback((event: React.FocusEvent<HTMLElement>) => {
    if (dragRef.current) {
      syncPlayback();
      return;
    }

    focusedRef.current = true;
    syncPlayback();
    const target = event.target;
    const viewport = trackRef.current?.parentElement?.getBoundingClientRect();
    if (!(target instanceof HTMLElement) || !viewport) return;

    const targetRect = target.getBoundingClientRect();
    const deltaX =
      targetRect.left < viewport.left
        ? viewport.left - targetRect.left
        : targetRect.right > viewport.right
          ? viewport.right - targetRect.right
          : 0;
    if (deltaX !== 0) adjustByPixels(deltaX);
  }, [adjustByPixels, syncPlayback]);
  const onBlur = useCallback((event: React.FocusEvent<HTMLElement>) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
    focusedRef.current = false;
    syncPlayback();
  }, [syncPlayback]);
  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (dragRef.current) return;

      focusedRef.current = false;
      dragRef.current = { pointerId: event.pointerId, lastX: event.clientX };
      event.currentTarget.setPointerCapture(event.pointerId);
      syncPlayback();
    },
    [syncPlayback],
  );
  const onPointerMove = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.lastX;
    drag.lastX = event.clientX;
    adjustByPixels(deltaX);
  }, [adjustByPixels]);
  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (dragRef.current?.pointerId !== event.pointerId) return;
      dragRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      syncPlayback();
    },
    [syncPlayback],
  );

  return {
    trackRef,
    firstGroupRef,
    onPointerEnter,
    onPointerLeave,
    onFocus,
    onBlur,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}

/**
 * Suppresses a click after a drag by ignoring pointer movement over 10px.
 */
export function useDragClickGuard() {
  const downPosRef = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    downPosRef.current = { x: event.clientX, y: event.clientY };
  }, []);

  const shouldIgnoreClick = useCallback((event: { clientX: number; clientY: number }) => {
    const down = downPosRef.current;
    downPosRef.current = null;
    if (!down) return false;
    const distance = Math.hypot(event.clientX - down.x, event.clientY - down.y);
    return distance > 10;
  }, []);

  return { onPointerDown, shouldIgnoreClick };
}

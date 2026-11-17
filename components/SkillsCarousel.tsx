"use client";

import { useCallback } from "react";
import { useShowcase } from "@/components/ShowcaseProvider";
import {
  useContinuousMarquee,
  useDragClickGuard,
} from "@/components/useContinuousMarquee";
import SkillIcon from "@/components/SkillIcon";
import { skills, type Skill } from "@/lib/data/skills";

const carouselGroups = [0, 1, 2, 3];

/**
 * Skills carousel — continuous seamless marquee, slows on hover and pauses
 * for touch/focus interaction and under prefers-reduced-motion.
 */
export default function SkillsCarousel({ className = "" }: { className?: string }) {
  const {
    trackRef,
    firstGroupRef,
    onPointerEnter,
    onPointerLeave,
    onFocus,
    onBlur,
    onPointerDown: onMarqueePointerDown,
    onPointerMove,
    onPointerUp,
  } = useContinuousMarquee({
    desktopSpeedPxPerSecond: 72,
    mobileSpeedPxPerSecond: 54,
    hoverPlaybackRate: 0.55,
  });
  const { onPointerDown, shouldIgnoreClick } = useDragClickGuard();
  const { openSkill } = useShowcase();

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      onPointerDown(event);
      onMarqueePointerDown(event);
    },
    [onPointerDown, onMarqueePointerDown],
  );

  return (
    <div
      className={`min-w-0 touch-pan-y ${className}`}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocusCapture={onFocus}
      onBlurCapture={onBlur}
    >
      <div className="overflow-hidden">
        <div className="flex w-max" ref={trackRef}>
          <div
            ref={firstGroupRef}
            className="flex h-11 shrink-0 items-center gap-2 pr-2 sm:h-12 lg:h-14"
          >
            {skills.map((skill) => (
              <SkillSlide
                key={`${skill.id}-0`}
                skill={skill}
                isDuplicate={false}
                onPointerDown={handlePointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                shouldIgnoreClick={shouldIgnoreClick}
                onOpen={openSkill}
              />
            ))}
          </div>
          {carouselGroups.slice(1).map((groupIndex) => (
            <div
              key={groupIndex}
              aria-hidden
              className="flex h-11 shrink-0 items-center gap-2 pr-2 sm:h-12 lg:h-14"
            >
              {skills.map((skill) => (
                <SkillSlide
                  key={`${skill.id}-${groupIndex}`}
                  skill={skill}
                  isDuplicate
                  onPointerDown={handlePointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  shouldIgnoreClick={shouldIgnoreClick}
                  onOpen={openSkill}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SkillSlide({
  skill,
  isDuplicate,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  shouldIgnoreClick,
  onOpen,
}: {
  skill: Skill;
  isDuplicate: boolean;
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => void;
  shouldIgnoreClick: (event: { clientX: number; clientY: number }) => boolean;
  onOpen: (skill: Skill) => void;
}) {
  return (
    <div aria-hidden={isDuplicate || undefined} className="min-w-0 flex-[0_0_auto]">
      <button
        type="button"
        tabIndex={isDuplicate ? -1 : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={(event) => {
          if (shouldIgnoreClick(event)) return; // end of a drag, not a tap
          if (isDuplicate) event.currentTarget.blur();
          onOpen(skill);
        }}
        aria-label={`${skill.name} — open details`}
        className="flex h-full items-center gap-2 rounded-xl border border-white/10 bg-surface px-3 text-xs font-medium text-zinc-300 transition-all duration-200 hover:border-accent/50 hover:text-zinc-100 hover:shadow-[0_0_16px_rgba(139,92,246,0.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white p-0.5">
          <SkillIcon
            iconSrc={skill.iconSrc}
            className="h-full w-full object-contain"
          />
        </span>
        <span className="whitespace-nowrap">{skill.name}</span>
      </button>
    </div>
  );
}

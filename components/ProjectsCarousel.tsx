"use client";

import { useCallback } from "react";
import { useShowcase, PlaceholderTile } from "@/components/ShowcaseProvider";
import {
  useContinuousMarquee,
  useDragClickGuard,
} from "@/components/useContinuousMarquee";
import { projects, type Project } from "@/lib/data/projects";

const carouselGroups = [0, 1, 2, 3];

/**
 * Projects carousel — continuous seamless marquee, slows on hover, pauses
 * for touch/focus interaction, and respects prefers-reduced-motion.
 */
export default function ProjectsCarousel({ className = "" }: { className?: string }) {
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
    desktopSpeedPxPerSecond: 80,
    mobileSpeedPxPerSecond: 60,
    hoverPlaybackRate: 0.55,
  });
  const { onPointerDown, shouldIgnoreClick } = useDragClickGuard();
  const { openProject } = useShowcase();

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
            className="flex shrink-0 gap-2 pr-2"
          >
            {projects.map((project) => (
              <ProjectSlide
                key={`${project.id}-0`}
                project={project}
                isDuplicate={false}
                onPointerDown={handlePointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                shouldIgnoreClick={shouldIgnoreClick}
                onOpen={openProject}
              />
            ))}
          </div>
          {carouselGroups.slice(1).map((groupIndex) => (
            <div
              key={groupIndex}
              aria-hidden={groupIndex > 0 || undefined}
              className="flex shrink-0 gap-2 pr-2"
            >
              {projects.map((project) => (
                <ProjectSlide
                  key={`${project.id}-${groupIndex}`}
                  project={project}
                  isDuplicate
                  onPointerDown={handlePointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  shouldIgnoreClick={shouldIgnoreClick}
                  onOpen={openProject}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectSlide({
  project,
  isDuplicate,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  shouldIgnoreClick,
  onOpen,
}: {
  project: Project;
  isDuplicate: boolean;
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => void;
  shouldIgnoreClick: (event: { clientX: number; clientY: number }) => boolean;
  onOpen: (project: Project) => void;
}) {
  return (
    <div
      aria-hidden={isDuplicate || undefined}
      className="min-w-0 flex-[0_0_11rem] lg:flex-[0_0_13rem]"
    >
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
          onOpen(project);
        }}
        aria-label={`${project.title} — open details`}
        className="group relative block h-full w-full overflow-hidden rounded-xl border border-white/10 bg-surface text-left transition-all duration-200 hover:border-accent/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {project.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- local asset inside a client carousel
          <img
            src={project.image}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <PlaceholderTile title={project.title} />
        )}
        <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-2.5 py-1.5">
          <span className="truncate text-xs font-medium text-zinc-100">
            {project.title}
          </span>
          <span
            aria-hidden="true"
            className="text-accent-strong opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          >
            ↗
          </span>
        </span>
      </button>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import SkillIcon from "@/components/SkillIcon";
import { about } from "@/lib/data/about";
import { skills } from "@/lib/data/skills";
import { playProfileIntro, prewarmIntro } from "@/lib/speak";

/**
 * Profile animation with skill icons orbiting around it (layout.md).
 *
 * Photo: animated WebP (public/profile-animated.webp) built frame-by-frame
 * from the source video with the background removed (scripts/build-profile-
 * animation.mjs). Browsers play and loop it natively inside <img>, so no CSS
 * sprite or per-frame JavaScript is involved. The cut-out figure floats
 * directly on the page background — no card/box behind it — with a soft
 * violet glow that hugs the figure's silhouette (drop-shadow respects alpha).
 *
 * ?v=4 on the asset URLs busts the browser cache whenever the assets are
 * rebuilt (bump the number after re-running the build script).
 *
 * Under prefers-reduced-motion a single static frame is shown instead; if
 * the asset fails to load, an initials fallback renders. The orbit and profile
 * are interactive: pressing the profile or any orbital icon plays a spoken intro
 * (Web Speech API) on both mobile and desktop.
 */
export default function ProfileOrbit({ className = "" }: { className?: string }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const reducedMotion = useReducedMotion();

  // Buffer the recorded intro and the fallback voice list before the first tap
  // so the clip starts instantly on mobile.
  useEffect(() => {
    prewarmIntro();
  }, []);

  const orbitTransition = { duration: 48, ease: "linear" as const, repeat: Infinity };

  return (
    <div
      className={`relative isolate mx-auto aspect-square w-full max-w-[14.5rem] sm:aspect-auto sm:h-72 sm:w-72 sm:max-w-none lg:mx-0 lg:ml-16 xl:ml-24 2xl:ml-28 lg:h-[min(35rem,48dvh)] lg:w-[min(35rem,48dvh)] xl:h-[min(39rem,53dvh)] xl:w-[min(39rem,53dvh)] ${className}`}
    >
      {/* Orbiting skill icons — ring sized to fully clear the figure + glow */}
      <motion.div
        className="absolute inset-0 z-10 [--orbit-r:5.5rem] max-[375px]:[--orbit-r:4rem] sm:[--orbit-r:8rem] lg:[--orbit-r:min(13rem,18dvh)] xl:[--orbit-r:min(14.5rem,20.5dvh)]"
        animate={reducedMotion ? undefined : { rotate: 360 }}
        transition={orbitTransition}
      >
        {skills.map((skill, index) => {
          const angle = (360 / skills.length) * index;
          return (
            <div
              key={skill.id}
              className="absolute left-1/2 top-1/2"
              style={{
                transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(calc(-1 * var(--orbit-r))) rotate(${-angle}deg)`,
              }}
            >
              {/* Counter-rotation keeps each icon upright while the ring spins */}
              <motion.div
                animate={reducedMotion ? undefined : { rotate: -360 }}
                transition={orbitTransition}
              >
                {/* Press/tap/click → plays intro speech; hover/tap also animate. */}
                <motion.button
                  type="button"
                  onClick={playProfileIntro}
                  className="flex cursor-pointer flex-col items-center gap-0.5 border-0 bg-transparent p-0"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 1.35 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  aria-label={`Play introduction (${skill.name})`}
                >
                  <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white p-1 shadow-[0_0_12px_rgba(139,92,246,0.2)] max-[375px]:h-8 max-[375px]:w-8 sm:h-9 sm:w-9 lg:h-14 lg:w-14 xl:h-16 xl:w-16 lg:rounded-xl lg:p-1.5 xl:p-2 lg:shadow-[0_0_18px_rgba(139,92,246,0.3)]">
                    <SkillIcon
                      iconSrc={skill.iconSrc}
                      className="h-full w-full object-contain"
                    />
                  </span>
                  <span className="max-w-[3.5rem] truncate rounded bg-black/50 px-1 py-px text-center text-[8px] font-medium leading-none text-zinc-300 backdrop-blur-sm lg:max-w-[5rem] xl:max-w-[5.75rem] lg:rounded-md lg:px-1.5 lg:py-0.5 lg:text-[11px] xl:text-xs">
                    {skill.name}
                  </span>
                </motion.button>
              </motion.div>
            </div>
          );
        })}
      </motion.div>

      {/* Animated profile — cut-out figure, behind orbit icons (z-0) */}
      <div className="absolute left-1/2 top-1/2 z-0 w-[80%] max-w-[14.5rem] -translate-x-1/2 -translate-y-1/2 sm:w-[70%] sm:max-w-none lg:w-[92%] xl:w-[94%]">
        <button
          type="button"
          onClick={playProfileIntro}
          className="block w-full cursor-pointer border-0 bg-transparent p-0 text-left"
          aria-label={`Play introduction for ${about.name}`}
        >
          {photoFailed ? (
            <div className="flex aspect-[16/9] w-full items-center justify-center">
              <span className="flex h-24 w-24 items-center justify-center rounded-full border border-white/15 bg-surface-2 text-2xl font-semibold tracking-widest text-zinc-300 shadow-[0_0_48px_rgba(139,92,246,0.18)] lg:h-32 lg:w-32 lg:text-4xl xl:h-36 xl:w-36">
                {about.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </span>
            </div>
          ) : reducedMotion ? (
            // eslint-disable-next-line @next/next/no-img-element -- local animated/static webp assets; next/image adds no value for a single decorative figure
            <img
              src="/profile-static.webp?v=4"
              alt={`Photo of ${about.name}`}
              className="aspect-[16/9] w-full drop-shadow-[0_0_26px_rgba(139,92,246,0.3)] lg:drop-shadow-[0_0_32px_rgba(139,92,246,0.35)]"
              onError={() => setPhotoFailed(true)}
            />
          ) : (
            // Animated WebP: browsers play + loop it natively inside <img>.
            // eslint-disable-next-line @next/next/no-img-element -- local animated webp; next/image cannot animate it
            <img
              src="/profile-animated.webp?v=4"
              alt={`Photo of ${about.name}`}
              className="aspect-[16/9] w-full drop-shadow-[0_0_26px_rgba(139,92,246,0.3)] lg:drop-shadow-[0_0_32px_rgba(139,92,246,0.35)]"
              onError={() => setPhotoFailed(true)}
            />
          )}
        </button>
      </div>
    </div>
  );
}

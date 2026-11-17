"use client";

/** Renders the optimized local logo asset associated with a skill. */
export default function SkillIcon({
  iconSrc,
  alt = "",
  className,
}: {
  iconSrc: string;
  alt?: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- small local WebP logos are pre-sized and displayed inside fixed icon slots
    <img
      src={iconSrc}
      alt={alt}
      className={className}
      decoding="async"
    />
  );
}

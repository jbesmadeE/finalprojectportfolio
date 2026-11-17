"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence } from "motion/react";
import BottomSheet from "@/components/BottomSheet";
import SkillIcon from "@/components/SkillIcon";
import type { Project } from "@/lib/data/projects";
import type { Skill } from "@/lib/data/skills";

type SheetState =
  | { kind: "project"; project: Project }
  | { kind: "skill"; skill: Skill }
  | null;

type ShowcaseContextValue = {
  openProject: (project: Project) => void;
  openSkill: (skill: Skill) => void;
};

const ShowcaseContext = createContext<ShowcaseContextValue | null>(null);

/**
 * Shared state for the Stage 2 showcase: the projects/skills carousels and
 * the orbit can open bottom sheets; the sheets themselves render here so
 * there is exactly one <BottomSheet> instance in the tree.
 */
export function useShowcase(): ShowcaseContextValue {
  const value = useContext(ShowcaseContext);
  if (!value) {
    throw new Error("useShowcase must be used inside <ShowcaseProvider>");
  }
  return value;
}

export default function ShowcaseProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [sheet, setSheet] = useState<SheetState>(null);
  const close = useCallback(() => setSheet(null), []);
  const openProject = useCallback(
    (project: Project) => setSheet({ kind: "project", project }),
    [],
  );
  const openSkill = useCallback(
    (skill: Skill) => setSheet({ kind: "skill", skill }),
    [],
  );

  const value = useMemo(
    () => ({ openProject, openSkill }),
    [openProject, openSkill],
  );

  return (
    <ShowcaseContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {sheet?.kind === "project" && (
          <BottomSheet
            key={`project-${sheet.project.id}`}
            open
            onClose={close}
            label={sheet.project.title}
          >
            <ProjectSheetBody project={sheet.project} />
          </BottomSheet>
        )}
        {sheet?.kind === "skill" && (
          <BottomSheet
            key={`skill-${sheet.skill.id}`}
            open
            onClose={close}
            label={sheet.skill.name}
          >
            <SkillSheetBody skill={sheet.skill} />
          </BottomSheet>
        )}
      </AnimatePresence>
    </ShowcaseContext.Provider>
  );
}

/** Project sheet: enlarged image on top, caption + tags below. */
function ProjectSheetBody({ project }: { project: Project }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10 bg-surface">
        {project.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote-free local asset inside a client sheet; swap to next/image when real images land
          <img
            src={project.image}
            alt={project.title}
            className="h-full w-full object-contain"
          />
        ) : (
          <PlaceholderTile title={project.title} />
        )}
      </div>
      <p className="text-sm leading-relaxed text-zinc-300">
        {project.description}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-white/10 bg-surface px-2.5 py-0.5 text-xs text-zinc-400"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Skill sheet: icon, name, description. */
function SkillSheetBody({ skill }: { skill: Skill }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white p-2">
          <SkillIcon
            iconSrc={skill.iconSrc}
            className="h-full w-full object-contain"
          />
        </span>
        <h3 className="text-base font-semibold text-zinc-100">{skill.name}</h3>
      </div>
      <p className="text-sm leading-relaxed text-zinc-300">
        {skill.description}
      </p>
    </div>
  );
}

/** Styled gradient tile used while a real project image is pending. */
export function PlaceholderTile({ title }: { title: string }) {
  return (
    <div
      aria-hidden="true"
      className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.25),transparent_60%),radial-gradient(circle_at_75%_80%,rgba(139,92,246,0.12),transparent_55%)] p-3 text-center"
    >
      <span className="line-clamp-2 text-xs font-medium uppercase tracking-widest text-zinc-500">
        {title}
      </span>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import {
  ShoppingBag,
  Search,
  Image as ImageIcon,
  Video,
  Briefcase,
} from "lucide-react";
import { tools, type ToolIconKey } from "@/lib/data/tools";
import { DesktopBubble, MobileBubble } from "@/components/ToolCalloutBubble";
import ProductHunterModal from "@/components/agents/ProductHunterModal";
import SeoModal from "@/components/agents/SeoModal";
import ImageModal from "@/components/agents/ImageModal";
import VideoModal from "@/components/agents/VideoModal";
import JobsModal from "@/components/agents/JobsModal";

const iconMap: Record<ToolIconKey, ComponentType<{ className?: string }>> = {
  bag: ShoppingBag,
  search: Search,
  image: ImageIcon,
  video: Video,
  briefcase: Briefcase,
};

/**
 * Tool buttons T1–T6 in the fixed order from layout.md.
 * Each opens its agent modal (Stage 4): walmart, amazon, seo, image,
 * video, jobs.
 */
export default function ToolButtons({ className = "" }: { className?: string }) {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  return (
    <>
      <nav
        aria-label="Tools"
        className={[
          "relative flex w-full flex-col gap-1 self-center lg:w-64 lg:translate-y-10 lg:gap-2 lg:mr-6 xl:mr-10",
          className,
        ].join(" ")}
      >
        {/* Mobile weather control + callout bubble stack — lifted on tall screens */}
        <div className="z-20 w-[17rem] max-w-[calc(100vw-1.5rem)] self-end sm:max-w-[calc(100vw-2rem)] lg:hidden [@media(min-height:800px)]:absolute [@media(min-height:800px)]:bottom-full [@media(min-height:800px)]:right-0 [@media(min-height:800px)]:mb-4">
          <div id="weather-slot-mobile" className="mb-1.5 flex justify-end" />
          <MobileBubble className="w-full" />
        </div>

        {/* Desktop weather control + callout bubble stack above tool buttons */}
        <div className="hidden lg:block">
          <div id="weather-slot-desktop" className="mb-2 flex" />
          <DesktopBubble />
        </div>

        {tools.map((tool) => {
          const Icon = iconMap[tool.iconKey];
          return (
            <button
              key={tool.id}
              type="button"
              title={tool.description}
              onClick={() => setActiveTool(tool.id)}
              className="group flex h-auto min-h-8 w-full items-center justify-start gap-1 rounded-lg border border-white/10 bg-surface px-1.5 py-1 text-left transition-all duration-200 hover:border-accent/50 hover:bg-surface-2 hover:shadow-[0_0_20px_rgba(139,92,246,0.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:min-h-9 sm:gap-2.5 sm:px-3 sm:py-1.5 lg:min-h-10 lg:gap-3 lg:rounded-xl lg:px-4 lg:py-2.5"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-accent-strong sm:h-4 sm:w-4" />
              <span className="min-w-0 flex-1 text-[10px] leading-tight font-medium text-zinc-200 sm:text-xs lg:text-sm">
                {tool.label}
              </span>
            </button>
          );
        })}
      </nav>

      <ProductHunterModal
        marketplace="walmart"
        title="Walmart Product Hunter"
        open={activeTool === "walmart"}
        onClose={() => setActiveTool(null)}
      />
      <ProductHunterModal
        marketplace="amazon"
        title="Amazon Product Hunter"
        open={activeTool === "amazon"}
        onClose={() => setActiveTool(null)}
      />
      <SeoModal open={activeTool === "seo"} onClose={() => setActiveTool(null)} />
      <ImageModal open={activeTool === "image"} onClose={() => setActiveTool(null)} />
      <VideoModal open={activeTool === "video"} onClose={() => setActiveTool(null)} />
      <JobsModal open={activeTool === "jobs"} onClose={() => setActiveTool(null)} />
    </>
  );
}

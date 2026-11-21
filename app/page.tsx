import AboutSection from "@/components/AboutSection";
import AppointmentButton from "@/components/AppointmentButton";
import ChatbotButton from "@/components/ChatbotButton";
import ProfileOrbit from "@/components/ProfileOrbit";
import ProjectsCarousel from "@/components/ProjectsCarousel";
import ShowcaseProvider from "@/components/ShowcaseProvider";
import SkillsCarousel from "@/components/SkillsCarousel";
import SocialLinks from "@/components/SocialLinks";
import ToolButtons from "@/components/ToolButtons";
import WeatherLayer from "@/components/WeatherLayer";

/**
 * Single-screen shell (h-dvh, no page scroll) per layout.md.
 * One DOM, two layouts via grid areas:
 * - Mobile:  compact About; callout bubble in tools column points at Walmart; photo left and tools right; actions below; carousels bottom
 * - Desktop: compact About top; enlarged photo left, tools right (with bubble above tools), actions below;
 *            carousels bottom; chatbot floats.
 * ShowcaseProvider supplies the shared bottom-sheet state for the carousels.
 */
export default function Home() {
  return (
    <ShowcaseProvider>
      <main className="relative flex h-dvh flex-col overflow-hidden bg-transparent text-zinc-100">
        {/* Dynamic client-side weather background & control pill slotted into the tools column */}
        <WeatherLayer />

        {/* About — top band on both layouts */}
        <header className="shrink-0 border-b border-white/10 px-3 py-2 sm:px-4 sm:py-2 lg:px-6 lg:py-3">
          <AboutSection />
        </header>

        {/* Middle — photo / tools / actions, reflowed by grid areas */}
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_8.5rem] grid-rows-[minmax(0,1fr)_auto] gap-x-2 gap-y-2 overflow-hidden px-3 py-2 [grid-template-areas:'photo_tools''actions_actions'] sm:grid-cols-[minmax(0,1.1fr)_minmax(12rem,0.9fr)] sm:gap-3 sm:px-4 sm:py-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-4 lg:px-10 xl:px-16">
          <div className="flex min-h-0 min-w-0 items-center justify-center [grid-area:photo] lg:justify-start">
            <ProfileOrbit />
          </div>

          <ToolButtons className="[grid-area:tools]" />

          <div className="flex w-[calc(100%-9rem)] flex-col items-center justify-center gap-2 [grid-area:actions] sm:w-[calc(55%_-_0.4125rem)] lg:w-[min(35rem,48dvh)] xl:w-[min(39rem,53dvh)] lg:ml-16 xl:ml-24 2xl:ml-28 lg:gap-3.5">
            <AppointmentButton className="w-full max-w-60 sm:w-64 lg:w-72 lg:max-w-xs xl:w-80" />
            <SocialLinks className="w-full max-w-sm sm:flex-nowrap lg:max-w-md xl:max-w-lg" />
          </div>
        </div>

        {/* Footer — auto-scrolling carousels; tap opens a 33dvh bottom sheet */}
        <footer className="flex shrink-0 flex-col gap-1.5 border-t border-white/10 px-3 py-2 sm:gap-2 sm:px-4 lg:px-6">
          <ProjectsCarousel />
          <SkillsCarousel />
        </footer>

        <ChatbotButton />
      </main>
    </ShowcaseProvider>
  );
}

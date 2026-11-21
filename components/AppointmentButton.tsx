import { CalendarDays } from "lucide-react";
import { links } from "@/lib/data/links";

/**
 * Primary CTA — opens the Google Calendar booking link.
 * External link: target="_blank" rel="noopener noreferrer" per layout.md.
 */
export default function AppointmentButton({ className = "" }: { className?: string }) {
  return (
    <a
      href={links.appointment.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2.5 text-xs font-semibold text-accent-strong shadow-[0_0_24px_rgba(139,92,246,0.2)] transition-all duration-200 hover:border-accent hover:bg-accent/20 hover:shadow-[0_0_32px_rgba(139,92,246,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:gap-2.5 sm:px-5 sm:py-3 sm:text-sm lg:gap-3 lg:px-6 lg:py-3.5 lg:text-[15px] ${className}`}
    >
      <CalendarDays className="h-4 w-4 sm:h-4.5 sm:w-4.5 lg:h-5 lg:w-5" />
      <span className="min-w-0 text-center">{links.appointment.label}</span>
    </a>
  );
}

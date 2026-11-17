"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import ChatPanel from "@/components/agents/ChatPanel";

/**
 * Floating chatbot button + panel toggle.
 * Panel streams from /api/agents/chat (mock mode without credentials).
 */
export default function ChatbotButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ChatPanel open={open} onClose={() => setOpen(false)} />
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Close chat" : "Chat with JB's assistant"}
        aria-expanded={open}
        className="fixed bottom-28 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-accent/40 bg-surface-2 text-accent-strong shadow-[0_0_24px_rgba(139,92,246,0.3)] backdrop-blur-xl transition-all duration-200 hover:scale-105 hover:border-accent hover:shadow-[0_0_32px_rgba(139,92,246,0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:bottom-32 lg:right-6"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    </>
  );
}

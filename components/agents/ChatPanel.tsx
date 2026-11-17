"use client";

import { useEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";
import { inputClass } from "@/components/AgentModalUI";

type Message = { role: "user" | "assistant"; content: string };

const GREETING: Message = {
  role: "assistant",
  content:
    "Hi! I'm JB's assistant. I can answer questions based on JB's resume and the workspace tools on this site (Walmart/Amazon Product Hunter, SEO Website Analysis, Image Generator, Video Generator, Job Hunter).",
};

/**
 * Streaming chat panel for the chatbot agent. Mock mode streams canned
 * replies; real mode streams from the LLM gateway. Both arrive as a plain
 * text stream consumed incrementally here.
 */
export default function ChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view while streaming.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;

    const history = [...messages, { role: "user" as const, content: text }];
    setMessages(history);
    setInput("");
    setStreaming(true);

    try {
      const response = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: history.slice(-20).map(({ role, content }) => ({ role, content })),
        }),
      });
      if (!response.ok || !response.body) {
        const json = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(json?.error ?? "Chat unavailable.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistant = "";
      setMessages((current) => [...current, { role: "assistant", content: "" }]);

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        assistant += decoder.decode(value, { stream: true });
        setMessages((current) => {
          const next = [...current];
          next[next.length - 1] = { role: "assistant", content: assistant };
          return next;
        });
      }
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error instanceof Error ? `⚠ ${error.message}` : "⚠ Chat failed. Try again.",
        },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-label="Chat with JB's assistant"
      className={`fixed bottom-24 right-4 z-40 flex h-[min(70dvh,560px)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl shadow-black/50 backdrop-blur-xl transition-all duration-200 lg:bottom-28 lg:right-6 ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Chat with JB&apos;s assistant
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition-colors hover:border-white/25 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
              message.role === "user"
                ? "ml-auto border border-accent/40 bg-accent/15 text-zinc-100"
                : "border border-white/10 bg-surface-2/80 text-zinc-300"
            }`}
          >
            {message.content || "…"}
          </div>
        ))}
      </div>

      <form
        className="flex items-center gap-2 border-t border-white/10 p-2.5"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <input
          className={inputClass}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about JB's resume or site tools…"
          maxLength={2000}
          aria-label="Message"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          aria-label="Send message"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-accent/40 bg-accent/10 text-accent-strong transition-colors hover:border-accent hover:bg-accent/20 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

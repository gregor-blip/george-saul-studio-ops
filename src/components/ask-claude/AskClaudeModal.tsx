import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAskClaude } from "./AskClaudeProvider";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

interface HistoryEntry {
  role: "user" | "assistant";
  content: string;
}

const STARTER_CHIPS = [
  "Who has the most time next week?",
  "Which clients are most profitable?",
  "How does our capacity look in May?",
  "Is any project over scope?",
  "Which Lego always goes over estimate?",
  "Are any invoices overdue?",
];

const MAX_HISTORY = 3;

export function AskClaudeModal() {
  const { isOpen, close } = useAskClaude();
  const inputRef = useRef<HTMLInputElement>(null);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [streamDone, setStreamDone] = useState(false);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setInput("");
      setIsLoading(false);
      setQuestion("");
      setAnswer("");
      setSuggestions([]);
      setStreamDone(false);
    }
  }, [isOpen]);

  // Auto-focus
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, close]);

  const submit = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed || isLoading) return;

      setInput("");
      setQuestion(trimmed);
      setAnswer("");
      setSuggestions([]);
      setStreamDone(false);
      setIsLoading(true);

      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/ask-claude`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            question: trimmed,
            history: history.slice(-(MAX_HISTORY * 2)),
          }),
        });

        if (!response.ok || !response.body) {
          let errorMsg = "Sorry, something went wrong. Please try again.";
          try {
            const errJson = await response.json() as { error?: string };
            if (response.status === 502 || response.status === 429) {
              errorMsg = "Claude is currently rate-limited. Please wait a moment and try again.";
            } else if (errJson.error) {
              errorMsg = errJson.error;
            }
          } catch {
            // use default message
          }
          setAnswer(errorMsg);
          setIsLoading(false);
          setStreamDone(true);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        let buffer = "";

        const processLines = (text: string) => {
          buffer += text;
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data) as { text?: string };
              if (parsed.text) {
                accumulated += parsed.text;
                setAnswer(accumulated);
                setIsLoading(false);
              }
            } catch {
              // skip malformed JSON chunks
            }
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          processLines(decoder.decode(value, { stream: true }));
        }
        // flush remaining buffer
        processLines("\n");

        // Parse suggestions from end of accumulated text
        const sugSplit = accumulated.split('{"suggestions":');
        const displayText = sugSplit[0].trim();
        let parsedSuggestions: string[] = [];

        if (sugSplit.length > 1) {
          try {
            const sugJson = JSON.parse(`{"suggestions":${sugSplit[sugSplit.length - 1]}`) as {
              suggestions: string[];
            };
            parsedSuggestions = sugJson.suggestions;
          } catch {
            // ignore parse errors
          }
        }

        setAnswer(displayText);
        setSuggestions(parsedSuggestions);
        setStreamDone(true);

        // Update history
        setHistory((prev) => {
          const next = [
            ...prev,
            { role: "user" as const, content: trimmed },
            { role: "assistant" as const, content: displayText },
          ];
          return next.slice(-(MAX_HISTORY * 2));
        });
      } catch {
        setAnswer("Sorry, something went wrong. Please try again.");
        setIsLoading(false);
        setStreamDone(true);
      }
    },
    [history, isLoading],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(input);
    }
  };

  const resetConversation = () => {
    setHistory([]);
    setQuestion("");
    setAnswer("");
    setSuggestions([]);
    setStreamDone(false);
    setInput("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const showInput = !question;
  const showHistory = history.length > 0 && question;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-start justify-center pt-[15vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <motion.div
            className="bg-[#141414] border border-white/[0.10] rounded-2xl w-full max-w-2xl mx-4 overflow-hidden shadow-2xl shadow-black/60"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {/* Input row */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-white/[0.06]">
              <Sparkles size={18} className="text-[#0070F3] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                className="bg-transparent border-0 outline-none text-white text-base placeholder:text-zinc-600 flex-1"
                placeholder="Ask anything — who's free next week, which clients are profitable, how does May look..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <AnimatePresence>
                {input.trim() && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    onClick={() => submit(input)}
                    className="bg-[#0070F3] rounded-lg p-1.5 text-white shrink-0"
                  >
                    <ArrowRight size={16} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Loading state */}
            {isLoading && !answer && (
              <div className="px-6 py-5 flex items-center gap-3">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="bg-[#0070F3] rounded-full w-1.5 h-1.5"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.6,
                      delay: i * 0.15,
                      ease: "easeInOut",
                    }}
                  />
                ))}
                <span className="text-sm text-zinc-600">Thinking...</span>
              </div>
            )}

            {/* Answer state */}
            {question && answer && (
              <>
                {/* History strip */}
                {showHistory && history.length > 2 && (
                  <div className="px-6 pt-4 flex flex-col gap-1">
                    {history
                      .filter((h) => h.role === "user")
                      .slice(0, -1)
                      .map((h, i) => (
                        <span key={i} className="text-xs text-zinc-700 truncate max-w-[60ch]">
                          {h.content.length > 60 ? `${h.content.slice(0, 60)}...` : h.content}
                        </span>
                      ))}
                  </div>
                )}

                {history.length >= MAX_HISTORY * 2 && (
                  <button
                    type="button"
                    onClick={resetConversation}
                    className="text-xs text-zinc-600 px-6 pb-2 pt-2 hover:text-zinc-400 transition-colors text-left"
                  >
                    Start a new conversation →
                  </button>
                )}

                {/* Question echo */}
                <div className="px-6 pt-5 pb-3 border-b border-white/[0.06] text-sm text-zinc-500">
                  {question}
                </div>

                {/* Answer */}
                <div className="px-6 py-5 text-sm text-zinc-200 leading-relaxed min-h-[80px] prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown>{answer}</ReactMarkdown>
                </div>

                {/* Follow-up suggestion chips */}
                {streamDone && suggestions.length > 0 && (
                  <div className="px-6 pb-5 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4 mt-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => submit(s)}
                        className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-400 text-xs px-3 py-1.5 rounded-full cursor-pointer transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Starter chips (shown when no question asked) */}
            {showInput && !isLoading && (
              <div className="px-6 py-4 flex flex-wrap gap-2">
                <span className="text-[11px] uppercase tracking-wider text-zinc-700 mb-2 w-full">
                  Try asking
                </span>
                {STARTER_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => submit(chip)}
                    className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-400 text-xs px-3 py-1.5 rounded-full cursor-pointer transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Action row */}
            <div className="px-6 py-3 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-[11px] text-zinc-700">Powered by Claude</span>
              <span className="text-[11px] text-zinc-700">Press Esc to close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

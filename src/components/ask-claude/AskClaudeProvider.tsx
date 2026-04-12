import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AskClaudeModal } from "./AskClaudeModal";

interface AskClaudeContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const AskClaudeContext = createContext<AskClaudeContextValue | null>(null);

export function useAskClaude(): AskClaudeContextValue {
  const ctx = useContext(AskClaudeContext);
  if (!ctx) throw new Error("useAskClaude must be used within AskClaudeProvider");
  return ctx;
}

export function AskClaudeProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <AskClaudeContext.Provider value={{ isOpen, open, close }}>
      {children}
      <AskClaudeModal />
    </AskClaudeContext.Provider>
  );
}

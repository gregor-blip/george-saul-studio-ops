import { Sparkles } from "lucide-react";
import { useAskClaude } from "./AskClaudeProvider";

export function AskClaudeBar() {
  const { open } = useAskClaude();

  return (
    <button
      type="button"
      onClick={open}
      className="flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-[#141414] px-5 py-3 mb-8 cursor-pointer hover:border-white/[0.16] transition-colors duration-200"
    >
      <Sparkles size={15} className="text-zinc-600 shrink-0" />
      <span className="text-sm italic text-zinc-600">
        Ask Claude anything about your team, clients...
      </span>
      <kbd className="ml-auto text-[11px] text-zinc-700 bg-white/[0.04] border border-white/[0.08] rounded-md px-1.5 py-0.5 font-mono">
        ⌘K
      </kbd>
    </button>
  );
}

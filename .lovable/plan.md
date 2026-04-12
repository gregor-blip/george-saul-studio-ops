

## Ask Claude Spotlight — Updated Implementation Plan

### Dependency Check Result
- **framer-motion**: not installed — needs to be added
- **react-markdown**: not installed — needs to be added

### Plan (unchanged from prior approval, with confirmed installs)

1. **Install dependencies**: `framer-motion` and `react-markdown`

2. **Create `src/components/ask-claude/AskClaudeBar.tsx`** — persistent prompt bar at top of content area with Sparkles icon, placeholder text, Cmd+K badge

3. **Create `src/components/ask-claude/AskClaudeModal.tsx`** — full-screen overlay with three states (input, loading, answer), SSE streaming from `ask-claude` Edge Function, suggestion chips, conversation history (max 3 exchanges, component state only)

4. **Create `src/components/ask-claude/AskClaudeProvider.tsx`** — context provider managing modal open/close state + global Cmd+K / Ctrl+K keyboard shortcut

5. **Modify `src/components/DashboardLayout.tsx`** — wrap content with `AskClaudeProvider`, render `AskClaudeBar` as first child in `<main>` before `<Outlet />`

No other files modified. No database, sidebar, page, or routing changes.


import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { AskClaudeProvider } from "@/components/ask-claude/AskClaudeProvider";
import { AskClaudeBar } from "@/components/ask-claude/AskClaudeBar";

export function DashboardLayout() {
  return (
    <AskClaudeProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto px-8 py-8">
          <AskClaudeBar />
          <Outlet />
        </main>
      </div>
    </AskClaudeProvider>
  );
}

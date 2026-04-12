import { NavLink, useLocation } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  UserCheck,
  FolderKanban,
  TrendingUp,
  Upload,
  Layers,
  BarChart3,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

const mainNav: NavItem[] = [
  { label: "Overview", to: "/dashboard", icon: LayoutDashboard },
  { label: "Clients", to: "/clients", icon: Users },
  { label: "Team", to: "/team", icon: UserCheck },
  { label: "Projects", to: "/projects", icon: FolderKanban },
  { label: "Pipeline", to: "/pipeline", icon: TrendingUp },
];

const dataNav: NavItem[] = [
  { label: "Import & Sync", to: "/data", icon: Upload },
  { label: "Lego Catalogue", to: "/settings/legos", icon: Layers },
];

const compareNav: NavItem[] = [
  { label: "Benchmarks", to: "/benchmarks", icon: BarChart3 },
];

function SidebarSection({
  label,
  items,
}: {
  label?: string;
  items: NavItem[];
}) {
  const { pathname } = useLocation();

  return (
    <div>
      {label && (
        <div className="px-3 pb-1 pt-4 text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
      )}
      <nav className="flex flex-col gap-0.5">
        {items.map(({ label: text, to, icon: Icon }) => {
          const active = pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={`relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-150 ${
                active
                  ? "bg-[hsl(0_0%_100%/0.06)] font-medium text-foreground"
                  : "text-muted-foreground hover:bg-[hsl(0_0%_100%/0.04)] hover:text-foreground/80"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
              )}
              <Icon size={16} />
              <span>{text}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

export function AppSidebar() {
  const { user, signOut } = useAuth();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-background px-3 py-4">
      <div className="px-3 py-2 mb-4 text-[15px] font-semibold text-foreground">
        G&amp;S
      </div>

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
        <SidebarSection items={mainNav} />
        <SidebarSection label="DATA" items={dataNav} />
        <SidebarSection label="COMPARE" items={compareNav} />
      </div>

      <div className="mt-auto border-t border-[hsl(0_0%_100%/0.06)] pt-3">
        <p className="truncate px-3 pb-1 text-xs text-muted-foreground">
          {user?.email}
        </p>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          <LogOut size={14} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

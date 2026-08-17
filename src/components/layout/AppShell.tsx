import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Boxes,
  Gauge,
  History,
  LayoutDashboard,
  Menu,
  Network,
  TrendingUp,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/state/app-store";
import { Segmented } from "@/components/ui-kit/Field";
import type { Role } from "@/mock/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/capacity", label: "Capacity Engine", icon: Gauge },
  { to: "/marketplace", label: "3PL Exchange", icon: Boxes },
  { to: "/replay", label: "Digital Twin", icon: History },
  { to: "/ulip", label: "ULIP Exchange", icon: Network },
  { to: "/risk", label: "Predictive Risk", icon: TrendingUp },
] as const;

function Clock() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="num micro-label text-foreground">{now ?? "--:--:--"}</span>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, activeRole, setActiveRole, signOut, vehicles } = useAppStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: "/" });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  if (!isAuthenticated || !user) return null;

  const initials = user.fullName
    .split(" ")
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const navList = (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex items-center gap-2 rounded-[8px] px-3 py-3 text-[14px] transition-colors duration-200",
              active ? "text-accent" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
            )}
          >
            <item.icon className="size-6 shrink-0" strokeWidth={1.75} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed top-0 left-0 hidden h-screen w-[248px] flex-col justify-between border-r border-border bg-secondary px-4 py-6 lg:flex">
        <div>
          <Link to="/dashboard" className="block px-3">
            <span className="micro-label text-accent">SIH260455</span>
            <p className="mt-2 text-[17px] leading-tight tracking-[-0.02em]">
              DoP Fleet
              <br />
              Intelligence
            </p>
          </Link>
          <div className="mt-8">{navList}</div>
        </div>
        <p className="px-3 text-[12px] text-muted-foreground">
          Department of Posts · Capacity Exchange demo build
        </p>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-[100] flex flex-wrap items-center gap-4 border-b border-border bg-background/85 px-6 py-4 backdrop-blur md:px-12">
          <button
            type="button"
            aria-label="Open navigation"
            className="rounded-[8px] p-2 text-foreground hover:bg-surface-hover lg:hidden"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="size-6" strokeWidth={1.75} />
          </button>
          <Clock />
          <span className="micro-label">
            <span className="num">{vehicles.filter((v) => v.active).length}</span> vehicles active
          </span>
          <span className="inline-flex items-center gap-2 rounded-pill border border-border px-3 py-1 text-[12px] text-muted-foreground">
            <span className="size-2 rounded-pill bg-success" />
            Live
          </span>
          <div className="ml-auto flex items-center gap-4">
            <div className="hidden w-[280px] md:block">
              <Segmented<Role>
                value={activeRole}
                onChange={setActiveRole}
                options={[
                  { value: "dispatcher", label: "Dispatcher view" },
                  { value: "partner", label: "3PL Partner view" },
                ]}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger className="num rounded-pill border border-accent px-3 py-2 text-[13px] text-accent">
                {initials}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-[12px]">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-[14px] text-foreground">{user.fullName}</p>
                  <p className="text-[12px] text-muted-foreground">{user.organization}</p>
                  <p className="micro-label mt-2">
                    {user.role === "dispatcher" ? "Dispatcher" : "3PL Partner"}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    signOut();
                    navigate({ to: "/" });
                  }}
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="w-full md:hidden">
            <Segmented<Role>
              value={activeRole}
              onChange={setActiveRole}
              options={[
                { value: "dispatcher", label: "Dispatcher" },
                { value: "partner", label: "3PL Partner" },
              ]}
            />
          </div>
        </header>

        {drawerOpen ? (
          <div className="fixed inset-0 z-[300] lg:hidden">
            <button
              aria-label="Close navigation"
              className="absolute inset-0 bg-ink/40"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="absolute top-0 left-0 h-full w-[280px] bg-secondary px-4 py-6">
              <div className="flex items-center justify-between px-3">
                <span className="micro-label text-accent">Navigate</span>
                <button
                  aria-label="Close navigation"
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-[8px] p-2 hover:bg-surface-hover"
                >
                  <X className="size-5" strokeWidth={1.75} />
                </button>
              </div>
              <div className="mt-6">{navList}</div>
            </div>
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-[1400px] px-6 py-16 md:px-12 lg:px-16">{children}</main>
      </div>
    </div>
  );
}

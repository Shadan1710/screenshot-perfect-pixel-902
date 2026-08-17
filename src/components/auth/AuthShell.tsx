import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  intro,
  children,
  footer,
}: {
  title: string;
  intro: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col bg-background px-6 py-12 md:px-16">
      <Link to="/" className="micro-label text-foreground">
        DoP · Fleet Intelligence
      </Link>
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="w-full max-w-[440px] rise-in">
          <p className="micro-label text-accent">SIH260455</p>
          <h1 className="mt-4 text-[34px] leading-[1.05] tracking-[-0.03em]">{title}</h1>
          <p className="mt-3 max-w-[420px] text-[15px] text-muted-foreground">{intro}</p>
          <div className="mt-8 rounded-[12px] border border-border bg-secondary p-6 md:p-8">
            {children}
          </div>
          {footer ? <div className="mt-6 text-[14px] text-muted-foreground">{footer}</div> : null}
        </div>
      </div>
    </main>
  );
}

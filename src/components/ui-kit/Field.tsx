import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string | null;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="micro-label">{label}</label>
      {children}
      {error ? <p className="text-[13px] text-danger">{error}</p> : hint}
    </div>
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "num w-full rounded-[8px] border border-input bg-background px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors duration-200 focus:border-accent focus:ring-2 focus:ring-accent/25 disabled:bg-surface disabled:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex rounded-[8px] border border-border bg-secondary p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "min-h-11 flex-1 rounded-[6px] px-4 text-[13px] font-medium transition-colors duration-200",
            value === opt.value
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

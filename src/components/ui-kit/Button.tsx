import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const button = cva(
  "inline-flex items-center justify-center gap-2 rounded-[8px] text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45 min-h-11",
  {
    variants: {
      variant: {
        primary:
          "border border-accent text-accent bg-transparent hover:border-accent-hover hover:text-accent-hover active:text-accent-pressed",
        solid: "bg-accent text-accent-foreground hover:bg-accent-hover active:bg-accent-pressed",
        secondary: "text-accent hover:text-accent-hover px-0 min-h-0",
        ghost: "text-foreground hover:bg-surface-hover",
        danger: "border border-danger text-danger bg-transparent hover:bg-danger/10",
      },
      size: {
        md: "px-6 py-3",
        sm: "px-4 py-2 min-h-9 text-[13px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  loading?: boolean;
  children?: ReactNode;
}

export function Button({ className, variant, size, loading, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(button({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" strokeWidth={1.75} /> : null}
      {children}
    </button>
  );
}

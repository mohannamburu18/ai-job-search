import React from "react";
import { clsx } from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "cyan" | "outline";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({
  children,
  variant = "secondary",
  size = "sm",
  className,
}: BadgeProps) {
  const variantStyles = {
    primary: "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30",
    secondary: "bg-white/5 text-slate-300 border border-white/10",
    success: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
    danger: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
    cyan: "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30",
    outline: "bg-transparent text-slate-400 border border-slate-700",
  };

  const sizeStyles = {
    sm: "text-xs px-2.5 py-0.5 rounded-full font-medium tracking-wide",
    md: "text-sm px-3.5 py-1 rounded-full font-medium",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}


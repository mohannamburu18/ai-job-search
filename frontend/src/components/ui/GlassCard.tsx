"use client";

import React from "react";
import { clsx } from "clsx";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "hover" | "interactive" | "subtle" | "glow";
  glowColor?: "indigo" | "cyan" | "emerald" | "amber";
  className?: string;
}

export function GlassCard({
  children,
  variant = "default",
  glowColor = "indigo",
  className,
  ...props
}: GlassCardProps) {
  const variantStyles = {
    default: "glass-panel",
    hover: "glass-panel glass-panel-hover",
    interactive: "glass-panel glass-panel-hover cursor-pointer active:scale-[0.99]",
    subtle: "bg-surface/50 backdrop-blur-md border border-white/5",
    glow: clsx(
      "glass-panel relative",
      glowColor === "indigo" && "shadow-[0_0_30px_-5px_rgba(99,102,241,0.25)] border-indigo-500/30",
      glowColor === "cyan" && "shadow-[0_0_30px_-5px_rgba(0,245,212,0.25)] border-cyan-500/30",
      glowColor === "emerald" && "shadow-[0_0_30px_-5px_rgba(16,185,129,0.25)] border-emerald-500/30",
      glowColor === "amber" && "shadow-[0_0_30px_-5px_rgba(245,158,11,0.25)] border-amber-500/30"
    ),
  };

  return (
    <div
      className={clsx(
        "rounded-2xl p-6 transition-all duration-300",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}


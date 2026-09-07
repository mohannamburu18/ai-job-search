"use client";

import React from "react";

interface ScoreRingProps {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  showPercent?: boolean;
}

export function ScoreRing({
  score,
  size = 110,
  strokeWidth = 8,
  label,
  sublabel,
  showPercent = true,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score || 0));
  const offset = circumference - (clampedScore / 100) * circumference;

  let color = "#10b981"; // Emerald
  let glowColor = "rgba(16, 185, 129, 0.4)";

  if (clampedScore < 40) {
    color = "#f43f5e"; // Rose
    glowColor = "rgba(244, 63, 94, 0.4)";
  } else if (clampedScore < 60) {
    color = "#f59e0b"; // Amber
    glowColor = "rgba(245, 158, 11, 0.4)";
  } else if (clampedScore < 75) {
    color = "#00f5d4"; // Cyan
    glowColor = "rgba(0, 245, 212, 0.4)";
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)",
              filter: `drop-shadow(0 0 6px ${glowColor})`,
            }}
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold tracking-tight text-white font-mono">
            {Math.round(clampedScore)}
            {showPercent && <span className="text-xs text-slate-400 font-sans">%</span>}
          </span>
          {sublabel && (
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              {sublabel}
            </span>
          )}
        </div>
      </div>
      {label && <span className="mt-2 text-xs font-medium text-slate-300">{label}</span>}
    </div>
  );
}


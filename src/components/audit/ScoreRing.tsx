"use client";

import { scoreColor } from "@/lib/audit/utils";

interface ScoreRingProps {
  score: number;
  label: string;
  sublabel?: string;
  size?: number;
}

export function ScoreRing({
  score,
  label,
  sublabel,
  size = 160,
}: ScoreRingProps) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#27272a"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="score-ring-fill"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-zinc-50">{score}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="font-medium text-zinc-100">{label}</p>
        {sublabel && <p className="text-xs text-zinc-500">{sublabel}</p>}
      </div>
    </div>
  );
}

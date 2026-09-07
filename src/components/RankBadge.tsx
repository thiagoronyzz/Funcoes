"use client";

import React from "react";

interface RankBadgeProps {
  rank: number | null;
  totalVotes?: number;
}

export default function RankBadge({ rank, totalVotes }: RankBadgeProps) {
  if (!rank || (totalVotes !== undefined && totalVotes === 0)) return null;

  const isTop3 = rank <= 3;

  return (
    <span
      className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded"
      style={{
        backgroundColor: isTop3 ? "#f5ede0" : "#f2efe9",
        color: isTop3 ? "#9a7a08" : "#7d6e5e",
        border: `1px solid ${isTop3 ? "#c9a84c" : "#d0c8bb"}`,
        fontVariantNumeric: "tabular-nums",
      }}
      title={`#${rank} global em votos`}
    >
      #{rank}
    </span>
  );
}

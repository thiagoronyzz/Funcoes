"use client";

import React from "react";
import { getInitials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  username?: string;
}

const sizeMap = {
  xs: { container: "w-6 h-6", text: "text-[9px]" },
  sm: { container: "w-8 h-8", text: "text-xs" },
  md: { container: "w-10 h-10", text: "text-sm" },
  lg: { container: "w-14 h-14", text: "text-lg" },
  xl: { container: "w-20 h-20", text: "text-2xl" },
};

function stringToColor(str: string): string {
  const colors = [
    "#8B6F4E",
    "#6B8F5E",
    "#4E6B8B",
    "#8B4E6B",
    "#7D6E5E",
    "#5E7D6E",
    "#6E5E7D",
    "#7D5E5E",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function Avatar({ name, avatarUrl, size = "md" }: AvatarProps) {
  const { container, text } = sizeMap[size];
  const bg = stringToColor(name);

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        className={`${container} rounded-full object-cover border border-stone-200 flex-shrink-0`}
        style={{ borderColor: "#e5e0d7" }}
      />
    );
  }

  return (
    <div
      className={`${container} rounded-full flex items-center justify-center flex-shrink-0 border`}
      style={{ backgroundColor: bg, borderColor: "rgba(255,255,255,0.3)" }}
    >
      <span className={`${text} font-semibold text-white select-none`}>
        {getInitials(name)}
      </span>
    </div>
  );
}

"use client";

import { COLORS, ColorName } from "@/types";
import { useRef, useEffect, useState } from "react";

interface WheelProps {
  isSpinning: boolean;
  onSpinEnd: (winningColor: ColorName) => void;
  winningColor?: ColorName | null;
}

const WHEEL_COLORS: ColorName[] = [
  "green",
  "yellow",
  "red",
  "blue",
  "purple",
  "green",
  "yellow",
  "red",
  "blue",
  "purple",
];

export default function Wheel({ isSpinning, onSpinEnd, winningColor }: WheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const [currentRotation, setCurrentRotation] = useState(0);

  const segmentAngle = 360 / 10;

  const getColorHex = (colorName: ColorName) => {
    return COLORS.find((c) => c.name === colorName)?.hex || "#000000";
  };

  useEffect(() => {
    if (isSpinning && wheelRef.current) {
      const spinDuration = 4000 + Math.random() * 2000;
      const extraRotations = 5 + Math.floor(Math.random() * 5);
      const randomOffset = Math.floor(Math.random() * 360);
      const targetRotation = currentRotation + extraRotations * 360 + randomOffset;

      wheelRef.current.style.transition = `transform ${spinDuration}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
      wheelRef.current.style.transform = `rotate(${targetRotation}deg)`;

      setRotation(targetRotation);

      const timeoutId = setTimeout(() => {
        const normalizedRotation = targetRotation % 360;
        const adjustedRotation = (360 - normalizedRotation + segmentAngle / 2) % 360;
        const winningIndex = Math.floor(adjustedRotation / segmentAngle);
        const color = WHEEL_COLORS[winningIndex] || "green";

        onSpinEnd(color);
        setCurrentRotation(targetRotation);
      }, spinDuration);

      return () => clearTimeout(timeoutId);
    }
  }, [isSpinning, onSpinEnd, currentRotation]);

  const createSegment = (colorName: ColorName, index: number) => {
    const startAngle = index * segmentAngle;
    const endAngle = startAngle + segmentAngle;
    const midAngle = (startAngle + endAngle) / 2;

    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    const x1 = 50 + 50 * Math.cos(startRad);
    const y1 = 50 + 50 * Math.sin(startRad);
    const x2 = 50 + 50 * Math.cos(endRad);
    const y2 = 50 + 50 * Math.sin(endRad);

    const largeArcFlag = segmentAngle > 180 ? 1 : 0;

    const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    const textRad = (midAngle - 90) * (Math.PI / 180);
    const textX = 50 + 35 * Math.cos(textRad);
    const textY = 50 + 35 * Math.sin(textRad);

    return (
      <g key={index}>
        <path
          d={pathData}
          fill={getColorHex(colorName)}
          stroke="#1f2937"
          strokeWidth="0.5"
        />
        <text
          x={textX}
          y={textY}
          fill="#ffffff"
          fontSize="4"
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="middle"
          transform={`rotate(${midAngle}, ${textX}, ${textY})`}
        >
          {COLORS.find((c) => c.name === colorName)?.label}
        </text>
      </g>
    );
  };

  return (
    <div className="relative w-72 h-72 md:w-96 md:h-96">
      <div
        ref={wheelRef}
        className="w-full h-full"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: isSpinning ? undefined : "none",
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
          <circle cx="50" cy="50" r="49" fill="#1f2937" />
          {WHEEL_COLORS.map((color, index) => createSegment(color, index))}
          <circle cx="50" cy="50" r="8" fill="#f9fafb" stroke="#374151" strokeWidth="1" />
          <circle cx="50" cy="50" r="4" fill="#374151" />
        </svg>
      </div>

      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
        <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[24px] border-t-gray-800 drop-shadow-lg" />
      </div>

      {winningColor && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-white animate-ping opacity-30"
            style={{ backgroundColor: getColorHex(winningColor) }}
          />
        </div>
      )}
    </div>
  );
}

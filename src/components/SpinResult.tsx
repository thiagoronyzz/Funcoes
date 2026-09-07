"use client";

import { COLORS, ColorName } from "@/types";

interface SpinResultProps {
  winningColor: ColorName;
  isWin: boolean;
  winAmount: number;
  betAmount: number;
  selectedColors: ColorName[];
}

export default function SpinResult({
  winningColor,
  isWin,
  winAmount,
  betAmount,
  selectedColors,
}: SpinResultProps) {
  const colorData = COLORS.find((c) => c.name === winningColor);

  return (
    <div
      className={`
        p-6 rounded-xl text-center animate-in fade-in zoom-in duration-300
        ${isWin 
          ? "bg-green-50 border-2 border-green-200" 
          : "bg-red-50 border-2 border-red-200"
        }
      `}
    >
      <div className="flex items-center justify-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-full shadow-lg"
          style={{ backgroundColor: colorData?.hex }}
        />
        <div>
          <p className="text-sm text-gray-600 uppercase tracking-wide">Resultado</p>
          <p className="text-xl font-bold text-gray-800">{colorData?.label}</p>
        </div>
      </div>

      {isWin ? (
        <div className="space-y-2">
          <p className="text-3xl font-bold text-green-600">
            +R$ {winAmount.toFixed(2)}
          </p>
          <p className="text-sm text-green-700">
            Parabéns! Você acertou uma das cores selecionadas
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-3xl font-bold text-red-600">
            -R$ {betAmount.toFixed(2)}
          </p>
          <p className="text-sm text-red-700">
            Que pena! Tente novamente
          </p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">Cores selecionadas:</p>
        <div className="flex justify-center gap-2 mt-2">
          {selectedColors.map((color) => {
            const c = COLORS.find((c) => c.name === color);
            return (
              <span
                key={color}
                className="px-3 py-1 rounded-full text-white text-sm font-medium"
                style={{ backgroundColor: c?.hex }}
              >
                {c?.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

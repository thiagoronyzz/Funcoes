"use client";

import { COLORS, ColorName } from "@/types";

interface ColorSelectorProps {
  selectedColors: ColorName[];
  onColorSelect: (color: ColorName) => void;
  disabled?: boolean;
}

export default function ColorSelector({
  selectedColors,
  onColorSelect,
  disabled = false,
}: ColorSelectorProps) {
  const handleColorClick = (color: ColorName) => {
    if (disabled) return;

    if (selectedColors.includes(color)) {
      const newSelection = selectedColors.filter((c) => c !== color);
      if (newSelection.length < 2) {
        onColorSelect(color);
      }
    } else {
      if (selectedColors.length < 2) {
        onColorSelect(color);
      }
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        Selecione 2 Cores
      </h3>
      <div className="flex flex-wrap gap-3">
        {COLORS.map((color) => {
          const isSelected = selectedColors.includes(color.name);
          const canSelect = selectedColors.length < 2 || isSelected;

          return (
            <button
              key={color.name}
              onClick={() => handleColorClick(color.name)}
              disabled={disabled || !canSelect}
              className={`
                relative px-5 py-3 rounded-lg font-semibold text-white
                transition-all duration-200 transform
                ${isSelected 
                  ? "ring-4 ring-offset-2 ring-gray-400 scale-105 shadow-lg" 
                  : "hover:scale-105 hover:shadow-md"
                }
                ${disabled || !canSelect 
                  ? "opacity-40 cursor-not-allowed" 
                  : "cursor-pointer active:scale-95"
                }
              `}
              style={{ backgroundColor: color.hex }}
            >
              {color.label}
              {isSelected && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        {selectedColors.length === 0 && "Selecione suas cores da sorte"}
        {selectedColors.length === 1 && "Selecione mais 1 cor"}
        {selectedColors.length === 2 && "Cores selecionadas! Pronto para apostar"}
      </p>
    </div>
  );
}

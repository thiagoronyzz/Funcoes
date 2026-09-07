"use client";

import { useState, useEffect } from "react";

interface BetInputProps {
  balance: number;
  onBetChange: (amount: number) => void;
  disabled?: boolean;
  value?: number;
}

export default function BetInput({
  balance,
  onBetChange,
  disabled = false,
  value,
}: BetInputProps) {
  const [betAmount, setBetAmount] = useState(value?.toString() || "");

  useEffect(() => {
    if (value !== undefined) {
      setBetAmount(value.toString());
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (value === "") {
      setBetAmount("");
      onBetChange(0);
      return;
    }

    const numValue = parseFloat(value);
    
    if (!isNaN(numValue) && numValue >= 0) {
      setBetAmount(value);
      if (numValue <= balance) {
        onBetChange(numValue);
      }
    }
  };

  const handleQuickBet = (percentage: number) => {
    const amount = Math.floor(balance * percentage);
    setBetAmount(amount.toString());
    onBetChange(amount);
  };

  const isValid = parseFloat(betAmount) > 0 && parseFloat(betAmount) <= balance;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        Valor da Aposta
      </h3>
      
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
          R$
        </span>
        <input
          type="number"
          value={betAmount}
          onChange={handleInputChange}
          disabled={disabled}
          min="1"
          max={balance}
          className={`
            w-full pl-12 pr-4 py-4 text-lg font-semibold rounded-lg border-2
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isValid 
              ? "border-gray-200 bg-white" 
              : betAmount !== "" 
                ? "border-red-300 bg-red-50" 
                : "border-gray-200 bg-white"
            }
          `}
          placeholder="0"
        />
      </div>

      <div className="flex gap-2">
        {[0.1, 0.25, 0.5, 1].map((percentage) => (
          <button
            key={percentage}
            onClick={() => handleQuickBet(percentage)}
            disabled={disabled || balance === 0}
            className="flex-1 py-2 px-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {percentage === 1 ? "Máx" : `${percentage * 100}%`}
          </button>
        ))}
      </div>

      {betAmount !== "" && !isValid && (
        <p className="text-sm text-red-600 font-medium">
          {parseFloat(betAmount) > balance 
            ? "Valor maior que o saldo disponível" 
            : "Valor mínimo: R$ 1"}
        </p>
      )}

      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500">Saldo disponível:</span>
        <span className="font-bold text-green-600">R$ {balance.toFixed(2)}</span>
      </div>
    </div>
  );
}

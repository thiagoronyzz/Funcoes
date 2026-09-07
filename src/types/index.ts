export interface User {
  id: string;
  nickname: string;
  balance: number;
  maxBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  maxBalance: number;
  createdAt: Date;
}

export interface GameState {
  userId?: string;
  balance: number;
  maxBalance: number;
  selectedColors: string[];
  betAmount: number;
  isSpinning: boolean;
  result?: SpinResult;
}

export interface SpinResult {
  winningColor: string;
  isWin: boolean;
  winAmount: number;
}

export const COLORS = [
  { name: "green", hex: "#22c55e", label: "Verde" },
  { name: "yellow", hex: "#eab308", label: "Amarelo" },
  { name: "red", hex: "#ef4444", label: "Vermelho" },
  { name: "blue", hex: "#3b82f6", label: "Azul" },
  { name: "purple", hex: "#a855f7", label: "Roxo" },
] as const;

export type ColorName = (typeof COLORS)[number]["name"];

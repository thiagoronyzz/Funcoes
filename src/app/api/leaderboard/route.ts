import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leaderboard } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const entries = await db
      .select()
      .from(leaderboard)
      .orderBy(desc(leaderboard.maxBalance))
      .limit(10);

    return NextResponse.json(
      entries.map((entry) => ({
        id: entry.id,
        playerName: entry.playerName,
        maxBalance: entry.maxBalance,
        createdAt: entry.createdAt,
      }))
    );
  } catch (error) {
    console.error("Error getting leaderboard:", error);
    return NextResponse.json(
      { error: "Erro ao buscar leaderboard" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { playerName, maxBalance } = await request.json();

    if (!playerName || playerName.trim().length === 0) {
      return NextResponse.json(
        { error: "Nome do jogador é obrigatório" },
        { status: 400 }
      );
    }

    if (typeof maxBalance !== "number" || maxBalance < 0) {
      return NextResponse.json(
        { error: "Saldo máximo inválido" },
        { status: 400 }
      );
    }

    const newEntry = await db
      .insert(leaderboard)
      .values({
        playerName: playerName.trim(),
        maxBalance,
      })
      .returning();

    return NextResponse.json({
      id: newEntry[0].id,
      playerName: newEntry[0].playerName,
      maxBalance: newEntry[0].maxBalance,
      createdAt: newEntry[0].createdAt,
    });
  } catch (error) {
    console.error("Error adding to leaderboard:", error);
    return NextResponse.json(
      { error: "Erro ao adicionar ao leaderboard" },
      { status: 500 }
    );
  }
}

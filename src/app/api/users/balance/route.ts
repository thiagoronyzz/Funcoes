import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(request: NextRequest) {
  try {
    const { userId, balance, maxBalance } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    if (typeof balance !== "number" || typeof maxBalance !== "number") {
      return NextResponse.json(
        { error: "Valores de saldo inválidos" },
        { status: 400 }
      );
    }

    if (balance < 0 || maxBalance < 0) {
      return NextResponse.json(
        { error: "Saldo não pode ser negativo" },
        { status: 400 }
      );
    }

    const updatedUser = await db
      .update(users)
      .set({
        balance,
        maxBalance,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: updatedUser[0].id,
      nickname: updatedUser[0].nickname,
      balance: updatedUser[0].balance,
      maxBalance: updatedUser[0].maxBalance,
    });
  } catch (error) {
    console.error("Error updating balance:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar saldo" },
      { status: 500 }
    );
  }
}

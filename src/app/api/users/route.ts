import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { nickname, initialBalance = 100 } = await request.json();

    if (!nickname || nickname.trim().length === 0) {
      return NextResponse.json(
        { error: "Nickname é obrigatório" },
        { status: 400 }
      );
    }

    const trimmedNickname = nickname.trim();

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.nickname, trimmedNickname))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Nickname já existe" },
        { status: 409 }
      );
    }

    const newUser = await db
      .insert(users)
      .values({
        nickname: trimmedNickname,
        balance: initialBalance,
        maxBalance: initialBalance,
      })
      .returning();

    return NextResponse.json({
      id: newUser[0].id,
      nickname: newUser[0].nickname,
      balance: newUser[0].balance,
      maxBalance: newUser[0].maxBalance,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const nickname = searchParams.get("nickname");

    if (userId) {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) {
        return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
      }

      return NextResponse.json({
        id: user[0].id,
        nickname: user[0].nickname,
        balance: user[0].balance,
        maxBalance: user[0].maxBalance,
      });
    }

    if (nickname) {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.nickname, nickname))
        .limit(1);

      if (user.length === 0) {
        return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
      }

      return NextResponse.json({
        id: user[0].id,
        nickname: user[0].nickname,
        balance: user[0].balance,
        maxBalance: user[0].maxBalance,
      });
    }

    return NextResponse.json({ error: "userId ou nickname necessário" }, { status: 400 });
  } catch (error) {
    console.error("Error getting user:", error);
    return NextResponse.json(
      { error: "Erro ao buscar usuário" },
      { status: 500 }
    );
  }
}

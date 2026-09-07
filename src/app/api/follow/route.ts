import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { follows, users } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = await req.json();
    const { userId: targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "UserId é obrigatório." }, { status: 400 });
    }

    if (targetUserId === currentUser.userId) {
      return NextResponse.json({ error: "Não pode seguir a si mesmo." }, { status: 400 });
    }

    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, targetUserId),
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const existing = await db.query.follows.findFirst({
      where: and(eq(follows.followerId, currentUser.userId), eq(follows.followingId, targetUserId)),
    });

    if (existing) {
      await db.delete(follows).where(
        and(eq(follows.followerId, currentUser.userId), eq(follows.followingId, targetUserId))
      );
      return NextResponse.json({ following: false });
    } else {
      await db.insert(follows).values({
        followerId: currentUser.userId,
        followingId: targetUserId,
      });
      return NextResponse.json({ following: true });
    }
  } catch (error) {
    console.error("Follow error:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

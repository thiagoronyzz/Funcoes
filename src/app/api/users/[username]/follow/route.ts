import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users, follows } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { username } = await params;

  try {
    const [targetUser] = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    if (targetUser.id === session.userId) {
      return NextResponse.json(
        { error: "Você não pode seguir a si mesmo." },
        { status: 400 }
      );
    }

    const [existingFollow] = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, session.userId),
          eq(follows.followingId, targetUser.id)
        )
      )
      .limit(1);

    if (existingFollow) {
      // Unfollow
      await db
        .delete(follows)
        .where(
          and(
            eq(follows.followerId, session.userId),
            eq(follows.followingId, targetUser.id)
          )
        );

      await db
        .update(users)
        .set({ followersCount: sql`${users.followersCount} - 1` })
        .where(eq(users.id, targetUser.id));

      await db
        .update(users)
        .set({ followingCount: sql`${users.followingCount} - 1` })
        .where(eq(users.id, session.userId));

      return NextResponse.json({ action: "unfollowed", isFollowing: false });
    } else {
      // Follow
      await db.insert(follows).values({
        followerId: session.userId,
        followingId: targetUser.id,
      });

      await db
        .update(users)
        .set({ followersCount: sql`${users.followersCount} + 1` })
        .where(eq(users.id, targetUser.id));

      await db
        .update(users)
        .set({ followingCount: sql`${users.followingCount} + 1` })
        .where(eq(users.id, session.userId));

      return NextResponse.json({ action: "followed", isFollowing: true });
    }
  } catch (error) {
    console.error("Follow error:", error);
    return NextResponse.json({ error: "Erro ao seguir/deixar de seguir." }, { status: 500 });
  }
}

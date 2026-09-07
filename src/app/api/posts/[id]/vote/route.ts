import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { posts, users, votes } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const postId = parseInt(id);

  if (isNaN(postId)) {
    return NextResponse.json({ error: "Post inválido." }, { status: 400 });
  }

  try {
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: "Post não encontrado." }, { status: 404 });
    }

    if (post.userId === session.userId) {
      return NextResponse.json(
        { error: "Você não pode votar no seu próprio post." },
        { status: 400 }
      );
    }

    const [existingVote] = await db
      .select()
      .from(votes)
      .where(and(eq(votes.userId, session.userId), eq(votes.postId, postId)))
      .limit(1);

    if (existingVote) {
      // Remove vote
      await db
        .delete(votes)
        .where(and(eq(votes.userId, session.userId), eq(votes.postId, postId)));

      await db
        .update(posts)
        .set({ votesCount: sql`${posts.votesCount} - 1` })
        .where(eq(posts.id, postId));

      await db
        .update(users)
        .set({ totalVotes: sql`${users.totalVotes} - 1` })
        .where(eq(users.id, post.userId));

      return NextResponse.json({ action: "removed", voted: false });
    } else {
      // Add vote
      await db.insert(votes).values({
        userId: session.userId,
        postId,
      });

      await db
        .update(posts)
        .set({ votesCount: sql`${posts.votesCount} + 1` })
        .where(eq(posts.id, postId));

      await db
        .update(users)
        .set({ totalVotes: sql`${users.totalVotes} + 1` })
        .where(eq(users.id, post.userId));

      return NextResponse.json({ action: "added", voted: true });
    }
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json({ error: "Erro ao votar." }, { status: 500 });
  }
}

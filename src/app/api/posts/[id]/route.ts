import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { posts, users, votes } from "@/db/schema";
import { eq, and, count, desc } from "drizzle-orm";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { id: postId } = await params;

    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });

    if (!post) {
      return NextResponse.json({ error: "Post não encontrado." }, { status: 404 });
    }

    if (post.userId !== currentUser.userId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }

    await db.delete(posts).where(eq(posts.id, postId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { id: postId } = await params;

    const postResult = await db
      .select({
        id: posts.id,
        content: posts.content,
        imageUrl: posts.imageUrl,
        createdAt: posts.createdAt,
        userId: posts.userId,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        voteCount: count(votes.userId).as("vote_count"),
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .leftJoin(votes, eq(votes.postId, posts.id))
      .where(eq(posts.id, postId))
      .groupBy(posts.id, users.id);

    if (postResult.length === 0) {
      return NextResponse.json({ error: "Post não encontrado." }, { status: 404 });
    }

    const post = postResult[0];

    const hasVoted = !!(await db.query.votes.findFirst({
      where: and(eq(votes.userId, currentUser.userId), eq(votes.postId, postId)),
    }));

    return NextResponse.json({ ...post, hasVoted });
  } catch (error) {
    console.error("Get post error:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

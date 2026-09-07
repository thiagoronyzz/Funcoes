import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { posts, users, votes } from "@/db/schema";
import { eq, desc, count, sql } from "drizzle-orm";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    // Top 10 users by total votes received
    const topUsers = await db
      .select({
        userId: posts.userId,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        totalVotes: count(votes.userId).as("total_votes"),
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .leftJoin(votes, eq(votes.postId, posts.id))
      .groupBy(posts.userId, users.id)
      .orderBy(desc(count(votes.userId)))
      .limit(10);

    // Top 10 most voted posts
    const topPosts = await db
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
      .groupBy(posts.id, users.id)
      .orderBy(desc(count(votes.userId)))
      .limit(10);

    return NextResponse.json({ topUsers, topPosts });
  } catch (error) {
    console.error("Rankings error:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, posts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const topUsers = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        totalVotes: users.totalVotes,
        postsCount: users.postsCount,
      })
      .from(users)
      .orderBy(desc(users.totalVotes))
      .limit(10);

    const topPostsRaw = await db
      .select({
        id: posts.id,
        content: posts.content,
        imageUrl: posts.imageUrl,
        votesCount: posts.votesCount,
        createdAt: posts.createdAt,
        userId: posts.userId,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .orderBy(desc(posts.votesCount))
      .limit(10);

    return NextResponse.json({ topUsers, topPosts: topPostsRaw });
  } catch (error) {
    console.error("Records error:", error);
    return NextResponse.json({ error: "Erro ao buscar recordes." }, { status: 500 });
  }
}

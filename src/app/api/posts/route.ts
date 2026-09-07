import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { posts, users, votes, follows } from "@/db/schema";
import { eq, desc, sql, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getSession();
  const { searchParams } = new URL(req.url);
  const feed = searchParams.get("feed") || "global";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    let postList;

    if (feed === "following" && session) {
      // Get following ids
      const followingRows = await db
        .select({ followingId: follows.followingId })
        .from(follows)
        .where(eq(follows.followerId, session.userId));

      const followingIds = followingRows.map((r) => r.followingId);

      if (followingIds.length === 0) {
        return NextResponse.json({ posts: [], total: 0 });
      }

      postList = await db
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
          userTotalVotes: users.totalVotes,
        })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .where(inArray(posts.userId, followingIds))
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset);
    } else {
      postList = await db
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
          userTotalVotes: users.totalVotes,
        })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset);
    }

    // Get user rankings (by totalVotes)
    const topUsers = await db
      .select({ id: users.id, totalVotes: users.totalVotes })
      .from(users)
      .orderBy(desc(users.totalVotes));

    const rankMap: Record<number, number> = {};
    topUsers.forEach((u, i) => {
      rankMap[u.id] = i + 1;
    });

    // If logged in, get which posts the user has voted on
    let votedPostIds: Set<number> = new Set();
    if (session) {
      const userVotes = await db
        .select({ postId: votes.postId })
        .from(votes)
        .where(eq(votes.userId, session.userId));
      votedPostIds = new Set(userVotes.map((v) => v.postId));
    }

    const enriched = postList.map((p) => ({
      ...p,
      userRank: rankMap[p.userId] || null,
      hasVoted: votedPostIds.has(p.id),
    }));

    return NextResponse.json({ posts: enriched });
  } catch (error) {
    console.error("Get posts error:", error);
    return NextResponse.json({ error: "Erro ao buscar posts." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { content, imageUrl } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Conteúdo é obrigatório." }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: "Máximo de 500 caracteres." },
        { status: 400 }
      );
    }

    const [post] = await db
      .insert(posts)
      .values({
        userId: session.userId,
        content: content.trim(),
        imageUrl: imageUrl || null,
      })
      .returning();

    await db
      .update(users)
      .set({ postsCount: sql`${users.postsCount} + 1` })
      .where(eq(users.id, session.userId));

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json({ error: "Erro ao criar post." }, { status: 500 });
  }
}

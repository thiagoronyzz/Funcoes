import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users, posts, follows, votes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await getSession();
  const { username } = await params;

  try {
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        bio: users.bio,
        avatarUrl: users.avatarUrl,
        totalVotes: users.totalVotes,
        followersCount: users.followersCount,
        followingCount: users.followingCount,
        postsCount: users.postsCount,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    // Get global rank
    const allUsers = await db
      .select({ id: users.id })
      .from(users)
      .orderBy(desc(users.totalVotes));

    const rank = allUsers.findIndex((u) => u.id === user.id) + 1;

    // Check if current user follows this user
    let isFollowing = false;
    if (session && session.userId !== user.id) {
      const [follow] = await db
        .select()
        .from(follows)
        .where(
          eq(follows.followerId, session.userId)
        )
        .limit(1);

      // More precise check
      const followCheck = await db
        .select()
        .from(follows)
        .where(
          eq(follows.followerId, session.userId)
        );

      isFollowing = followCheck.some((f) => f.followingId === user.id);
    }

    // Get user posts
    const userPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.userId, user.id))
      .orderBy(desc(posts.createdAt));

    // Get voted posts by current user
    let votedPostIds: Set<number> = new Set();
    if (session) {
      const userVotes = await db
        .select({ postId: votes.postId })
        .from(votes)
        .where(eq(votes.userId, session.userId));
      votedPostIds = new Set(userVotes.map((v) => v.postId));
    }

    const enrichedPosts = userPosts.map((p) => ({
      ...p,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      userTotalVotes: user.totalVotes,
      userRank: rank,
      hasVoted: votedPostIds.has(p.id),
    }));

    return NextResponse.json({
      user: { ...user, rank },
      posts: enrichedPosts,
      isFollowing,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Erro ao buscar usuário." }, { status: 500 });
  }
}

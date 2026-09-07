import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { users, posts, votes, follows } from "@/db/schema";
import { eq, and, count, desc, sql } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { username } = await params;

    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    // Get follower and following counts
    const followerCount = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followingId, user.id));

    const followingCount = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followerId, user.id));

    // Check if current user follows this user
    const isFollowing = !!(await db.query.follows.findFirst({
      where: and(eq(follows.followerId, currentUser.userId), eq(follows.followingId, user.id)),
    }));

    // Get user's posts with vote counts
    const userPosts = await db
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
      .where(eq(posts.userId, user.id))
      .groupBy(posts.id, users.id)
      .orderBy(desc(posts.createdAt))
      .limit(50);

    // Get current user's votes for these posts
    const postIds = userPosts.map(p => p.id);
    let userVotes: string[] = [];
    if (postIds.length > 0) {
      const voteRows = await db
        .select({ postId: votes.postId })
        .from(votes)
        .where(sql`${votes.postId} IN (${sql.join(postIds.map(id => sql`${id}`), sql`, `)}) AND ${votes.userId} = ${currentUser.userId}`);
      userVotes = voteRows.map(v => v.postId);
    }

    // Get user's rank
    const allRanked = await db
      .select({
        userId: posts.userId,
        totalVotes: count(votes.userId).as("total_votes"),
      })
      .from(posts)
      .leftJoin(votes, eq(votes.postId, posts.id))
      .groupBy(posts.userId)
      .orderBy(desc(count(votes.userId)));

    const rank = allRanked.findIndex(r => r.userId === user.id) + 1 || null;

    // Total votes received
    const totalVotesReceived = allRanked.find(r => r.userId === user.id)?.totalVotes || 0;

    const postsWithVotes = userPosts.map(p => ({
      ...p,
      hasVoted: userVotes.includes(p.id),
      rank: null as number | null,
    }));

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
      },
      followerCount: followerCount[0]?.count || 0,
      followingCount: followingCount[0]?.count || 0,
      isFollowing,
      totalVotesReceived,
      rank,
      posts: postsWithVotes,
    });
  } catch (error) {
    console.error("Profile error:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

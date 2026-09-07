"use client";

import React, { useState, useEffect, use } from "react";
import Navbar from "@/components/Navbar";
import Avatar from "@/components/Avatar";
import PostCard, { type PostData } from "@/components/PostCard";
import RankBadge from "@/components/RankBadge";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { formatDate } from "@/lib/utils";

interface ProfileUser {
  id: number;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  totalVotes: number;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: string;
  rank: number;
}

interface ProfileData {
  user: ProfileUser;
  posts: PostData[];
  isFollowing: boolean;
}

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const { user: currentUser, refresh } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await fetch(`/api/users/${username}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        const d = await res.json();
        setData(d);
        setFollowing(d.isFollowing);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [username]);

  async function handleFollow() {
    if (!currentUser) {
      setShowAuth(true);
      return;
    }
    if (followLoading) return;
    setFollowLoading(true);

    const wasFollowing = following;
    setFollowing(!wasFollowing);
    if (data) {
      setData({
        ...data,
        user: {
          ...data.user,
          followersCount: data.user.followersCount + (wasFollowing ? -1 : 1),
        },
        isFollowing: !wasFollowing,
      });
    }

    try {
      const res = await fetch(`/api/users/${username}/follow`, { method: "POST" });
      const d = await res.json();
      if (!res.ok) {
        setFollowing(wasFollowing);
        if (data) {
          setData({
            ...data,
            user: {
              ...data.user,
              followersCount: data.user.followersCount,
            },
            isFollowing: wasFollowing,
          });
        }
        showToast(d.error || "Erro ao seguir.", "error");
      } else {
        if (d.action === "followed") {
          showToast(`Você está seguindo @${username}.`, "success");
        } else {
          showToast(`Você deixou de seguir @${username}.`, "info");
        }
        await refresh();
      }
    } catch {
      setFollowing(wasFollowing);
      showToast("Erro ao seguir.", "error");
    } finally {
      setFollowLoading(false);
    }
  }

  function handleVoteChange(postId: number, newCount: number, hasVoted: boolean) {
    if (!data) return;
    setData({
      ...data,
      posts: data.posts.map((p) =>
        p.id === postId ? { ...p, votesCount: newCount, hasVoted } : p
      ),
    });
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#faf9f7" }}>
        <Navbar />
        <div className="flex justify-center py-20">
          <div
            className="w-6 h-6 border-2 rounded-full animate-spin"
            style={{ borderColor: "#d0c8bb", borderTopColor: "#7d6e5e" }}
          />
        </div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#faf9f7" }}>
        <Navbar />
        <div className="max-w-xl mx-auto py-20 text-center px-4">
          <p
            className="text-lg mb-2"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: "italic",
              color: "#7d6e5e",
            }}
          >
            Este pensador não foi encontrado.
          </p>
          <a href="/" className="text-sm" style={{ color: "#9a8b79" }}>
            ← Voltar ao início
          </a>
        </div>
      </div>
    );
  }

  const { user, posts } = data;
  const isOwnProfile = currentUser?.id === user.id;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#faf9f7" }}>
      <Navbar />

      <div className="max-w-2xl mx-auto border-x" style={{ borderColor: "#e5e0d7", minHeight: "calc(100vh - 56px)" }}>
        {/* Profile header */}
        <div
          className="px-6 pt-8 pb-5 border-b"
          style={{ borderColor: "#e5e0d7" }}
        >
          <div className="flex items-start justify-between mb-4">
            <Avatar name={user.displayName} avatarUrl={user.avatarUrl} size="xl" />

            {!isOwnProfile && currentUser && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className="px-4 py-1.5 rounded font-semibold text-sm transition-all"
                style={{
                  backgroundColor: following ? "transparent" : "#1e1a15",
                  color: following ? "#1e1a15" : "#f5f0e8",
                  border: following ? "1px solid #1e1a15" : "1px solid transparent",
                  cursor: followLoading ? "not-allowed" : "pointer",
                  opacity: followLoading ? 0.7 : 1,
                }}
              >
                {following ? "Seguindo" : "Seguir"}
              </button>
            )}

            {!isOwnProfile && !currentUser && (
              <button
                onClick={() => setShowAuth(true)}
                className="px-4 py-1.5 rounded font-semibold text-sm"
                style={{ backgroundColor: "#1e1a15", color: "#f5f0e8" }}
              >
                Seguir
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 mb-0.5">
            <h1
              className="text-xl font-bold"
              style={{ color: "#1e1a15", fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {user.displayName}
            </h1>
            <RankBadge rank={user.rank} totalVotes={user.totalVotes} />
          </div>
          <p className="text-sm mb-3" style={{ color: "#9a8b79" }}>
            @{user.username}
          </p>

          {user.bio && (
            <p
              className="text-sm leading-relaxed mb-3"
              style={{ color: "#5e5146", fontStyle: "italic" }}
            >
              {user.bio}
            </p>
          )}

          <p className="text-xs mb-4" style={{ color: "#b5a99a" }}>
            Membro desde {formatDate(user.createdAt)}
          </p>

          {/* Stats */}
          <div className="flex gap-6">
            <div>
              <span className="text-sm font-bold" style={{ color: "#1e1a15" }}>
                {user.postsCount}
              </span>
              <span className="text-xs ml-1" style={{ color: "#9a8b79" }}>
                publicações
              </span>
            </div>
            <div>
              <span className="text-sm font-bold" style={{ color: "#1e1a15" }}>
                {user.followersCount}
              </span>
              <span className="text-xs ml-1" style={{ color: "#9a8b79" }}>
                seguidores
              </span>
            </div>
            <div>
              <span className="text-sm font-bold" style={{ color: "#1e1a15" }}>
                {user.followingCount}
              </span>
              <span className="text-xs ml-1" style={{ color: "#9a8b79" }}>
                seguindo
              </span>
            </div>
            <div>
              <span className="text-sm font-bold" style={{ color: "#c9a84c" }}>
                {user.totalVotes}
              </span>
              <span className="text-xs ml-1" style={{ color: "#9a8b79" }}>
                votos recebidos
              </span>
            </div>
          </div>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div className="py-20 text-center px-6">
            <p
              className="text-base"
              style={{
                color: "#7d6e5e",
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontStyle: "italic",
              }}
            >
              {isOwnProfile
                ? "Você ainda não publicou nenhuma frase."
                : "Este pensador ainda não publicou nada."}
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onVoteChange={handleVoteChange}
              onLoginRequired={() => setShowAuth(true)}
            />
          ))
        )}
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}

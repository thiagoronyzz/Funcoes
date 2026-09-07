"use client";

import React, { useState } from "react";
import Link from "next/link";
import Avatar from "./Avatar";
import RankBadge from "./RankBadge";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "./Toast";
import { formatDate } from "@/lib/utils";

export interface PostData {
  id: number;
  content: string;
  imageUrl: string | null;
  votesCount: number;
  createdAt: string;
  userId: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  userTotalVotes: number;
  userRank: number | null;
  hasVoted: boolean;
}

interface PostCardProps {
  post: PostData;
  onVoteChange?: (postId: number, newCount: number, hasVoted: boolean) => void;
  onLoginRequired?: () => void;
}

export default function PostCard({ post, onVoteChange, onLoginRequired }: PostCardProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [voting, setVoting] = useState(false);
  const [localVoted, setLocalVoted] = useState(post.hasVoted);
  const [localCount, setLocalCount] = useState(post.votesCount);
  const [imgOpen, setImgOpen] = useState(false);

  const isOwn = user?.id === post.userId;

  async function handleVote() {
    if (!user) {
      onLoginRequired?.();
      return;
    }
    if (isOwn) {
      showToast("Você não pode votar no próprio post.", "error");
      return;
    }
    if (voting) return;

    setVoting(true);
    const optimisticVoted = !localVoted;
    const optimisticCount = localCount + (optimisticVoted ? 1 : -1);
    setLocalVoted(optimisticVoted);
    setLocalCount(optimisticCount);

    try {
      const res = await fetch(`/api/posts/${post.id}/vote`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setLocalVoted(localVoted);
        setLocalCount(localCount);
        showToast(data.error || "Erro ao votar.", "error");
      } else {
        onVoteChange?.(post.id, optimisticCount, optimisticVoted);
      }
    } catch {
      setLocalVoted(localVoted);
      setLocalCount(localCount);
      showToast("Erro ao votar.", "error");
    } finally {
      setVoting(false);
    }
  }

  return (
    <>
      <article
        className="border-b px-4 py-4 hover:bg-stone-50 transition-colors"
        style={{ borderColor: "#e5e0d7" }}
      >
        <div className="flex gap-3">
          <Link href={`/profile/${post.username}`} className="flex-shrink-0">
            <Avatar name={post.displayName} avatarUrl={post.avatarUrl} size="md" />
          </Link>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Link
                href={`/profile/${post.username}`}
                className="font-semibold text-sm hover:underline"
                style={{ color: "#1e1a15" }}
              >
                {post.displayName}
              </Link>
              <RankBadge rank={post.userRank} totalVotes={post.userTotalVotes} />
              <span className="text-xs" style={{ color: "#9a8b79" }}>
                @{post.username}
              </span>
              <span className="text-xs" style={{ color: "#b5a99a" }}>
                · {formatDate(post.createdAt)}
              </span>
            </div>

            {/* Content */}
            <p
              className="text-sm leading-relaxed mb-3 whitespace-pre-wrap"
              style={{
                color: "#3d352c",
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontStyle: "italic",
              }}
            >
              &ldquo;{post.content}&rdquo;
            </p>

            {/* Image */}
            {post.imageUrl && (
              <div
                className="mb-3 rounded overflow-hidden border cursor-pointer"
                style={{ borderColor: "#d0c8bb", maxHeight: "320px" }}
                onClick={() => setImgOpen(true)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.imageUrl}
                  alt="Imagem do post"
                  className="w-full object-cover"
                  style={{ maxHeight: "320px" }}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleVote}
                disabled={voting || isOwn}
                className="flex items-center gap-1.5 text-xs font-medium rounded px-2 py-1 transition-all"
                style={{
                  color: localVoted ? "#9a7a08" : "#9a8b79",
                  backgroundColor: localVoted ? "#f5f0e0" : "transparent",
                  border: `1px solid ${localVoted ? "#c9a84c" : "transparent"}`,
                  opacity: isOwn ? 0.4 : 1,
                  cursor: isOwn ? "not-allowed" : "pointer",
                }}
                title={
                  isOwn
                    ? "Não pode votar no próprio post"
                    : localVoted
                    ? "Remover voto"
                    : "Votar nesta frase"
                }
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill={localVoted ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span>{localCount}</span>
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Image modal */}
      {imgOpen && post.imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4"
          onClick={() => setImgOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt="Imagem"
            className="max-w-full max-h-full rounded"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setImgOpen(false)}
            className="absolute top-4 right-4 text-white text-2xl font-bold"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Avatar from "@/components/Avatar";
import { formatDate } from "@/lib/utils";

interface TopUser {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  totalVotes: number;
  postsCount: number;
}

interface TopPost {
  id: number;
  content: string;
  imageUrl: string | null;
  votesCount: number;
  createdAt: string;
  userId: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

interface RecordsData {
  topUsers: TopUser[];
  topPosts: TopPost[];
}

const MEDALS = ["🥇", "🥈", "🥉"];

function getRankStyle(index: number) {
  if (index === 0)
    return { color: "#b8920a", fontWeight: "700" };
  if (index === 1)
    return { color: "#8a8a8a", fontWeight: "700" };
  if (index === 2)
    return { color: "#9a7a08", fontWeight: "600" };
  return { color: "#7d6e5e", fontWeight: "500" };
}

export default function RecordsPage() {
  const [data, setData] = useState<RecordsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"users" | "posts">("users");

  useEffect(() => {
    async function fetchRecords() {
      try {
        const res = await fetch("/api/records");
        const d = await res.json();
        setData(d);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchRecords();
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#faf9f7" }}>
      <Navbar />

      <div className="max-w-2xl mx-auto border-x" style={{ borderColor: "#e5e0d7", minHeight: "calc(100vh - 56px)" }}>
        {/* Header */}
        <div
          className="px-6 py-6 border-b"
          style={{ borderColor: "#e5e0d7" }}
        >
          <h1
            className="text-2xl font-bold mb-1"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              color: "#1e1a15",
            }}
          >
            Recordes
          </h1>
          <p className="text-sm" style={{ color: "#9a8b79" }}>
            Os pensadores e as frases mais reconhecidos da comunidade.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: "#e5e0d7" }}>
          <button
            onClick={() => setTab("users")}
            className="flex-1 py-3.5 text-sm font-medium transition-colors"
            style={{
              color: tab === "users" ? "#1e1a15" : "#9a8b79",
              borderBottom:
                tab === "users" ? "2px solid #1e1a15" : "2px solid transparent",
            }}
          >
            Top Pensadores
          </button>
          <button
            onClick={() => setTab("posts")}
            className="flex-1 py-3.5 text-sm font-medium transition-colors"
            style={{
              color: tab === "posts" ? "#1e1a15" : "#9a8b79",
              borderBottom:
                tab === "posts" ? "2px solid #1e1a15" : "2px solid transparent",
            }}
          >
            Top Frases
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div
              className="w-6 h-6 border-2 rounded-full animate-spin"
              style={{ borderColor: "#d0c8bb", borderTopColor: "#7d6e5e" }}
            />
          </div>
        ) : !data ? (
          <div className="py-20 text-center">
            <p style={{ color: "#9a8b79" }}>Erro ao carregar recordes.</p>
          </div>
        ) : tab === "users" ? (
          <div>
            {data.topUsers.length === 0 ? (
              <div className="py-20 text-center px-6">
                <p
                  className="text-base"
                  style={{
                    color: "#7d6e5e",
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontStyle: "italic",
                  }}
                >
                  Ainda não há pensadores para exibir.
                </p>
              </div>
            ) : (
              data.topUsers.map((u, i) => (
                <Link
                  key={u.id}
                  href={`/profile/${u.username}`}
                  className="flex items-center gap-4 px-6 py-4 border-b transition-colors hover:bg-stone-50"
                  style={{ borderColor: "#e5e0d7" }}
                >
                  {/* Rank */}
                  <div className="w-8 text-center flex-shrink-0">
                    {i < 3 ? (
                      <span className="text-xl">{MEDALS[i]}</span>
                    ) : (
                      <span
                        className="text-sm font-semibold tabular-nums"
                        style={{ color: "#9a8b79" }}
                      >
                        {i + 1}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar name={u.displayName} avatarUrl={u.avatarUrl} size="md" />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: "#1e1a15" }}
                    >
                      {u.displayName}
                    </p>
                    <p className="text-xs" style={{ color: "#9a8b79" }}>
                      @{u.username} · {u.postsCount} frases
                    </p>
                  </div>

                  {/* Votes */}
                  <div className="text-right flex-shrink-0">
                    <p
                      className="text-base font-bold tabular-nums"
                      style={getRankStyle(i)}
                    >
                      {u.totalVotes.toLocaleString("pt-BR")}
                    </p>
                    <p className="text-xs" style={{ color: "#b5a99a" }}>
                      votos
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        ) : (
          <div>
            {data.topPosts.length === 0 ? (
              <div className="py-20 text-center px-6">
                <p
                  className="text-base"
                  style={{
                    color: "#7d6e5e",
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontStyle: "italic",
                  }}
                >
                  Ainda não há frases para exibir.
                </p>
              </div>
            ) : (
              data.topPosts.map((post, i) => (
                <div
                  key={post.id}
                  className="flex gap-4 px-6 py-4 border-b"
                  style={{ borderColor: "#e5e0d7" }}
                >
                  {/* Rank */}
                  <div className="w-8 text-center flex-shrink-0 pt-0.5">
                    {i < 3 ? (
                      <span className="text-xl">{MEDALS[i]}</span>
                    ) : (
                      <span
                        className="text-sm font-semibold tabular-nums"
                        style={{ color: "#9a8b79" }}
                      >
                        {i + 1}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Author */}
                    <Link
                      href={`/profile/${post.username}`}
                      className="flex items-center gap-2 mb-2"
                    >
                      <Avatar
                        name={post.displayName}
                        avatarUrl={post.avatarUrl}
                        size="xs"
                      />
                      <span className="text-xs font-medium" style={{ color: "#7d6e5e" }}>
                        {post.displayName}
                      </span>
                      <span className="text-xs" style={{ color: "#b5a99a" }}>
                        · {formatDate(post.createdAt)}
                      </span>
                    </Link>

                    {/* Content */}
                    <p
                      className="text-sm leading-relaxed"
                      style={{
                        color: "#3d352c",
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        fontStyle: "italic",
                      }}
                    >
                      &ldquo;{post.content}&rdquo;
                    </p>

                    {/* Image thumb */}
                    {post.imageUrl && (
                      <div className="mt-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={post.imageUrl}
                          alt="Imagem"
                          className="rounded border max-h-24 object-cover"
                          style={{ borderColor: "#d0c8bb" }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Votes */}
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        style={getRankStyle(i)}
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <p
                        className="text-base font-bold tabular-nums"
                        style={getRankStyle(i)}
                      >
                        {post.votesCount.toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <p className="text-xs" style={{ color: "#b5a99a" }}>
                      votos
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

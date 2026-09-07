"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import PostCard, { type PostData } from "@/components/PostCard";
import ComposePost from "@/components/ComposePost";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/context/AuthContext";

type FeedType = "global" | "following";

export default function HomePage() {
  const { user, loading } = useAuth();
  const [feed, setFeed] = useState<FeedType>("global");
  const [posts, setPosts] = useState<PostData[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  const fetchPosts = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch(`/api/posts?feed=${feed}`);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {
      setPosts([]);
    } finally {
      setFetching(false);
    }
  }, [feed]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  function handleNewPost(post: PostData) {
    setPosts((prev) => [post, ...prev]);
  }

  function handleVoteChange(postId: number, newCount: number, hasVoted: boolean) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, votesCount: newCount, hasVoted } : p
      )
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#faf9f7" }}>
      <Navbar />

      <div className="max-w-4xl mx-auto flex">
        {/* Main feed */}
        <main className="flex-1 min-w-0 border-x" style={{ borderColor: "#e5e0d7" }}>
          {/* Feed tabs */}
          <div
            className="flex border-b sticky top-14 z-30 backdrop-blur-sm"
            style={{
              backgroundColor: "rgba(250,249,247,0.95)",
              borderColor: "#e5e0d7",
            }}
          >
            <button
              onClick={() => setFeed("global")}
              className="flex-1 py-3.5 text-sm font-medium transition-colors"
              style={{
                color: feed === "global" ? "#1e1a15" : "#9a8b79",
                borderBottom:
                  feed === "global"
                    ? "2px solid #1e1a15"
                    : "2px solid transparent",
              }}
            >
              Global
            </button>
            <button
              onClick={() => {
                if (!user) {
                  setShowAuth(true);
                  return;
                }
                setFeed("following");
              }}
              className="flex-1 py-3.5 text-sm font-medium transition-colors"
              style={{
                color: feed === "following" ? "#1e1a15" : "#9a8b79",
                borderBottom:
                  feed === "following"
                    ? "2px solid #1e1a15"
                    : "2px solid transparent",
              }}
            >
              Seguindo
            </button>
          </div>

          {/* Compose */}
          {user && <ComposePost onPost={handleNewPost} />}

          {/* Posts */}
          {fetching || loading ? (
            <div className="py-16 text-center" style={{ color: "#b5a99a" }}>
              <div
                className="inline-block w-6 h-6 border-2 rounded-full animate-spin"
                style={{ borderColor: "#d0c8bb", borderTopColor: "#7d6e5e" }}
              />
            </div>
          ) : posts.length === 0 ? (
            <div className="py-20 text-center px-6">
              <p
                className="text-base mb-2"
                style={{
                  color: "#7d6e5e",
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontStyle: "italic",
                }}
              >
                {feed === "following"
                  ? "Nenhuma publicação de quem você segue."
                  : "Nenhuma publicação ainda."}
              </p>
              <p className="text-sm" style={{ color: "#b5a99a" }}>
                {feed === "following"
                  ? "Siga pensadores para ver suas frases aqui."
                  : "Seja o primeiro a compartilhar uma ideia."}
              </p>
            </div>
          ) : (
            <div>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onVoteChange={handleVoteChange}
                  onLoginRequired={() => setShowAuth(true)}
                />
              ))}
            </div>
          )}
        </main>

        {/* Right sidebar */}
        <aside className="hidden lg:block w-72 xl:w-80 flex-shrink-0">
          <div className="sticky top-14 p-4">
            {!user && !loading && (
              <div
                className="rounded-lg border p-5 mb-4"
                style={{
                  borderColor: "#d0c8bb",
                  backgroundColor: "#f5f0e8",
                }}
              >
                <h3
                  className="text-base font-semibold mb-1"
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    color: "#1e1a15",
                  }}
                >
                  Entre na conversa
                </h3>
                <p className="text-xs mb-4" style={{ color: "#7d6e5e" }}>
                  Compartilhe suas reflexões. Vote nas que mais ressoam.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setShowAuth(true)}
                    className="w-full py-2 rounded font-semibold text-sm"
                    style={{ backgroundColor: "#1e1a15", color: "#f5f0e8" }}
                  >
                    Criar conta
                  </button>
                  <button
                    onClick={() => setShowAuth(true)}
                    className="w-full py-2 rounded font-semibold text-sm border"
                    style={{
                      borderColor: "#d0c8bb",
                      color: "#3d352c",
                      backgroundColor: "transparent",
                    }}
                  >
                    Entrar
                  </button>
                </div>
              </div>
            )}

            <div
              className="rounded-lg border p-4"
              style={{ borderColor: "#d0c8bb" }}
            >
              <h3
                className="text-sm font-semibold mb-3"
                style={{ color: "#1e1a15" }}
              >
                Recordes
              </h3>
              <a
                href="/records"
                className="block text-xs py-2 px-3 rounded transition-colors hover:bg-stone-100"
                style={{ color: "#7d6e5e" }}
              >
                → Top 10 pensadores mais votados
              </a>
              <a
                href="/records"
                className="block text-xs py-2 px-3 rounded transition-colors hover:bg-stone-100"
                style={{ color: "#7d6e5e" }}
              >
                → Top 10 frases mais votadas
              </a>
            </div>
          </div>
        </aside>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}

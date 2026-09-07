"use client";

import React, { useState, useRef } from "react";
import Avatar from "./Avatar";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "./Toast";
import type { PostData } from "./PostCard";

interface ComposePostProps {
  onPost: (post: PostData) => void;
}

export default function ComposePost({ onPost }: ComposePostProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const MAX = 500;
  const remaining = MAX - content.length;

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Erro ao fazer upload.", "error");
      } else {
        setImageUrl(data.url);
        showToast("Imagem anexada.", "success");
      }
    } catch {
      showToast("Erro ao fazer upload.", "error");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handlePost() {
    if (!content.trim()) {
      showToast("Escreva algo antes de publicar.", "error");
      return;
    }
    if (content.length > MAX) {
      showToast("Texto muito longo.", "error");
      return;
    }
    setPosting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Erro ao publicar.", "error");
      } else {
        const newPost: PostData = {
          ...data.post,
          username: user?.username ?? "",
          displayName: user?.displayName ?? "",
          avatarUrl: user?.avatarUrl ?? null,
          userTotalVotes: user?.totalVotes ?? 0,
          userRank: null,
          hasVoted: false,
        };
        onPost(newPost);
        setContent("");
        setImageUrl(null);
        showToast("Publicado com sucesso.", "success");
      }
    } catch {
      showToast("Erro ao publicar.", "error");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="border-b px-4 py-4" style={{ borderColor: "#e5e0d7" }}>
      <div className="flex gap-3">
        <Avatar name={user.displayName} avatarUrl={user.avatarUrl} size="md" />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Que pensamento te atravessa hoje?"
            className="w-full resize-none bg-transparent outline-none text-sm leading-relaxed placeholder:text-stone-400"
            style={{
              color: "#3d352c",
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: content ? "italic" : "normal",
              minHeight: "80px",
            }}
            maxLength={510}
          />

          {/* Image preview */}
          {imageUrl && (
            <div className="relative inline-block mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Preview"
                className="rounded border max-h-40 object-cover"
                style={{ borderColor: "#d0c8bb" }}
              />
              <button
                onClick={() => setImageUrl(null)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black bg-opacity-60 text-white text-xs flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          )}

          <div
            className="flex items-center justify-between pt-3 border-t mt-1"
            style={{ borderColor: "#e5e0d7" }}
          >
            <div className="flex items-center gap-3">
              {/* Image upload */}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="text-stone-400 hover:text-stone-600 transition-colors"
                title="Anexar imagem"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />

              <span
                className="text-xs"
                style={{ color: remaining < 50 ? "#c0614e" : "#b5a99a" }}
              >
                {remaining}
              </span>
            </div>

            <button
              onClick={handlePost}
              disabled={posting || uploading || !content.trim() || remaining < 0}
              className="px-4 py-1.5 rounded text-sm font-semibold transition-all"
              style={{
                backgroundColor:
                  posting || uploading || !content.trim() || remaining < 0
                    ? "#d0c8bb"
                    : "#1e1a15",
                color:
                  posting || uploading || !content.trim() || remaining < 0
                    ? "#9a8b79"
                    : "#f5f0e8",
                cursor:
                  posting || uploading || !content.trim() || remaining < 0
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {posting ? "Publicando..." : "Publicar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

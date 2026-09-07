"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "./Toast";

interface AuthModalProps {
  onClose: () => void;
  defaultTab?: "login" | "register";
}

export default function AuthModal({ onClose, defaultTab = "login" }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">(defaultTab);
  const { refresh } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  // Login state
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");

  // Register state
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regDisplayName, setRegDisplayName] = useState("");
  const [regPw, setRegPw] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: loginId, password: loginPw }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Erro ao entrar.", "error");
      } else {
        await refresh();
        showToast("Bem-vindo de volta.", "success");
        onClose();
      }
    } catch {
      showToast("Erro ao entrar.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: regUsername,
          email: regEmail,
          displayName: regDisplayName,
          password: regPw,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Erro ao registrar.", "error");
      } else {
        await refresh();
        showToast("Conta criada com sucesso.", "success");
        onClose();
      }
    } catch {
      showToast("Erro ao registrar.", "error");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2 rounded border text-sm outline-none focus:border-stone-400 transition-colors";
  const inputStyle = {
    backgroundColor: "#faf9f7",
    borderColor: "#d0c8bb",
    color: "#1e1a15",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(30,26,21,0.6)" }}
    >
      <div
        className="w-full max-w-sm rounded-lg shadow-xl border"
        style={{
          backgroundColor: "#faf9f7",
          borderColor: "#d0c8bb",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#e5e0d7" }}>
          <div>
            <h2
              className="text-xl font-bold tracking-tight"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: "#1e1a15" }}
            >
              Romanov
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 text-xl font-light"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: "#e5e0d7" }}>
          <button
            onClick={() => setTab("login")}
            className="flex-1 py-3 text-sm font-medium transition-colors"
            style={{
              color: tab === "login" ? "#1e1a15" : "#9a8b79",
              borderBottom: tab === "login" ? "2px solid #1e1a15" : "2px solid transparent",
            }}
          >
            Entrar
          </button>
          <button
            onClick={() => setTab("register")}
            className="flex-1 py-3 text-sm font-medium transition-colors"
            style={{
              color: tab === "register" ? "#1e1a15" : "#9a8b79",
              borderBottom: tab === "register" ? "2px solid #1e1a15" : "2px solid transparent",
            }}
          >
            Criar conta
          </button>
        </div>

        <div className="px-6 py-5">
          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#7d6e5e" }}>
                  Usuário ou e-mail
                </label>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  required
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#7d6e5e" }}>
                  Senha
                </label>
                <input
                  type="password"
                  value={loginPw}
                  onChange={(e) => setLoginPw(e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  required
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded font-semibold text-sm transition-all mt-2"
                style={{
                  backgroundColor: loading ? "#d0c8bb" : "#1e1a15",
                  color: loading ? "#9a8b79" : "#f5f0e8",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#7d6e5e" }}>
                  Nome de exibição
                </label>
                <input
                  type="text"
                  value={regDisplayName}
                  onChange={(e) => setRegDisplayName(e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  required
                  maxLength={50}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#7d6e5e" }}>
                  Usuário
                </label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  className={inputClass}
                  style={inputStyle}
                  required
                  maxLength={30}
                  placeholder="letras, números e _"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#7d6e5e" }}>
                  E-mail
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#7d6e5e" }}>
                  Senha
                </label>
                <input
                  type="password"
                  value={regPw}
                  onChange={(e) => setRegPw(e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded font-semibold text-sm transition-all mt-2"
                style={{
                  backgroundColor: loading ? "#d0c8bb" : "#1e1a15",
                  color: loading ? "#9a8b79" : "#f5f0e8",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Criando conta..." : "Criar conta"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

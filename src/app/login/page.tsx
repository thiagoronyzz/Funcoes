"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthProvider } from "@/lib/auth-context";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  if (user) {
    router.replace("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Decorative top line */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-px bg-warm-border" />
        </div>

        <h1 className="font-classical text-3xl text-center text-ink mb-1">Romanov</h1>
        <p className="text-center text-warm-gray text-xs mb-8 tracking-widest uppercase">Frases & Filosofia</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-ink-light mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-marble border border-warm-border rounded-sm focus:outline-none focus:border-bronze transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-ink-light mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-marble border border-warm-border rounded-sm focus:outline-none focus:border-bronze transition-colors"
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 text-sm bg-ink text-parchment rounded-sm hover:bg-ink-light transition-colors disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-warm-gray">
          Não tem conta?{" "}
          <Link href="/register" className="text-bronze hover:text-bronze-light transition-colors">
            Criar conta
          </Link>
        </p>

        {/* Decorative bottom */}
        <div className="flex justify-center mt-8">
          <div className="w-16 h-px bg-warm-border" />
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  );
}

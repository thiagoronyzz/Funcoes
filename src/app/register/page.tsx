"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthProvider } from "@/lib/auth-context";

function RegisterPage() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();
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
      await register(username, displayName, email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-px bg-warm-border" />
        </div>

        <h1 className="font-classical text-3xl text-center text-ink mb-1">Romanov</h1>
        <p className="text-center text-warm-gray text-xs mb-8 tracking-widest uppercase">Criar conta</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-ink-light mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-marble border border-warm-border rounded-sm focus:outline-none focus:border-bronze transition-colors"
              placeholder="ex: marco_aurelio"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-ink-light mb-1">Nome de exibição</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-marble border border-warm-border rounded-sm focus:outline-none focus:border-bronze transition-colors"
              placeholder="ex: Marco Aurélio"
              required
            />
          </div>
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
              placeholder="Mínimo 6 caracteres"
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
            {loading ? "Criando..." : "Criar conta"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-warm-gray">
          Já tem conta?{" "}
          <Link href="/login" className="text-bronze hover:text-bronze-light transition-colors">
            Entrar
          </Link>
        </p>

        <div className="flex justify-center mt-8">
          <div className="w-16 h-px bg-warm-border" />
        </div>
      </div>
    </div>
  );
}

export default function Register() {
  return (
    <AuthProvider>
      <RegisterPage />
    </AuthProvider>
  );
}

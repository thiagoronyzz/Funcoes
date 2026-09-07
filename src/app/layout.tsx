import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Romanov — Palavras que Atravessam o Tempo",
  description:
    "Uma rede social filosófica onde cada frase é uma obra. Compartilhe suas reflexões e vote nas que mais ressoam.",
  icons: {
    icon: "/images/romanov-logo.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ backgroundColor: "#faf9f7", color: "#1e1a15", minHeight: "100vh" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

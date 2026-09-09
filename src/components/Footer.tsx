import { ArrowUp, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { Logo } from "./Navbar";

const colunas = [
  {
    titulo: "Produto",
    links: [
      { texto: "Estudos", href: "#estudos" },
      { texto: "Jogos", href: "#jogos" },
      { texto: "Úteis", href: "#uteis" },
      { texto: "Diretório de Estudos", href: "/ZCODE/Estudos/" },
      { texto: "Diretório de Jogos", href: "/ZCODE/Jogos/" },
      { texto: "Diretório de Úteis", href: "/ZCODE/Úteis/" },
    ],
  },
  {
    titulo: "Recursos",
    links: [
      { texto: "Central de ajuda", href: "/ZCODE/Recursos/ajuda.html" },
      { texto: "Instalar a Zcode", href: "/ZCODE/Recursos/instalar.html" },
      { texto: "Fale conosco", href: "/ZCODE/Recursos/contato.html" },
      { texto: "Perguntas frequentes", href: "#faq" },
    ],
  },
  {
    titulo: "Plataforma",
    links: [
      { texto: "Por que a Zcode", href: "#sobre" },
      { texto: "Instalar aplicativo", href: "#baixar" },
      { texto: "Voltar ao topo", href: "#topo" },
    ],
  },
];

export default function Footer() {
  const ano = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-[#060907]">
      <div className="mx-auto w-full max-w-7xl px-5 pb-8 pt-16 md:px-8 md:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65 }}
          className="mb-14 flex flex-col gap-8 border-b border-line pb-14 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-400">
              Tem uma ideia de aplicativo?
            </p>
            <h2 className="mt-4 max-w-xl font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.02em] md:text-5xl">
              Ajude a escolher o próximo lançamento.
            </h2>
          </div>
          <a
            href="/ZCODE/Recursos/contato.html"
            className="inline-flex w-fit items-center gap-2.5 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-500"
          >
            <Mail className="size-4" />
            Enviar sugestão
          </a>
        </motion.div>

        <div className="grid gap-10 pb-12 md:grid-cols-[1fr_2fr]">
          <div>
            <a href="#topo" aria-label="Zcode — início">
              <Logo claro />
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink/55">
              300 aplicativos gratuitos para estudos, jogos e trabalho.
              Tudo no navegador, sem cadastro.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {colunas.map((coluna) => (
              <div key={coluna.titulo}>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/40">
                  {coluna.titulo}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {coluna.links.map((link) => (
                    <li key={link.texto}>
                      <a
                        href={link.href}
                        className="text-sm text-ink/65 hover:text-brand-300"
                      >
                        {link.texto}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-line pt-6 md:flex-row md:items-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/35">
            © {ano} Zcode — Todos os direitos reservados
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/35">
            Feito para a web · pt-BR
          </p>
          <a
            href="#topo"
            aria-label="Voltar ao topo"
            className="grid size-10 place-items-center rounded-xl border border-line text-ink/60 hover:border-brand-500/50 hover:text-brand-300"
          >
            <ArrowUp className="size-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}

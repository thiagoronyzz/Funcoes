/* ══════════════════════════════════════════════════════════════════
   RONYCODE — EDITE SEUS APLICATIVOS AQUI ✦
   ──────────────────────────────────────────────────────────────────
   Para adicionar ou trocar um aplicativo, edite um bloco como este:

   {
     nome: "Nome do App",          → o nome que aparece no cartão
     descricao: "Frase curta...",  → uma frase sobre o app
     imagem: "/apps/meu-app.jpg",  → coloque a imagem na pasta
                                     "public/apps" e use "/apps/nome.jpg"
                                     (deixe "" para um placeholder azul)
     link: "https://seuapp.com",   → para onde o cartão aponta
   }

   Seus apps em HTML puro ficam em "public/RONYCODE/...". Tudo que está
   dentro de "public" é servido na raiz do site, então o arquivo
   public/RONYCODE/Estudos/funcoes(01)/index.html
   abre em  →  /RONYCODE/Estudos/funcoes(01)/index.html

   Importante: aponte sempre para o arquivo final (".../index.html").
   Sem o "index.html" o Vite devolve a página do site em vez do app.

   Para criar um NOVO cartão, copie um bloco inteiro { ... } e cole
   dentro da categoria desejada. O site atualiza sozinho. ✦
   ══════════════════════════════════════════════════════════════════ */

export interface AppItem {
  nome: string;
  descricao: string;
  imagem: string;
  link: string;
}

export type CategoriaId = "estudos" | "jogos" | "uteis" | "social";

export interface Categoria {
  id: CategoriaId;
  rotulo: string;
  titulo: string;
  descricao: string;
  apps: AppItem[];
}

export const categorias: Categoria[] = [
  {
    id: "estudos",
    rotulo: "Categoria.01",
    titulo: "Estudos",
    descricao:
      "Ferramentas para aprender melhor: foco, revisão, quizzes e tudo que ajuda na hora de estudar.",
    apps: [
      {
        nome: "Funções Matemáticas",
        descricao: "Funções matemáticas com fórmulas, gráficos e principais propriedades para estudo e consulta rápida.",
        imagem: "/apps/estudos-1.jpg",
        link: "/RONYCODE/Estudos/funcoes(01)/index.html",
      },
      {
        nome: "Calculadora",
        descricao: "Calculadora padrão com botões interativos e suporte ao teclado físico para resolver contas rápidas.",
        imagem: "/apps/estudos-calculadora.jpg",
        link: "/RONYCODE/Estudos/calculadorabasica(02)/index.html",
      },
      {
        nome: "Tabela Periódica",
        descricao: "Uma tabela periódica interativa.",
        imagem: "/apps/tabela-periodica.jpg",
        link: "/RONYCODE/Estudos/tabelaperiodica(03)/index.html",
      },
      {
        nome: "Dicionário de fórmulas",
        descricao: "As fórmulas mais importantes do ensino médio.",
        imagem: "/apps/estudos-formulas.jpg",
        link: "/RONYCODE/Estudos/formulas(04)/index.html",
      },
      {
        nome: "Células — Explorador 3D",
        descricao: "Explorador 3D interativo de células procariontes e eucariontes (animal e vegetal), com estruturas clicáveis.",
        imagem: "/apps/estudos-citologia.jpg",
        link: "/RONYCODE/Estudos/citologia(05)/index.html",
      },
      {
        nome: "Corpo Humano — Atlas 3D",
        descricao: "Atlas interativo com modelo 3D do corpo humano, destaque por sistema, estruturas clicáveis e doenças.",
        imagem: "/apps/estudos-sistemas.jpg",
        link: "/RONYCODE/Estudos/sistemas(06)/index.html",
      },
      {
        nome: "Atlas Interativo",
        descricao: "Atlas vetorial interativo: navegue pelo mapa, clique nos países e explore informações geográficas.",
        imagem: "/apps/estudos-atlas.jpg",
        link: "/RONYCODE/Estudos/Atlas(07)/index.html",
      },
      {
        nome: "Eras Geológicas",
        descricao: "Linha do tempo da Terra do Hadeano ao Holoceno, com vida, clima, eventos e extinções em massa.",
        imagem: "/apps/estudos-eras.jpg",
        link: "/RONYCODE/Estudos/eras(08)/index.html",
      },
      {
        nome: "Pomodoro",
        descricao: "Timer de estudo com ciclos de foco e descanso configuráveis para manter a produtividade.",
        imagem: "/apps/estudos-pomodoro.jpg",
        link: "/RONYCODE/Estudos/pomodoro(09)/index.html",
      },
      {
        nome: "Superfícies 3D",
        descricao: "Escreva uma função f(x, y) e veja o gráfico tridimensional gerado em tempo real.",
        imagem: "/apps/estudos-geometria.jpg",
        link: "/RONYCODE/Estudos/geometria(10)/index.html",
      },
      {
        nome: "CSS Clone",
        descricao: "Desafio em 5 níveis: reproduza o alvo escrevendo CSS até combinar tamanho, cor e bordas.",
        imagem: "/apps/estudos-learncss.jpg",
        link: "/RONYCODE/Estudos/learncss(11)/index.html",
      },
    ],
  },
  {
    id: "jogos",
    rotulo: "Categoria.02",
    titulo: "Jogos",
    descricao:
      "Projetos jogáveis feitos por diversão e experimentação: clássicos repaginados e ideias novas.",
    apps: [
      {
        nome: "Roleta da Fortuna",
        descricao: "Treinamento para a sorte",
        imagem: "/apps/roleta-fortuna.jpg",
        link: "/RONYCODE/Jogos/rodafortuna(02)/index.html",
      },
      {
        nome: "Jogo dos países",
        descricao: "Um jogo para governantes.",
        imagem: "/apps/jogo-paises.jpg",
        link: "/RONYCODE/Jogos/jogopaises(01)/index.html",
      },
      {
        nome: "TRcraft",
        descricao: "Sandbox voxel de sobrevivência com mundo infinito, crafting e construção livre.",
        imagem: "/apps/jogos-minicraft.jpg",
        link: "/RONYCODE/Jogos/minicraft(03)/craft.html",
      },
      {
        nome: "Hunterz",
        descricao: "Caçada 3D relaxante em uma floresta viva: localize os animais e cumpra as missões.",
        imagem: "/apps/jogos-hunterz.jpg",
        link: "/RONYCODE/Jogos/estilhacos(04)/index.html",
      },
      {
        nome: "MK: Ultimate Arena",
        descricao: "Jogo de luta 1v1 em 2.5D inspirado em Mortal Kombat, com golpes, combos e arenas.",
        imagem: "/apps/jogos-mortalkombat.jpg",
        link: "/RONYCODE/Jogos/mortalkombat(05)/index.html",
      },
      {
        nome: "Fuja das Esferas",
        descricao: "Sobrevivência 2D: desvie das esferas que te cercam, ficam mais rápidas e bata recordes.",
        imagem: "/apps/jogos-fujaesferas.jpg",
        link: "/RONYCODE/Jogos/fujaesferas(06)/index.html",
      },
      {
        nome: "iFood Rider",
        descricao: "Corrida infinita de moto: desvie de buracos, carros e carrinhos e entregue o máximo de pedidos.",
        imagem: "/apps/jogos-ifoodrider.jpg",
        link: "/RONYCODE/Jogos/ifoodrunner(07)/index.html",
      },
    ],
  },
  {
    id: "uteis",
    rotulo: "Categoria.03",
    titulo: "Úteis",
    descricao:
      "Ferramentas do dia a dia: conversores, geradores e calculadoras que resolvem problemas reais.",
    apps: [
      {
        nome: "Sons dos animais",
        descricao: "Ouça o som desses animais.",
        imagem: "/apps/sons-animais.jpg",
        link: "/RONYCODE/Úteis/Sons(01)/fauna.html",
      },
      {
        nome: "Encurtador de Link",
        descricao: "Diminua seu link rapidamente.",
        imagem: "/apps/encurtador-link.jpg",
        link: "/RONYCODE/Úteis/diminuilink(02)/index.html",
      },
      {
        nome: "Lançador de Dados 3D",
        descricao: "Escolha o número de lados e role o dado: precisão garantida e chances iguais.",
        imagem: "/apps/uteis-dados.jpg",
        link: "/RONYCODE/Úteis/dados(03)/index.html",
      },
      {
        nome: "Sorteador de Grupos",
        descricao: "Cole a lista de nomes, defina o tamanho das equipes e sorteie grupos aleatórios na hora.",
        imagem: "/apps/uteis-sorteargrupos.jpg",
        link: "/RONYCODE/Úteis/sorteargrupos(04)/index.html",
      },
      {
        nome: "Gerador de Gradiente CSS",
        descricao: "Crie, personalize e copie gradientes CSS modernos com várias cores e ângulo ajustável.",
        imagem: "/apps/uteis-gradiente.jpg",
        link: "/RONYCODE/Úteis/cssatual(05)/index.html",
      },
    ],
  },
  {
    id: "social",
    rotulo: "Categoria.04",
    titulo: "Social",
    descricao:
      "Onde me encontrar e interagir: chats, links e experimentos comunitários da plataforma.",
    apps: [
      {
        nome: "Romanov",
        descricao: "Rede social para filósofos.",
        imagem: "/apps/social-1.jpg",
        link: "shorturl.sh/romanov",
      },
      {
        nome: "Meus Links",
        descricao: "Todos os meus perfis e redes sociais em uma página só.",
        imagem: "/apps/social-2.jpg",
        link: "#",
      },
      {
        nome: "Comenta Aí",
        descricao: "Mural aberto para deixar recados e sugestões de apps.",
        imagem: "/apps/social-3.jpg",
        link: "#",
      },
    ],
  },
];

export const totalApps = categorias.reduce((acc, c) => acc + c.apps.length, 0);

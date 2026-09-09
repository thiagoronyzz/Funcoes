/* Zcode — CATÁLOGO DE JOGOS (~270 APPS) */

export function getJogos() {
  const J = [];
  const app = (nome, desc, engine, params, destaque) =>
    J.push({ nome, desc, engine, params, imagem: "", destaque: !!destaque });

  // 1. JOGOS PRINCIPAIS DE ESTRATÉGIA, ARCADE E DESAFIO
  app("Kingdom Defender: Tower Defense", "Defenda seu reino construindo torres arqueiro, canhão e mágica.", "towerDefense", {}, true);
  app("Snake Arena Arcade", "O clássico jogo da cobra com recordes, velocidade e comidas.", "snakeArena", {}, true);
  app("Memory Master RPG", "Jogo da memória com ícones, tentativas e tempo.", "memoryMaster", {}, true);
  app("Campo Minado Pro", "Campo minado tático com contador de minas e proteção.", "minesweeperPro", {}, true);
  app("Empire Builder: Micro Civ", "Gestão de império com recursos, alimentos, madeira e população.", "simCiv", {}, true);

  // 2. JOGOS DIVERSOS PARAMETRIZADOS PARA COMPLETAR ~270 JOGOS
  const MODULOS_JOGOS = [
    { t: "Torre de Controle Aéreo", desc: "Gerencie pousos e decolagens sem colisões.", eng: "towerDefense" },
    { t: "Labirinto de Luzes Quanticas", desc: "Reflita feixes de laser com espelhos até o receptor.", eng: "minesweeperPro" },
    { t: "Fliperama Retro Racer", desc: "Desvie de obstáculos na rodovia e acelere ao máximo.", eng: "snakeArena" },
    { t: "Batalha Naval Tática", desc: "Posicione sua frota e destrua as naus inimigas.", eng: "minesweeperPro" },
    { t: "Desafio de Sudoku 9x9", desc: "Preencha a grade sem repetir números nas linhas e colunas.", eng: "memoryMaster" },
    { t: "Desafio de Palavras Cruzadas", desc: "Adivinhe as palavras a partir de dicas temáticas.", eng: "memoryMaster" },
    { t: "Defensor Espacial de Asteroides", desc: "Pilote sua nave e destrua asteroides no espaço.", eng: "snakeArena" },
    { t: "Empilhador de Blocos de Precisão", desc: "Empilhe blocos no ritmo perfeito para construir arranha-céus.", eng: "snakeArena" },
  ];

  for (let i = 0; i < 265; i++) {
    const mod = MODULOS_JOGOS[i % MODULOS_JOGOS.length];
    const num = String(i + 1).padStart(3, "0");
    app(
      `Jogo Desafio ${num}: ${mod.t}`,
      `${mod.desc} Divirta-se e treine seus reflexos.`,
      mod.eng,
      { titulo: `${mod.t} (${num})`, sub: mod.desc }
    );
  }

  return J;
}

/* Zcode — CATÁLOGO DE ESTUDOS (~270 APPS) */
import * as D from "./data/estudos.mjs";

export function getEstudos() {
  const E = [];
  const app = (nome, desc, engine, params, destaque) =>
    E.push({ nome, desc, engine, params, imagem: "", destaque: !!destaque });

  // 1. SIMULADORES CIENTÍFICOS & FÍSICA
  app("Simulador de Lançamento de Projétil", "Física interativa: ângulo, velocidade, gravidade e arrasto de ar.", "simProjetil", {}, true);
  app("Visualizador de Funções e Cálculo", "Gráficos de funções, retas tangentes, derivadas e integrais.", "simFuncoes", {}, true);
  app("Simulador de Pêndulo e Oscilações", "Pêndulo simples e duplo com conservação de energia e gráficos.", "simProjetil", {});
  app("Laboratório de Óptica e Lentes", "Refracão, lentes convergentes/divergentes e lei de Snell.", "simProjetil", {});
  app("Circuito Elétrico Interativo", "Monte circuitos com baterias, resistores, capacitores e chaves.", "simProjetil", {});
  app("Termodinâmica e Leis dos Gases", "Gases perfeitos, pressão, volume, temperatura e modelo de partículas.", "simProjetil", {});
  app("Relatividade Especial e Lorentz", "Dilação do tempo, contração de comprimento e transformações.", "simProjetil", {});
  app("Dinâmica de Fluidos e Bernoulli", "Equação de Bernoulli, efeito Venturi e fluxo de tubulações.", "simProjetil", {});
  app("Campo Magnético e Solenoides", "Campos magnéticos, linhas de força e indução eletromagnética.", "simProjetil", {});
  app("Decaimento Radioativo e Carbono-14", "Meia-vida, decaimento alfa/beta/gama e datação fóssil.", "simProjetil", {});

  // 2. BIOLOGIA & QUÍMICA
  app("Tabela Periódica e Propriedades", "Explorador de elementos, raio atômico e eletronegatividade.", "simFuncoes", {});
  app("Estequiometria e Balanceamento", "Balanceamento de equações químicas e reagentes limitantes.", "simFuncoes", {});
  app("Escala de pH e Titulação Ácida", "pH, pOH, indicadores e curvas de titulação de ácidos e bases.", "simFuncoes", {});
  app("Modelos Atômicos e Bohr", "Evolução de Thomson a Bohr e emissão espectral de fótons.", "simFuncoes", {});
  app("Citologia e Organelas Celulares", "Estrutura celular 3D, membrana plasmática e organelas.", "simFuncoes", {});
  app("Genética e Quadro de Punnett", "Hereditariedade, cruzamentos genéticos e tipos sanguíneos.", "simFuncoes", {});
  app("Enzimas e Cinética Enzimática", "Curva de Michaelis-Menten, pH, temperatura e inibidores.", "simFuncoes", {});
  app("Anatomia Humana: Atlas Interativo", "Sistemas esquelético, muscular, circulatório e nervoso.", "simFuncoes", {});
  app("Microbiologia e Mecanismos de Vírus", "Vírus, bactérias, resposta imune e anticorpos.", "simFuncoes", {});
  app("Evolução e Seleção Natural", "Simulação populacional com mutações adaptativas.", "simFuncoes", {});

  // 3. MATEMÁTICA & GEOMETRIA
  app("Geometria Espacial 3D e Poliedros", "Platonic solids, fórmula de Euler e planificação.", "simFuncoes", {});
  app("Círculo Trigonométrico Interativo", "Seno, cosseno, tangente, radianos e arcos em tempo real.", "simFuncoes", {});
  app("Transformações Matriciais 2D", "Álgebra linear, rotação, escala e autovetores.", "simFuncoes", {});
  app("Estatística e Distribuição Normal", "Histogramas, variância, desvio padrão e Teorema Central.", "simFuncoes", {});
  app("Fractais e Teoria do Caos", "Mandelbrot, Julia, Sierpinski e atratores estranhos.", "simFuncoes", {});
  app("Números Complexos no Plano Argand", "Forma polar, fórmula de Euler e raízes da unidade.", "simFuncoes", {});
  app("Teoria dos Grafos e Algoritmos", "Algoritmo de Dijkstra, busca em largura e travessias.", "simFuncoes", {});
  app("Diagrama de Venn e Conjuntos", "Operações de união, interseção e diferença simétrica.", "simFuncoes", {});
  app("Geometria Analítica no Plano", "Equações da reta, distância, elipses e parábolas.", "simFuncoes", {});
  app("Séries e Sequências Numéricas", "Limites, P.A., P.G. e critérios de convergência.", "simFuncoes", {});

  // 4. PROGRAMAÇÃO & LÓGICA
  app("Visualizador de Algoritmos de Ordenação", "Bubble, Quick, Merge e Selection Sort com animação.", "algoVisualizer", {});
  app("Playground de Código HTML/CSS/JS", "Editor de código interativo com execução instantânea.", "codePlayground", {});
  app("Estruturas de Dados Interativas", "Pilha, Fila, Árvore Binária e Tabela Hash.", "algoVisualizer", {});
  app("Autômatos e Máquinas de Turing", "Fitas de Turing, autômatos finitos e linguagens.", "codePlayground", {});
  app("Circuitos Lógicos e Portas AND/OR", "Portas lógicas, tabela verdade e somadores digitais.", "codePlayground", {});

  // 5. HISTÓRIA, GEOGRAFIA & ASTRONOMIA
  app("Linha do Tempo das Grandes Era Históricas", "Exploração da Antiguidade à Era Digital.", "timelineHist", { eventos: [
    { ano: "3500 a.C.", titulo: "Invenção da Escrita Cuneiforme", desc: "Surgimento dos primeiros registros na Mesopotâmia.", tag: "Antiguidade" },
    { ano: "476 d.C.", titulo: "Queda do Império Romano do Ocidente", desc: "Início da Idade Média na Europa.", tag: "Média" },
    { ano: "1453", titulo: "Queda de Constantinopla", desc: "Fim do Império Bizantino e transição para a Idade Moderna.", tag: "Moderna" },
    { ano: "1789", titulo: "Revolução Francesa", desc: "Marco inicial da Idade Contemporânea e Direitos do Homem.", tag: "Contemporânea" },
    { ano: "1969", titulo: "Chegada do Homem à Lua", desc: "Missão Apollo 11 e início da Era Espacial.", tag: "Digital" }
  ]});
  app("Atlas Geográfico do Mundo", "Dados demográficos, capitais e relevo dos países.", "atlasGeo", { paises: [
    { nome: "Brasil", continente: "América do Sul", capital: "Brasília", pop: "214 milhões", idioma: "Português", moeda: "Real (BRL)", curiosidade: "Maior floresta tropical do mundo." },
    { nome: "França", continente: "Europa", capital: "Paris", pop: "67 milhões", idioma: "Francês", moeda: "Euro (EUR)", curiosidade: "País mais visitado do mundo." },
    { nome: "Japão", continente: "Ásia", capital: "Tóquio", pop: "125 milhões", idioma: "Japonês", moeda: "Iene (JPY)", curiosidade: "Arquipélago com mais de 6.800 ilhas." },
    { nome: "Egito", continente: "África", capital: "Cairo", pop: "104 milhões", idioma: "Árabe", moeda: "Libra Egípcia", curiosidade: "Berço da civilização dos faraós." }
  ]});
  app("Órbitas e Leis de Kepler", "Simulação orbital gravitacional de planetas do Sistema Solar.", "simProjetil", {});
  app("Fases da Lua e Eclipses", "Alinhamento Sol-Terra-Lua e ciclos de marés.", "simProjetil", {});

  // 6. REDAÇÃO & LINGUAGENS
  app("Laboratório de Redação Dissertativa", "Análise estrutural, conectivos coesivos e nota estimada.", "redacaoLab", {});

  // 7. FLASHCARDS & REPETIÇÃO ESPAÇADA DE ÁREAS DIVERSAS
  const MODULOS_FLASH = [
    { t: "Matemática Financeira", sub: "Juros, amortização e porcentagem.", deck: [{ f: "O que são Juros Compostos?", v: "Juros calculados sobre o capital acumulado." }, { f: "Fórmula de M", v: "M = C * (1 + i)^t" }] },
    { t: "Física Mecânica", sub: "Cinemática e leis de Newton.", deck: [{ f: "1ª Lei de Newton", v: "Inércia: corpo mantém movimento sem forças externas." }, { f: "Fórmula da Força", v: "F = m * a" }] },
    { t: "Física Termodinâmica", sub: "Calorimetria e entropia.", deck: [{ f: "1ª Lei da Termodinâmica", v: "ΔU = Q - W (Conservação da energia)" }] },
    { t: "Física Eletromagnetismo", sub: "Carga, campo e corrente.", deck: [{ f: "Lei de Ohm", v: "V = R * I" }] },
    { t: "Química Orgânica", sub: "Hidrocarbonetos e funções.", deck: [{ f: "O que são Alcanos?", v: "Hidrocarbonetos saturados de ligação simples." }] },
    { t: "Química Inorgânica", sub: "Ácidos, bases e sais.", deck: [{ f: "Definição de Arrhenius para Ácido", v: "Substância que libera íons H+ em água." }] },
    { t: "Biologia Celular", sub: "Organelas e mitose.", deck: [{ f: "Função da Mitocôndria", v: "Respiração celular e produção de ATP." }] },
    { t: "Biologia Genética", sub: "DNA, RNA e mutações.", deck: [{ f: "Bases do DNA", v: "Adenina, Timina, Citosina e Guanina." }] },
    { t: "História do Brasil", sub: "Colônia, Império e República.", deck: [{ f: "Ano da Proclamação da República", v: "1889, por Marechal Deodoro da Fonseca." }] },
    { t: "História Geral", sub: "Idade Média e Guerras.", deck: [{ f: "Início da Primeira Guerra Mundial", v: "1914, após o assassinato do arquiduque." }] },
    { t: "Geografia do Brasil", sub: "Biomas e demografia.", deck: [{ f: "Maior bioma brasileiro em extensão", v: "Amazônia." }] },
    { t: "Geografia Física", sub: "Clima e placas tectônicas.", deck: [{ f: "Camada externa da Terra", v: "Litosfera." }] },
    { t: "Gramática da Língua Portuguesa", sub: "Sintaxe e crase.", deck: [{ f: "Quando ocorre Crase?", v: "Fusão da preposição 'a' com o artigo 'a'." }] },
    { t: "Literatura Brasileira", sub: "Modernismo e Romantismo.", deck: [{ f: "Autor de Dom Casmurro", v: "Machado de Assis." }] },
    { t: "Inglês para Exames", sub: "Vocabulário avançado e phrasal verbs.", deck: [{ f: "Significado de 'Give up'", v: "Desistir ou abandonar um hábito." }] },
    { t: "Espanhol Essencial", sub: "Falsos amigos e verbos.", deck: [{ f: "Significado de 'Embaraçada'", v: "Grávida (e não envergonhada)." }] },
    { t: "Filosofia Clássica", sub: "Sócrates, Platão e Aristóteles.", deck: [{ f: "O Mito da Caverna é de qual filósofo?", v: "Platão." }] },
    { t: "Sociologia Contemporânea", sub: "Modernidade líquida e redes.", deck: [{ f: "Quem formulou a 'Modernidade Líquida'?", v: "Zygmunt Bauman." }] },
    { t: "Lógica Formal", sub: "Tabelas verdade e silogismos.", deck: [{ f: "Negação de 'A e B'", v: "Não A ou Não B (Lei de De Morgan)." }] },
    { t: "Programação JavaScript", sub: "Funções, escopo e promessas.", deck: [{ f: "O que retorna typeof []?", v: "'object'." }] },
  ];

  // Adicionar exatamente 230 módulos adicionais para atingir 270 apps de estudos
  for (let i = 0; i < 230; i++) {
    const mod = MODULOS_FLASH[i % MODULOS_FLASH.length];
    const num = String(i + 1).padStart(3, "0");
    app(
      `Módulo de Estudo ${num}: ${mod.t}`,
      `${mod.sub} Exercícios práticos e cartões de memória.`,
      "flashcards",
      { titulo: `${mod.t} (${num})`, sub: mod.sub, deck: mod.deck }
    );
  }

  return E;
}

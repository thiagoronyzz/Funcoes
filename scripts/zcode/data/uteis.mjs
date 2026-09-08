/* Zcode — dados: Úteis */

/* Conversões: base = 1ª unidade. fator = quanto vale 1 unidade na base */
export const UNIDADES = {
  comprimento: {
    rotulo: "Comprimento",
    un: [
      ["metro (m)", 1], ["quilômetro (km)", 1000], ["centímetro (cm)", 0.01],
      ["milímetro (mm)", 0.001], ["pés (ft)", 0.3048], ["polegadas (in)", 0.0254],
      ["milhas (mi)", 1609.344], ["milha náutica (nmi)", 1852], ["jarda (yd)", 0.9144],
    ],
  },
  massa: {
    rotulo: "Massa",
    un: [
      ["quilograma (kg)", 1], ["grama (g)", 0.001], ["miligrama (mg)", 0.000001],
      ["tonelada (t)", 1000], ["libra (lb)", 0.45359237], ["onça (oz)", 0.028349523],
      ["stone (st)", 6.35029318],
    ],
  },
  area: {
    rotulo: "Área",
    un: [
      ["m² (metro quadrado)", 1], ["km²", 1000000], ["cm²", 0.0001],
      ["hectare (ha)", 10000], ["acre", 4046.8564224], ["ft²", 0.09290304],
      ["milha quadrada (mi²)", 2589988.110336], ["alqueire (sul)", 48400],
    ],
  },
  volume: {
    rotulo: "Volume",
    un: [
      ["litro (L)", 0.001], ["mililitro (mL)", 0.000001], ["metro cúbico (m³)", 1],
      ["cm³", 0.000001], ["galão (EUA)", 0.003785411784], ["onça fluida (EUA)", 0.0000295735296],
      ["xícara (EUA)", 0.0002365882365], ["barrel (petróleo)", 0.158987294928],
    ],
  },
  velocidade: {
    rotulo: "Velocidade",
    un: [
      ["km/h", 0.2777777778], ["m/s", 1], ["mph (milhas/h)", 0.44704],
      ["nós", 0.5144444444], ["Mach (ao nível do mar)", 340.29],
    ],
  },
  tempo: {
    rotulo: "Tempo",
    un: [
      ["segundo (s)", 1], ["minuto (min)", 60], ["hora (h)", 3600],
      ["dia", 86400], ["semana", 604800], ["mês (média)", 2629800], ["ano (média)", 31557600],
    ],
  },
  dados: {
    rotulo: "Dados",
    un: [
      ["byte (B)", 1], ["kilobyte (KB)", 1000], ["megabyte (MB)", 1000000],
      ["gigabyte (GB)", 1000000000], ["terabyte (TB)", 1000000000000],
      ["kibibyte (KiB)", 1024], ["mebibyte (MiB)", 1048576], ["gibibyte (GiB)", 1073741824],
    ],
  },
  temperatura: {
    rotulo: "Temperatura",
    un: [["celsius (°C)", 0], ["fahrenheit (°F)", 1], ["kelvin (K)", 2]],
  },
};

export const CIDADES = [
  ["São Paulo, Brasil", "America/Sao_Paulo"],
  ["Lisboa, Portugal", "Europe/Lisbon"],
  ["Nova York, EUA", "America/New_York"],
  ["Los Angeles, EUA", "America/Los_Angeles"],
  ["Londres, Reino Unido", "Europe/London"],
  ["Paris, França", "Europe/Paris"],
  ["Berlim, Alemanha", "Europe/Berlin"],
  ["Toquio, Japão", "Asia/Tokyo"],
  ["Pequim, China", "Asia/Shanghai"],
  ["Dubai, EAU", "Asia/Dubai"],
  ["Sydney, Austrália", "Australia/Sydney"],
  ["Bombaim, Índia", "Asia/Kolkata"],
  ["Toronto, Canadá", "America/Toronto"],
  ["Cidade do México, México", "America/Mexico_City"],
  ["Buenos Aires, Argentina", "America/Argentina/Buenos_Aires"],
  ["Cairo, Egito", "Africa/Cairo"],
  ["Moscou, Rússia", "Europe/Moscow"],
  ["Hong Kong, China", "Asia/Hong_Kong"],
];

export const FRASES = [
  ["A persistência é o caminho do êxito.", "Charles Chaplin"],
  ["O sucesso é a soma de pequenos esforços repetidos dia após dia.", "Robert Collier"],
  ["A simplicidade é a sofisticação suprema.", "Leonardo da Vinci"],
  ["Nós somos aquilo que fazemos repetidamente. Excelência, então, não é um ato, mas um hábito.", "Aristóteles"],
  ["A educação é a arma mais poderosa que você pode usar para mudar o mundo.", "Nelson Mandela"],
  ["Seja a mudança que você quer ver no mundo.", "Mahatma Gandhi"],
  ["O melhor jeito de prever o futuro é inventando-o.", "Alan Kay"],
  ["Primeiro resolvamos o problema. Depois, escrevamos o código.", "John Johnson"],
  ["A mente que se abre a uma nova ideia jamais voltará ao seu tamanho original.", "Albert Einstein"],
  ["Você não pode prever o futuro, mas pode plantar as sementes para ele.", "Robin Sharma"],
  ["Disciplina é a ponte entre metas e realizações.", "Jim Rohn"],
  ["Fale pouco, ouça muito e observe tudo.", "Provérbio chinês"],
  ["O fracasso é apenas o caminho para a grandeza.", "Maya Angelou"],
  ["Quem tem um porquê para viver pode suportar quase qualquer como.", "Friedrich Nietzsche"],
  ["A imaginação é mais importante que o conhecimento.", "Albert Einstein"],
  ["Não conte os dias, faça os dias contarem.", "Muhammad Ali"],
  ["Todo grande amor começa com uma decisão corajosa.", "Provérbio anônimo"],
  ["O tempo é igual para todos: quem cuida, multiplica.", "Anônimo"],
  ["Pequenos passos, todos os dias.", "Anônimo"],
  ["O difícil dura pouco.", "Provérbio"],
  ["Estude como se a sua vida dependesse disso, porque depende.", "Anônimo"],
  ["Feito é melhor que perfeito.", "Sheryl Sandberg"],
  ["Ação cura o medo.", "Anônimo"],
  ["Grandes realizações são possíveis quando as pessoas se importam.", "Malala Yousafzai"],
];

export const PALAVRAS_SENHA = [
  "sol", "lua", "rio", "flor", "vento", "fogo", "pedra", "nuvem", "estrela", "mar",
  "árvore", "chuva", "montanha", "areia", "folha", "raiz", "céu", "terra", "luz", "sombra",
  "coração", "sonho", "força", "calma", "ritmo", "eco", "porta", "chave", "caminho", "destino",
  "tempo", "memória", "espaço", "silêncio", "raio", "trovão", "neve", "gelo", "brasa", "cinza",
  "abril", "outono", "verão", "inverno", "manhã", "noite", "poente", "alvorada", "maré", "corrente",
  "colina", "vale", "trilha", "horizonte", "bússola", "mapa", "nave", "vela", "ancora", "farol",
];

export const NOMES_PERSONAGEM = {
  silabas: ["Ka", "Vor", "Zar", "Nyx", "Tha", "Bel", "Cor", "Dra", "Elo", "Fen", "Gal", "Hel", "Ira", "Jor", "Kal", "Lun", "Mor", "Nor", "Oru", "Pel", "Qua", "Rin", "Sol", "Tar", "Umb", "Val", "Wyn", "Xan", "Yor", "Zev"],
  finais: ["ar", "ion", "eth", "os", "a", "us", "yn", "is", "or", "el"],
  classes: ["Mago", "Guerreira", "Arqueiro", "Ferreira", "Batedora", "Clériga", "Ladino", "Bárbara", "Alquimista", "Druida"],
  origens: ["das Cinzas", "do Vale", "de Ferro", "da Meia-Noite", "dos Ventos", "do Clã Cinza", "da Torre", "do Mar Profundo", "do Inverno", "da Estrela Cadente"],
};

export const CUPOM_ESPORTES = ["futebol", "vôlei", "basquete", "tênis", "natação", "atletismo"];

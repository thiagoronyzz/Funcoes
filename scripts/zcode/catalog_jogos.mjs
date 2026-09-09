/* Zcode — CATÁLOGO DE JOGOS (270 títulos originais)
   Cada linha: [nome, descrição, engine, mundo temático].
   Gerado a partir da lista oficial de jogos da plataforma. */

/* ── mundos temáticos: cada engine lê o que precisa deste bloco ── */
export const MUNDOS = {
  agua:    { heroi:"💧", perigo:"🔥", item:"🫧", inimigo:"🌵", medidor:"Umidade", coleta:"Gotas", set:["💧","🌊","🫧","🐟","🌧️","🧊","⛵","🐠"] },
  arte:    { heroi:"🎨", perigo:"🕳️", item:"🖼️", inimigo:"🗿", medidor:"Curadoria", coleta:"Obras", set:["🎨","🖼️","🗿","🏛️","🖌️","📜","🎭","🕯️"] },
  espaco:  { heroi:"🚀", perigo:"☄️", item:"⭐", inimigo:"👾", medidor:"Combustível", coleta:"Cargas", set:["🚀","🛰️","🌕","⭐","👾","🪐","☄️","🛸"] },
  cidade:  { heroi:"🚦", perigo:"🚗", item:"🔧", inimigo:"🚧", medidor:"Ordem", coleta:"Reparos", set:["🏙️","🚦","🚌","🏗️","🌆","🚧","🏢","🛣️"] },
  fantasma:{ heroi:"👻", perigo:"🕯️", item:"🔮", inimigo:"💀", medidor:"Assombro", coleta:"Almas", set:["👻","💀","🕯️","🔮","⚰️","🕸️","🌑","🪦"] },
  monstro: { heroi:"🧌", perigo:"⚔️", item:"🍖", inimigo:"👹", medidor:"Domínio", coleta:"Criaturas", set:["🧌","👹","🐉","👾","🦑","🧟","🦇","🐺"] },
  dragao:  { heroi:"🐉", perigo:"🏹", item:"💎", inimigo:"🛡️", medidor:"Fogo", coleta:"Escamas", set:["🐉","🔥","🛡️","⚔️","🏰","💎","🥚","🏹"] },
  comida:  { heroi:"🍳", perigo:"🔥", item:"🥕", inimigo:"🍲", medidor:"Sabor", coleta:"Pratos", set:["🍞","🍲","🥕","🍷","🍰","☕","🌶️","🧄"] },
  planta:  { heroi:"🌱", perigo:"🐛", item:"💧", inimigo:"🌵", medidor:"Vida", coleta:"Brotos", set:["🌱","🌳","🌿","🌺","🍄","🌵","🪴","🌻"] },
  luz:     { heroi:"🔦", perigo:"🌑", item:"✨", inimigo:"🕳️", medidor:"Luz", coleta:"Faíscas", set:["💡","🔦","✨","🕯️","🌟","🔆","🌈","⚡"] },
  som:     { heroi:"🎵", perigo:"🔇", item:"🔔", inimigo:"📢", medidor:"Ressonância", coleta:"Notas", set:["🎵","🎶","🔔","🎼","📻","🎺","🥁","🎻"] },
  tempo:   { heroi:"⏳", perigo:"⌛", item:"🕰️", inimigo:"🌀", medidor:"Cronos", coleta:"Segundos", set:["⏳","🕰️","⌛","📅","🔄","🌀","⏰","🗓️"] },
  correio: { heroi:"✉️", perigo:"🌪️", item:"📦", inimigo:"🚫", medidor:"Confiança", coleta:"Entregas", set:["✉️","📦","📮","🕊️","🗺️","📬","🚚","🏷️"] },
  mar:     { heroi:"🐟", perigo:"🦈", item:"🐚", inimigo:"🌊", medidor:"Maré", coleta:"Peixes", set:["🐟","🐙","🦀","🐬","🐚","⚓","🌊","🐳"] },
  ceu:     { heroi:"🎈", perigo:"🌩️", item:"☁️", inimigo:"🌪️", medidor:"Altitude", coleta:"Nuvens", set:["☁️","🎈","🌈","🌤️","🌪️","🪁","🕊️","🌩️"] },
  livro:   { heroi:"📖", perigo:"🕳️", item:"🔖", inimigo:"🗝️", medidor:"Silêncio", coleta:"Livros", set:["📖","📚","🔖","🗝️","🕯️","📜","✒️","🧾"] },
  mente:   { heroi:"🧠", perigo:"😱", item:"💭", inimigo:"🌫️", medidor:"Lucidez", coleta:"Memórias", set:["🧠","💭","🌙","😴","🔮","🫧","🌫️","✨"] },
  maquina: { heroi:"🤖", perigo:"⚡", item:"⚙️", inimigo:"🔩", medidor:"Energia", coleta:"Peças", set:["🤖","⚙️","🔩","🔧","🔋","💾","🛠️","📡"] },
  bicho:   { heroi:"🐌", perigo:"🐦", item:"🍃", inimigo:"🕷️", medidor:"Instinto", coleta:"Trilhas", set:["🐌","🐜","🐝","🦋","🐞","🐛","🕷️","🦗"] },
  fogo:    { heroi:"🌋", perigo:"🔥", item:"🪨", inimigo:"💨", medidor:"Calor", coleta:"Erupções", set:["🌋","🔥","🪨","💨","🌡️","🧯","☄️","⛏️"] },
  sombra:  { heroi:"🕴️", perigo:"🌑", item:"🪞", inimigo:"👥", medidor:"Contorno", coleta:"Sombras", set:["🕴️","🌑","🪞","👥","🖤","🕶️","🌘","🎭"] },
  papel:   { heroi:"📄", perigo:"✂️", item:"📐", inimigo:"🗑️", medidor:"Dobras", coleta:"Folhas", set:["📄","✂️","📐","🧻","📦","🖇️","📎","🗞️"] },
  reino:   { heroi:"🤴", perigo:"⚔️", item:"👑", inimigo:"🛡️", medidor:"Prestígio", coleta:"Súditos", set:["👑","🏰","⚔️","🛡️","🐎","🏹","🤴","🗡️"] },
  magia:   { heroi:"🧙", perigo:"💥", item:"🪄", inimigo:"📕", medidor:"Mana", coleta:"Feitiços", set:["🧙","🪄","🔮","📕","✨","🧪","🕯️","🌟"] },
  casa:    { heroi:"🏠", perigo:"🌪️", item:"🔑", inimigo:"🚪", medidor:"Aconchego", coleta:"Cômodos", set:["🏠","🚪","🔑","🪟","🛋️","🧹","🕯️","🪑"] },
  brinq:   { heroi:"🧸", perigo:"🤖", item:"🎁", inimigo:"🪀", medidor:"Alegria", coleta:"Brinquedos", set:["🧸","🪀","🎁","🎠","🧩","🪁","🎲","🚂"] },
  estrela: { heroi:"⭐", perigo:"🌑", item:"✨", inimigo:"🌠", medidor:"Brilho", coleta:"Estrelas", set:["⭐","🌟","🌠","🌌","🌙","✨","🔭","🪐"] },
  mineral: { heroi:"💎", perigo:"⛏️", item:"🪨", inimigo:"🕳️", medidor:"Pureza", coleta:"Cristais", set:["💎","🪨","⛏️","🧱","💠","🗿","⚒️","🔶"] },
  medico:  { heroi:"🩺", perigo:"🦠", item:"💊", inimigo:"🤒", medidor:"Saúde", coleta:"Pacientes", set:["🩺","💊","🧪","🩹","🦠","🌡️","🧬","🚑"] },
  mercado: { heroi:"🏷️", perigo:"📉", item:"💰", inimigo:"🧾", medidor:"Crédito", coleta:"Moedas", set:["💰","🏷️","📦","🧾","⚖️","📈","🪙","🛒"] },
  festa:   { heroi:"🎉", perigo:"😴", item:"🎊", inimigo:"🕺", medidor:"Ânimo", coleta:"Convidados", set:["🎉","🎊","🎈","🕺","🍰","🎁","🪩","🎺"] },
  roupa:   { heroi:"👕", perigo:"🧦", item:"👟", inimigo:"🧥", medidor:"Estilo", coleta:"Peças", set:["👕","👖","🧦","👟","🧥","🎩","👗","🧤"] },
  aves:    { heroi:"🕊️", perigo:"🐈", item:"🌾", inimigo:"🪶", medidor:"Bando", coleta:"Aves", set:["🕊️","🦅","🦜","🐦","🪶","🥚","🪺","🦉"] },
  deus:    { heroi:"🛐", perigo:"⚡", item:"🕯️", inimigo:"🌪️", medidor:"Fé", coleta:"Milagres", set:["🛐","⚡","🔱","🕯️","🏛️","☁️","🌟","📜"] },
  espelho: { heroi:"🪞", perigo:"💢", item:"🔍", inimigo:"🌀", medidor:"Nitidez", coleta:"Reflexos", set:["🪞","🔍","💠","🌀","🧊","🖼️","👁️","✨"] },
  porta:   { heroi:"🚪", perigo:"🔒", item:"🗝️", inimigo:"🕳️", medidor:"Passagem", coleta:"Portas", set:["🚪","🗝️","🔒","🚧","🏚️","🪜","🕳️","🧭"] },
  trem:    { heroi:"🚂", perigo:"🪨", item:"🛤️", inimigo:"🚧", medidor:"Trilhos", coleta:"Vagões", set:["🚂","🛤️","🚋","🚉","🎫","🚧","⛏️","🗺️"] },
  ilha:    { heroi:"🏝️", perigo:"🌊", item:"🥥", inimigo:"🦀", medidor:"Terra firme", coleta:"Ilhas", set:["🏝️","🌴","🥥","⛵","🦀","🗺️","🐚","🌊"] },
  lua:     { heroi:"🌙", perigo:"☄️", item:"🌕", inimigo:"👽", medidor:"Gravidade", coleta:"Crateras", set:["🌙","🌕","🌑","🚀","👽","🪐","⭐","🛰️"] },
};

export const LISTA_JOGOS = [
  ["A Última Gota", "Controle uma gota d’água tentando atravessar um deserto antes de evaporar.", "travessia", "agua"],
  ["Museu Vivo", "As obras de arte mudam de lugar e precisam ser reorganizadas.", "ordenar", "arte"],
  ["Correio Lunar", "Entregue cartas entre colônias espalhadas pela Lua.", "travessia", "correio"],
  ["Rei dos Pombos", "Conquiste uma cidade liderando bandos de pombos.", "voo", "aves"],
  ["Elevador Infinito", "Suba por andares impossíveis, cada um com uma regra diferente.", "subida", "cidade"],
  ["Jardineiro de Monstros", "Cultive criaturas perigosas em um jardim mágico.", "cultivo", "planta"],
  ["Cozinha Temporal", "Prepare pratos usando ingredientes de épocas diferentes.", "atendimento", "comida"],
  ["Cidade de Papel", "Construa uma metrópole dobrando folhas e recortando ruas.", "construir", "papel"],
  ["O Último Semáforo", "Controle o trânsito de uma cidade durante um apagão.", "gestao", "cidade"],
  ["Sombras Alugadas", "Empreste sua sombra para pessoas que precisam dela.", "iluminar", "sombra"],
  ["Vulcão Particular", "Administre uma ilha usando um vulcão como fonte de energia.", "gestao", "fogo"],
  ["Pescador de Estrelas", "Pesque estrelas cadentes e transforme-as em constelações.", "gancho", "estrela"],
  ["Hotel dos Fantasmas", "Hospede espíritos e satisfaça suas exigências sobrenaturais.", "atendimento", "fantasma"],
  ["A Cidade Dorme", "Resolva problemas urbanos enquanto todos estão dormindo.", "gestao", "cidade"],
  ["Sapatos Perdidos", "Encontre sapatos espalhados e descubra as histórias de seus donos.", "triagem", "roupa"],
  ["Dragão Carteiro", "Entregue encomendas voando por reinos em guerra.", "travessia", "correio"],
  ["Biblioteca Labirinto", "Procure livros em uma biblioteca que se reorganiza sozinha.", "labirinto", "livro"],
  ["Robô Jardineiro", "Replante uma floresta em um planeta abandonado.", "cultivo", "planta"],
  ["Banquete dos Deuses", "Organize refeições capazes de agradar divindades diferentes.", "atendimento", "comida"],
  ["Detetive de Sonhos", "Investigue crimes dentro dos sonhos de suspeitos.", "investigacao", "mente"],
  ["Corrida de Caracóis", "Treine caracóis com habilidades e pistas variadas.", "corrida", "bicho"],
  ["Ossos & Ossadas", "Monte esqueletos para resolver enigmas arqueológicos.", "deslizar", "mineral"],
  ["Fazenda no Asteroide", "Cultive alimentos em pequenos corpos espaciais.", "travessia", "espaco"],
  ["Tatuador de Dragões", "Crie tatuagens que concedem poderes às criaturas.", "defesa", "dragao"],
  ["Rádio Fantasma", "Apresente um programa para ouvintes mortos.", "atendimento", "fantasma"],
  ["Guarda-Chuva Real", "Proteja um monarca de chuvas mágicas perigosas.", "voo", "ceu"],
  ["Batalha de Almofadas", "Vença guerras noturnas usando travesseiros especiais.", "voo", "aves"],
  ["O Mundo ao Contrário", "Resolva desafios em uma cidade onde tudo funciona invertido.", "iluminar", "espelho"],
  ["Mercador de Memórias", "Compre, venda e combine lembranças de desconhecidos.", "investigacao", "mente"],
  ["Formigueiro Imperial", "Administre uma colônia de formigas em expansão.", "corrida", "bicho"],
  ["Monstro de Estimação", "Cuide de uma criatura que muda conforme suas emoções.", "cuidar", "monstro"],
  ["Pintor de Climas", "Pinte o céu para controlar o tempo de uma região.", "combinacao", "arte"],
  ["Trem Subterrâneo", "Construa linhas ferroviárias através de cavernas vivas.", "construir", "trem"],
  ["Cavaleiro Minúsculo", "Defenda uma casa vista do tamanho de um inseto.", "voo", "aves"],
  ["A Fábrica de Nuvens", "Produza nuvens com formatos e efeitos específicos.", "voo", "ceu"],
  ["Cemitério Sorridente", "Administre um cemitério onde os mortos querem diversão.", "atendimento", "fantasma"],
  ["Fuga do Aquário", "Ajude peixes a escapar de um aquário gigante.", "cuidar", "monstro"],
  ["Arqueólogo do Futuro", "Escave ruínas de uma civilização que ainda não existe.", "deslizar", "mineral"],
  ["Padeiro de Gigantes", "Faça pães enormes para alimentar criaturas colossais.", "atendimento", "comida"],
  ["O Relógio Vivo", "Conserte um relógio que altera a realidade.", "sequencia", "tempo"],
  ["Coletor de Risadas", "Recolha risadas para devolver alegria a uma cidade triste.", "ritmo", "som"],
  ["Guerra dos Guarda-Roupas", "Combine roupas para enfrentar inimigos temáticos.", "triagem", "roupa"],
  ["Zoológico de Criaturas Imaginárias", "Descubra, capture e cuide de animais impossíveis.", "cuidar", "monstro"],
  ["Mergulho no Café", "Explore um oceano formado dentro de uma xícara.", "atendimento", "comida"],
  ["O Último Vagalume", "Ilumine uma floresta escura evitando predadores.", "cultivo", "planta"],
  ["Prefeito por Um Dia", "Tome decisões rápidas para impedir o colapso urbano.", "gestao", "cidade"],
  ["Catedral de Areia", "Construa uma cidade antes que a maré a destrua.", "gancho", "mar"],
  ["Mágico Fracassado", "Use feitiços errados de forma criativa para vencer desafios.", "combinacao", "magia"],
  ["Piloto de Pipas", "Controle pipas em batalhas aéreas contra tempestades.", "voo", "ceu"],
  ["O Reino dos Botões", "Cada botão do cenário controla uma parte do mundo.", "gestao", "reino"],
  ["Contrabandista de Sonhos", "Transporte sonhos proibidos entre cidades.", "investigacao", "mente"],
  ["Batalha de Chefs", "Enfrente rivais usando receitas como ataques.", "atendimento", "comida"],
  ["A Casa Que Anda", "Explore e personalize uma casa com pernas.", "voo", "aves"],
  ["Detetive de Pegadas", "Resolva mistérios analisando rastros de criaturas.", "investigacao", "espelho"],
  ["Mergulhador de Lava", "Navegue por rios vulcânicos em uma armadura resistente.", "gestao", "fogo"],
  ["Rainha das Abelhas", "Expanda uma colmeia e negocie com outras espécies.", "cultivo", "planta"],
  ["O Mundo em Miniatura", "Proteja uma maquete que representa uma cidade real.", "defesa", "reino"],
  ["Colecionador de Ecos", "Grave sons antigos para reconstruir acontecimentos.", "ritmo", "som"],
  ["A Última Lanterna", "Atravesse uma cidade onde a escuridão ganha vida.", "voo", "aves"],
  ["Pintura Mortal", "Tudo que você pinta passa a existir, inclusive inimigos.", "combinacao", "arte"],
  ["Fantasma de Aluguel", "Assuste pessoas seguindo contratos e horários.", "atendimento", "fantasma"],
  ["Construtor de Pontes Temporais", "Ligue momentos diferentes da história.", "labirinto", "livro"],
  ["Banda de Monstros", "Monte um grupo musical com criaturas de estilos distintos.", "ritmo", "som"],
  ["A Ilha que Respira", "Sobreviva em uma ilha que muda conforme seus movimentos.", "travessia", "ilha"],
  ["Escola de Feitiços Domésticos", "Aprenda magia baseada em tarefas de casa.", "voo", "aves"],
  ["Caçador de Vulcões", "Fotografe erupções sem destruir o ecossistema.", "gestao", "fogo"],
  ["Mercado dos Gigantes", "Negocie recursos em uma cidade habitada por gigantes.", "negociar", "mercado"],
  ["Cavaleiro Sem Espada", "Derrote inimigos usando apenas objetos do ambiente.", "voo", "aves"],
  ["O Teatro Infinito", "Atue em peças que alteram o mundo conforme suas escolhas.", "escolhas", "festa"],
  ["Apicultor Espacial", "Produza mel em planetas com diferentes gravidades.", "travessia", "espaco"],
  ["Cidade de Vidro", "Construa estruturas sem quebrá-las durante terremotos.", "gestao", "cidade"],
  ["Piratas do Lago", "Comande um barco em um lago cheio de ilhas móveis.", "gancho", "mar"],
  ["O Último Dinossauro", "Proteja uma criatura pré-histórica em um mundo moderno.", "cuidar", "monstro"],
  ["Alquimista de Emoções", "Misture sentimentos para criar poções.", "combinacao", "magia"],
  ["Correio Subaquático", "Entregue mensagens em uma cidade no fundo do oceano.", "travessia", "correio"],
  ["Fábrica de Brinquedos Vivos", "Produza brinquedos que ganham personalidade.", "gestao", "maquina"],
  ["Médico de Monstros", "Cure criaturas com doenças fantásticas.", "cuidar", "monstro"],
  ["Caça ao Tesouro Invisível", "Use pistas sonoras para encontrar objetos que não podem ser vistos.", "combinacao", "trem"],
  ["Escultor de Montanhas", "Modele o terreno para guiar rios e cidades.", "empilhar", "mineral"],
  ["A Última Página", "Escape de um livro antes que a história termine.", "labirinto", "livro"],
  ["Cavaleiro da Lua", "Defenda diferentes fases lunares de criaturas invasoras.", "travessia", "espaco"],
  ["Restaurante para Vampiros", "Crie pratos que satisfaçam clientes mortos-vivos.", "atendimento", "comida"],
  ["O Carteiro do Tempo", "Entregue cartas antes que seus destinatários nasçam.", "travessia", "correio"],
  ["Fuga do Calendário", "Impeça os dias de desaparecerem do mundo.", "sequencia", "tempo"],
  ["Fazenda de Cristais", "Cultive cristais com propriedades diferentes.", "reflexo", "fantasma"],
  ["Batalha de Sombras", "Controle sua sombra para lutar contra outras.", "iluminar", "sombra"],
  ["A Vila dos Sussurros", "Descubra segredos ouvindo paredes e árvores.", "investigacao", "espelho"],
  ["Coletor de Marés", "Armazene água do mar para alimentar uma cidade.", "gancho", "mar"],
  ["Aventura no Guarda-Roupa", "Cada roupa transporta o personagem para um mundo.", "triagem", "roupa"],
  ["Coração Mecânico", "Conserte o coração de uma cidade-robô.", "construir", "maquina"],
  ["O Mundo dos Ímãs", "Resolva puzzles controlando forças magnéticas.", "iluminar", "maquina"],
  ["Professor de Dragões", "Eduque filhotes para diferentes profissões.", "defesa", "dragao"],
  ["Músico do Apocalipse", "Toque canções que alteram eventos globais.", "ritmo", "som"],
  ["O Último Elevadorista", "Transporte passageiros entre dimensões.", "subida", "cidade"],
  ["Pintor de Fantasmas", "Retrate espíritos para descobrir como morreram.", "combinacao", "arte"],
  ["Batalha de Sombras Chinesas", "Crie figuras de papel para enfrentar inimigos.", "construir", "papel"],
  ["A Cidade Flutuante", "Administre recursos em uma metrópole no céu.", "gestao", "cidade"],
  ["Colecionador de Cheiros", "Recrie aromas para solucionar crimes.", "investigacao", "espelho"],
  ["Fábrica de Arco-Íris", "Combine cores para produzir fenômenos climáticos.", "combinacao", "arte"],
  ["Ladrão de Segundos", "Roube tempo de inimigos para executar ações extras.", "negociar", "mercado"],
  ["A Última Semente", "Plante uma árvore capaz de reconstruir o planeta.", "cultivo", "planta"],
  ["Detetive de Espelhos", "Investigue crimes cometidos em realidades refletidas.", "investigacao", "espelho"],
  ["Capitão das Minhocas", "Comande túneis subterrâneos para salvar uma vila.", "corrida", "bicho"],
  ["Cozinheiro de Poções", "Prepare receitas que funcionam como feitiços.", "atendimento", "comida"],
  ["A Cidade Sem Som", "Resolva desafios usando apenas sinais visuais.", "voo", "aves"],
  ["Batalha de Balões", "Conquiste territórios flutuando sobre uma cidade.", "voo", "ceu"],
  ["Museu do Futuro", "Decida quais objetos de épocas ainda não vividas serão preservados.", "ordenar", "arte"],
  ["Arquiteto de Sonhos", "Construa ambientes dentro da mente de personagens.", "investigacao", "mente"],
  ["O Último Carteiro", "Entregue correspondências em um mundo abandonado.", "travessia", "correio"],
  ["Caverna dos Mil Caminhos", "Cada escolha altera o mapa permanentemente.", "labirinto", "livro"],
  ["Pastor de Nuvens", "Conduza nuvens para regiões que precisam de chuva.", "voo", "ceu"],
  ["O Relógio de Areia", "Inverta pequenos acontecimentos gastando areia mágica.", "sequencia", "tempo"],
  ["Gato Espião", "Infiltre-se em casas e reúna informações sem ser descoberto.", "investigacao", "espelho"],
  ["Guerra dos Ímãs", "Use polaridades para mover soldados e obstáculos.", "defesa", "reino"],
  ["Mestre dos Fantoches", "Controle personagens de madeira em um palco perigoso.", "escolhas", "festa"],
  ["A Biblioteca do Esquecimento", "Recupere livros que apagam memórias.", "labirinto", "livro"],
  ["Pequeno Deus", "Ajude uma civilização primitiva usando milagres limitados.", "gestao", "deus"],
  ["Tartaruga Mensageira", "Atravesse continentes carregando mensagens importantes.", "travessia", "correio"],
  ["A Cidade de Chocolate", "Administre uma cidade que derrete lentamente.", "atendimento", "comida"],
  ["Batalha de Receitas", "Combine ingredientes para criar ataques culinários.", "atendimento", "comida"],
  ["O Guardião do Eco", "Reproduza sons na ordem certa para abrir caminhos.", "ritmo", "som"],
  ["Explorador de Bolhas", "Viaje dentro de bolhas por ambientes perigosos.", "encontrar", "agua"],
  ["Fazenda de Robôs", "Plante circuitos e colha máquinas.", "cultivo", "planta"],
  ["Caçador de Relâmpagos", "Capture raios para alimentar uma invenção.", "tiro", "cidade"],
  ["Cemitério de Navios", "Recupere peças de embarcações naufragadas.", "atendimento", "fantasma"],
  ["O Menino Invisível", "Resolva problemas sem que ninguém consiga vê-lo.", "cobra", "monstro"],
  ["Reino dos Insetos", "Forme alianças entre espécies minúsculas.", "corrida", "bicho"],
  ["A Última Estátua", "Proteja uma estátua viva de colecionadores.", "investigacao", "espelho"],
  ["Trem Fantasma", "Transporte almas até suas estações finais.", "coleta", "fantasma"],
  ["Desenhista de Mapas", "O mapa criado por você altera o território real.", "labirinto", "livro"],
  ["A Cidade dos Mil Elevadores", "Escolha rotas para conectar pessoas e segredos.", "subida", "cidade"],
  ["Médico do Planeta", "Cure regiões contaminadas como se fossem pacientes.", "travessia", "espaco"],
  ["Cavaleiro de Papelão", "Lute em um mundo feito de materiais recicláveis.", "construir", "papel"],
  ["Oceano no Céu", "Navegue por mares suspensos entre nuvens.", "voo", "ceu"],
  ["Colecionador de Luas", "Reúna luas pequenas para iluminar planetas.", "gancho", "estrela"],
  ["A Casa dos Mil Quartos", "Cada quarto guarda uma realidade diferente.", "pares", "aves"],
  ["Construtor de Sonhos", "Venda sonhos personalizados a clientes.", "investigacao", "mente"],
  ["Batalha de Guarda-Chuvas", "Use correntes de vento para disputar telhados.", "desafioQuiz", "ceu"],
  ["O Último Faroleiro", "Mantenha um farol aceso para guiar criaturas marinhas.", "cuidar", "monstro"],
  ["Jornalista do Apocalipse", "Investigue acontecimentos enquanto o mundo termina.", "labirinto", "livro"],
  ["A Vila das Máscaras", "Troque máscaras para alterar habilidades e identidades.", "triagem", "roupa"],
  ["Mestre dos Relógios", "Construa mecanismos que sincronizam uma cidade.", "sequencia", "tempo"],
  ["Fuga da Geladeira", "Ajude alimentos vivos a escapar de uma cozinha.", "coleta", "comida"],
  ["O Reino das Meias", "Encontre pares perdidos e descubra um mundo oculto.", "triagem", "roupa"],
  ["Caçador de Cometas", "Persiga cometas usando uma nave adaptável.", "gancho", "estrela"],
  ["Pescaria Dimensional", "Pesque criaturas de universos paralelos.", "cuidar", "monstro"],
  ["A Cidade Invisível", "Revele construções usando luz e som.", "ritmo", "som"],
  ["Lojista de Maldições", "Venda maldições sob medida para clientes.", "tiro", "fantasma"],
  ["O Último Cacto", "Sobreviva e replante um deserto inteiro.", "cultivo", "planta"],
  ["Diretor de Monstros", "Filme criaturas reais em cenários perigosos.", "cuidar", "monstro"],
  ["Mecânico de Dragões", "Conserte asas, armaduras e motores de dragões.", "defesa", "dragao"],
  ["A Montanha que Anda", "Escale uma montanha que atravessa continentes.", "cobra", "aves"],
  ["Vendedor de Sombras", "Negocie sombras com propriedades especiais.", "coleta", "sombra"],
  ["Ritmo das Estações", "Controle o ciclo do ano por meio de música.", "ritmo", "som"],
  ["O Último Pirata do Espaço", "Roube tesouros de planetas abandonados.", "travessia", "espaco"],
  ["Jardim de Estrelas", "Plante sementes luminosas em constelações vazias.", "cultivo", "planta"],
  ["A Cidade em um Livro", "Explore páginas para encontrar personagens perdidos.", "labirinto", "livro"],
  ["Detetive de Nuvens", "Interprete formações para prever crimes.", "investigacao", "espelho"],
  ["Golem de Argila", "Modele seu corpo para adquirir habilidades diferentes.", "cuidar", "monstro"],
  ["Festa dos Mortos", "Organize uma celebração para fantasmas nostálgicos.", "empilhar", "fantasma"],
  ["O Relógio do Rei", "Conserte horas roubadas por um monarca.", "sequencia", "tempo"],
  ["A Última Asa", "Guie uma criatura voadora sem poder controlar seu voo diretamente.", "pares", "aves"],
  ["Mercado de Monstros", "Compre e venda criaturas com talentos raros.", "negociar", "mercado"],
  ["Mestre das Marés", "Altere o nível do mar para resolver enigmas costeiros.", "gancho", "mar"],
  ["O Hotel Entre Mundos", "Atenda hóspedes vindos de realidades incompatíveis.", "labirinto", "porta"],
  ["Cidade de Massinha", "Modele ruas e personagens durante a aventura.", "gestao", "cidade"],
  ["Caçador de Silêncios", "Capture áreas silenciosas para impedir uma invasão sonora.", "ritmo", "som"],
  ["A Fazenda dos Gigantes", "Cultive plantas enormes para alimentar titãs.", "cultivo", "planta"],
  ["Rato de Biblioteca", "Explore estantes como um labirinto cheio de armadilhas.", "labirinto", "livro"],
  ["O Último Sinal", "Reative torres de comunicação em um mundo isolado.", "construir", "maquina"],
  ["Guerra de Travesseiros Espaciais", "Dispute estações orbitais usando almofadas especiais.", "encontrar", "aves"],
  ["O Pintor de Portais", "Desenhe portas para acessar lugares inacessíveis.", "combinacao", "arte"],
  ["Coração de Cristal", "Proteja uma criatura que se quebra com emoções fortes.", "cuidar", "monstro"],
  ["O Mundo de Baixo", "Explore o subterrâneo de uma cidade invertida.", "iluminar", "espelho"],
  ["Apocalipse dos Brinquedos", "Sobreviva à revolta de brinquedos abandonados.", "coleta", "brinq"],
  ["A Última Receita", "Reúna ingredientes lendários para salvar uma vila.", "reflexo", "comida"],
  ["O Guardião dos Sonhos", "Impeça pesadelos de atravessarem para a realidade.", "desafioQuiz", "aves"],
  ["Correio dos Oceanos", "Entregue mensagens em garrafas usando correntes marítimas.", "travessia", "correio"],
  ["Arqueólogo de Memórias", "Escave lembranças enterradas em uma mente.", "investigacao", "mente"],
  ["Cavaleiro das Estações", "Use poderes diferentes conforme a estação do ano.", "defesa", "reino"],
  ["A Cidade dos Sinos", "Toque sinos para mudar o comportamento da população.", "ritmo", "som"],
  ["Vulcão Adormecido", "Construa uma civilização sem acordar o vulcão.", "gestao", "fogo"],
  ["Aventura de Um Minuto", "Cada fase dura exatamente sessenta segundos.", "investigacao", "mente"],
  ["O Último Astrônomo", "Reacenda estrelas apagadas por uma força desconhecida.", "gancho", "estrela"],
  ["Colecionador de Portas", "Encontre portas e instale-as em locais estratégicos.", "labirinto", "porta"],
  ["A Vila dos Clones", "Descubra quem é original em uma comunidade duplicada.", "tiro", "espelho"],
  ["Fazenda de Fantasmas", "Cultive espíritos para produzir energia ectoplásmica.", "cobra", "fantasma"],
  ["Mestre dos Labirintos", "Crie labirintos para impedir invasores.", "defesa", "reino"],
  ["O Som das Pedras", "Aprenda uma língua feita de vibrações minerais.", "ritmo", "som"],
  ["Cidade de Lata", "Recicle sucata para manter uma metrópole funcionando.", "gestao", "cidade"],
  ["O Último Mapa", "Complete um mapa enquanto o território desaparece.", "labirinto", "livro"],
  ["Batalha de Penas", "Comande aves usando diferentes tipos de penas.", "empilhar", "aves"],
  ["Reino das Correntes", "Viaje por correntes mágicas que conectam ilhas.", "pares", "ilha"],
  ["O Relógio do Cemitério", "Atrase ou acelere eventos sobrenaturais.", "escolhas", "fantasma"],
  ["Caçador de Tesouros Falsos", "Identifique relíquias falsas antes de vendê-las.", "ordenar", "deus"],
  ["A Casa na Tempestade", "Proteja uma casa que muda de cômodo durante furacões.", "encontrar", "aves"],
  ["O Último Teatro", "Mantenha uma companhia de atores viva em uma guerra.", "defesa", "reino"],
  ["Mago de Giz", "Desenhe símbolos no chão para lançar feitiços.", "combinacao", "magia"],
  ["Pescador de Nuvens", "Capture nuvens e transforme-as em criaturas.", "reflexo", "ceu"],
  ["A Cidade do Sono", "Administre sonhos coletivos de milhares de pessoas.", "deslizar", "mente"],
  ["O Reino dos Sapatos", "Explore uma sociedade organizada por tipos de calçado.", "triagem", "roupa"],
  ["Dragão Vegetariano", "Defenda uma floresta sem atacar nenhum ser vivo.", "cultivo", "planta"],
  ["A Última Biblioteca", "Salve livros de uma inundação interminável.", "labirinto", "livro"],
  ["Mecânico de Sombras", "Repare sombras quebradas para devolver identidade às pessoas.", "desafioQuiz", "sombra"],
  ["Oceano de Areia", "Navegue por dunas como se fossem ondas.", "gancho", "mar"],
  ["A Cidade dos Sussurros", "Troque informações secretas sem falar em voz alta.", "ritmo", "som"],
  ["Construtor de Arco-Íris", "Ligue regiões usando pontes coloridas.", "combinacao", "arte"],
  ["O Último Inventor", "Crie máquinas com peças encontradas em uma cidade vazia.", "construir", "maquina"],
  ["Cozinha de Dragões", "Prepare refeições capazes de alterar o comportamento dos dragões.", "tiro", "comida"],
  ["A Ilha dos Relógios", "Sincronize mecanismos para impedir um terremoto.", "sequencia", "tempo"],
  ["Detetive de Estátuas", "Descubra quais estátuas se movem durante a noite.", "cobra", "espelho"],
  ["Pastor de Estrelas", "Conduza estrelas para formar constelações úteis.", "gancho", "estrela"],
  ["O Reino Sem Gravidade", "Resolva desafios controlando impulsos e flutuação.", "iluminar", "espelho"],
  ["A Última Colmeia", "Reconstrua uma colônia de abelhas em um planeta estranho.", "cultivo", "planta"],
  ["Museu das Coisas Perdidas", "Cataloge objetos esquecidos e descubra seus donos.", "ordenar", "arte"],
  ["O Homem que Colecionava Portas", "Use portas para criar atalhos impossíveis.", "labirinto", "porta"],
  ["A Cidade Mutante", "Adapte prédios diariamente para acompanhar mudanças biológicas.", "subida", "cidade"],
  ["Cavaleiro de Almofada", "Proteja um castelo usando armas não letais.", "tiro", "brinq"],
  ["Caça ao Monstro Educado", "Capture criaturas resolvendo seus problemas pessoais.", "cuidar", "monstro"],
  ["O Último Músico", "Reconstrua uma banda para derrotar o silêncio absoluto.", "ritmo", "som"],
  ["Fazenda no Tempo", "Plante hoje, colha em épocas diferentes.", "cultivo", "planta"],
  ["O Hotel dos Deuses", "Acomode divindades com necessidades incompatíveis.", "empilhar", "deus"],
  ["Aventura dentro de uma Lágrima", "Explore memórias presentes em uma única lágrima.", "pares", "mente"],
  ["O Reino dos Reflexos", "Troque de lugar com seu reflexo para avançar.", "iluminar", "espelho"],
  ["Caçador de Tempestades Mágicas", "Estude fenômenos climáticos que possuem personalidades.", "escolhas", "ceu"],
  ["A Última Ponte", "Construa uma travessia entre dois mundos inimigos.", "encontrar", "aves"],
  ["Mestre das Máscaras", "Use identidades diferentes para acessar áreas restritas.", "triagem", "roupa"],
  ["A Cidade dos Relógios Parados", "Descubra por que o tempo parou para todos.", "sequencia", "tempo"],
  ["Padeiro Interplanetário", "Entregue pães adaptados a planetas diferentes.", "reflexo", "correio"],
  ["O Último Jardim", "Proteja plantas raras de criaturas famintas.", "cultivo", "planta"],
  ["Robô de Aluguel", "Preste serviços variados usando módulos comprados.", "construir", "maquina"],
  ["A Biblioteca Submersa", "Recupere conhecimento em ruínas subaquáticas.", "deslizar", "livro"],
  ["Guerra dos Guarda-Chuvas", "Controle ventos para disputar território.", "negociar", "ceu"],
  ["A Vila dos Sonâmbulos", "Guie moradores sem acordá-los.", "triagem", "aves"],
  ["O Colecionador de Vozes", "Reúna vozes para abrir portas e ativar máquinas.", "construir", "maquina"],
  ["A Montanha de Vidro", "Escale uma estrutura transparente cheia de reflexos.", "iluminar", "espelho"],
  ["Fábrica de Memórias", "Produza lembranças artificiais para clientes.", "desafioQuiz", "mente"],
  ["O Último Farol", "Reacenda faróis espalhados por um planeta oceânico.", "coleta", "espaco"],
  ["Caçador de Sorrisos", "Descubra por que as pessoas perderam a capacidade de sorrir.", "escolhas", "festa"],
  ["A Cidade de Retalhos", "Costure bairros para unir comunidades rivais.", "corrida", "cidade"],
  ["O Reino das Formigas Gigantes", "Construa túneis para impedir invasões.", "corrida", "bicho"],
  ["O Jardim dos Segredos", "Cada planta revela uma informação sobre alguém.", "cultivo", "planta"],
  ["A Última Gota de Tinta", "Termine uma pintura antes que a tinta desapareça.", "cobra", "agua"],
  ["Viajante de Espelhos", "Explore mundos alternativos refletidos em superfícies.", "iluminar", "espelho"],
  ["O Mercado das Estações", "Troque primavera, verão, outono e inverno como mercadorias.", "negociar", "mercado"],
  ["A Casa que Respira", "Mantenha uma casa viva saudável e contente.", "subida", "aves"],
  ["Pescador de Memórias", "Recupere lembranças perdidas em um lago.", "empilhar", "mente"],
  ["O Último Mensageiro", "Atravesse uma guerra levando uma mensagem de paz.", "pares", "correio"],
  ["Cidade das Sombras Longas", "Use o tamanho das sombras para resolver puzzles.", "coleta", "sombra"],
  ["Mago de Papel", "Dobre folhas para criar criaturas e veículos.", "construir", "papel"],
  ["O Reino dos Sinos", "Use sons para alterar monstros e caminhos.", "ritmo", "som"],
  ["Construtor de Vulcões", "Modele erupções para criar novas ilhas.", "ordenar", "fogo"],
  ["A Última Constelação", "Reorganize estrelas para revelar uma mensagem.", "encontrar", "correio"],
  ["Detetive das Marés", "Resolva crimes observando mudanças na praia.", "reflexo", "espelho"],
  ["Aventura em uma Ampulheta", "Explore o interior de um relógio de areia.", "sequencia", "tempo"],
  ["Cozinheiro de Fantasmas", "Prepare pratos que permitem espíritos descansar.", "deslizar", "comida"],
  ["O Último Balão", "Viaje pelo céu sem deixar o balão estourar.", "desafioQuiz", "ceu"],
  ["A Cidade dos Mil Cheiros", "Identifique lugares e pessoas usando aromas.", "encontrar", "agua"],
  ["Jardineiro da Lua", "Cultive plantas em crateras para transformar o satélite.", "tiro", "planta"],
  ["O Reino dos Botões", "Pressionar cada botão altera uma regra do universo.", "cobra", "reino"],
  ["Médico de Planetas", "Diagnostique e trate mundos doentes.", "subida", "espaco"],
  ["A Última Máscara", "Descubra sua verdadeira identidade entre várias personas.", "triagem", "roupa"],
  ["O Museu que Foge", "Persiga um museu ambulante para recuperar exposições.", "ordenar", "arte"],
  ["Mercador de Tempestades", "Compre e venda fenômenos climáticos.", "empilhar", "ceu"],
  ["A Cidade de Papelão", "Construa defesas contra chuva, vento e incêndios.", "construir", "papel"],
  ["Caçador de Ecos", "Encontre pessoas desaparecidas seguindo sons antigos.", "ritmo", "som"],
  ["O Último Gigante", "Proteja uma criatura enorme que não entende seu próprio poder.", "cuidar", "monstro"],
  ["Fazenda de Sonhos", "Plante sonhos, colha ideias e venda experiências.", "pares", "planta"],
  ["O Reino Sem Cores", "Recupere cores roubadas por uma entidade misteriosa.", "combinacao", "arte"],
  ["A Última História", "Crie personagens e acontecimentos para impedir que o universo termine.", "escolhas", "livro"],
];

/* tema derivado do mundo + parâmetros específicos por engine */
function temaPara(engine, mundo, nome, desc) {
  const m = MUNDOS[mundo] || MUNDOS.cidade;
  const s = m.set;
  switch (engine) {
    case "travessia":
      return { heroi: m.heroi, perigo: m.perigo, item: m.item, medidor: m.medidor, coleta: m.coleta };
    case "voo":
      return { heroi: m.heroi, obst: m.perigo, moeda: m.item };
    case "coleta":
      return { heroi: "🧺", bom: [s[0], s[1], s[2]], ruim: m.perigo };
    case "tiro":
      return { heroi: m.heroi, inimigo: m.inimigo };
    case "corrida":
      return { heroi: m.heroi, obst: m.perigo, bonus: m.item };
    case "cobra":
      return { heroi: m.heroi, item: m.item };
    case "subida":
      return { heroi: m.heroi, item: m.item };
    case "empilhar":
      return { peca: "peça" };
    case "gancho":
      return { heroi: "🪝", alvos: [{ e: s[0], v: 10 }, { e: s[1], v: 25 }, { e: s[2], v: 50 }], ruim: m.perigo };
    case "defesa":
      return { defensor: m.heroi, inimigo: m.inimigo, base: s[3], moeda: m.medidor };
    case "labirinto":
      return { heroi: m.heroi, saida: "🚪", item: m.item };
    case "ritmo":
      return { notas: [s[0], s[1], s[2], s[3]] };
    case "pares":
      return { icones: s.slice(0, 8) };
    case "sequencia":
      return { botoes: [s[0], s[1], s[2], s[3]] };
    case "gestao":
      return {
        recursos: [
          { id: "a", nome: m.coleta, ini: 12, icone: s[0] },
          { id: "b", nome: "Suprimentos", ini: 60, icone: s[1] },
          { id: "c", nome: "Materiais", ini: 40, icone: s[2] },
          { id: "d", nome: m.medidor, ini: 70, icone: s[3] },
        ],
        acoes: [
          { rot: "Produzir suprimentos", custo: { c: 3 }, ganho: { b: 14 }, txt: "As reservas foram reabastecidas." },
          { rot: "Extrair materiais", custo: { b: 6 }, ganho: { c: 15 }, txt: "Novos materiais chegaram." },
          { rot: "Expandir estrutura", custo: { c: 22, b: 12 }, ganho: { a: 4, d: 6 }, txt: "A operação cresceu." },
          { rot: "Investir em " + m.medidor.toLowerCase(), custo: { b: 10 }, ganho: { d: 18 }, txt: m.medidor + " em alta." },
        ],
        meta: "Chegue ao turno 20 com " + m.coleta.toLowerCase() + " acima de 25 e " + m.medidor.toLowerCase() + " acima de 50.",
      };
    case "atendimento":
      return {
        clientes: ["Visitante inesperado", "Cliente exigente", "Antigo conhecido", "Figura lendária", "Recém-chegado"],
        pedidos: [
          { nome: "Pedido simples", itens: [s[0], s[1]] },
          { nome: "Pedido caprichado", itens: [s[2], s[3], s[4]] },
          { nome: "Pedido exótico", itens: [s[5], s[6]] },
          { nome: "Pedido completo", itens: [s[0], s[3], s[7]] },
        ],
        estoque: s.slice(0, 8),
      };
    case "investigacao":
      return {};
    case "combinacao":
      return {
        base: [s[0], s[1], s[2], s[3]],
        receitas: [
          { i: [s[0], s[1]], r: s[4], nome: "Descoberta inicial" },
          { i: [s[1], s[2]], r: s[5], nome: "Mistura instável" },
          { i: [s[2], s[3]], r: s[6], nome: "Síntese rara" },
          { i: [s[0], s[3]], r: s[7], nome: "Combinação clássica" },
          { i: [s[4], s[5]], r: "🌟", nome: "Resultado brilhante" },
          { i: [s[6], s[7]], r: "🏆", nome: "Obra-prima" },
        ],
      };
    case "escolhas":
      return { recurso: m.medidor };
    case "ordenar":
      return {};
    case "encontrar":
      return { comum: s[0], alvo: s[1], fundoNome: m.coleta.toLowerCase() };
    case "cultivo":
      return { semente: "🌱", maduro: s[0], terra: "⬜", moeda: "💰", nomeCultura: m.coleta.toLowerCase() };
    case "construir":
      return { peca: s[0], inicio: "🚩", fim: "🏁" };
    case "triagem":
      return {
        caixas: [
          { rot: m.coleta, icone: s[0], itens: [s[0], s[1], s[2]] },
          { rot: "Descarte", icone: "🗑️", itens: [m.perigo, s[6], s[7]] },
          { rot: "Reserva", icone: "📦", itens: [s[3], s[4], s[5]] },
        ],
      };
    case "reflexo":
      return { alvo: m.item, espera: "⏳" };
    case "iluminar":
      return { on: m.item, off: "⚫" };
    case "deslizar":
      return {};
    case "negociar":
      return {
        moeda: "moedas",
        mercadorias: [
          { nome: m.coleta + " comuns", base: 20, icone: s[0] },
          { nome: m.coleta + " raros", base: 55, icone: s[1] },
          { nome: m.coleta + " voláteis", base: 35, icone: s[2] },
        ],
      };
    case "cuidar":
      return { criatura: ["🥚", s[0], s[1], s[2]] };
    case "desafioQuiz":
      return {};
    default:
      return {};
  }
}

export function getJogos() {
  return LISTA_JOGOS.map(function (row) {
    const [nome, desc, engine, mundo] = row;
    return {
      nome,
      desc,
      engine,
      imagem: "",
      params: { titulo: nome, sub: desc, tema: temaPara(engine, mundo, nome, desc) },
    };
  });
}

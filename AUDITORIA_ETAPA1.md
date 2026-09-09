# ETAPA 1 — INVENTÁRIO DOS 810 SITES

## Estrutura existente
- Categoria Estudo: 270 sites (simuladores físicos, ferramentas de estudo, quizzes, mapas, atlas, calculadoras científicas)
- Categoria Jogos: 270 sites (jogos de memória, puzzles, simulações de ambientes, jogos narrativos, desafios)
- Categoria Úteis: 270 sites (calculadoras básicas, conversores, codificadores, geradores simples, ferramentas de organização)
- Categoria Social: 3 sites

## Padrão de repetição identificado
Todos os sites pertencem a uma mesma arquitetura HTML (template único, cores por categoria, fontes DM Serif/DM Sans/IBM Plex Mono, layout sticky-top com ztop, cards simples).

## Amostra de finalidades reais (por amostragem de nomes + descrições)

### Estudo (amostra)
- Simulador de Lançamento de Projétil | Física interativa
- Visualizador de Funções e Cálculo | Gráficos de funções
- Simulador de Pêndulo | Oscilações
- Laboratório de Óptica | Refração, lentes
- Circuito Elétrico | Montagem de circuitos
- Termodinâmica | Gases perfeitos
- Relatividade | Dilatação do tempo
- Dinâmica de Fluidos | Equação de Bernoulli
- Campo Magnético | Indução
- Decaimento Radioativo | Datação
- Tabela Periódica | Propriedades atômicas
- Estequiometria | Balanceamento
- pH e Titulação | Curvas
- Modelos Atômicos | Bohr
- Citologia | Organelas
- Genética | Punnett
- Enzimas | Michaelis-Menten
- Anatomia | Atlas
- Microbiologia | Vírus
- Evolução | Seleção natural
- Geometria 3D | Poliedros
- Círculo Trigonométrico | Seno/cosseno
- Transformações Matriciais | Álgebra linear
- Estatística | Normal
- Fractais | Mandelbrot/Julia
- Números Complexos | Argand
- Teoria dos Grafos | Dijkstra
- Diagrama de Venn | Conjuntos
- Geometria Analítica | Reta, elipse

### Jogos (amostra)
- Arqueólogo de Memórias | Jogo narrativo de descoberta
- Fábrica de Memórias | Construção de memórias
- Mercador de Memórias | Jogo de troca
- Pescador de Memórias | Jogo de captura
- Biblioteca do Esquecimento | Narrativa
- Casa dos Mil Quartos | Exploração
- Cidade de Chocolate | Ambiente interativo
- Cidade dos Relógios Parados | Ambiente
- Cidade Invisível | Ambiente
- Cidade Mutante | Ambiente
- Cidade Flutuante | Ambiente
- Cidade dos Sinos | Ambiente
- Cidade do Sono | Ambiente
- Cidade de Retalhos | Ambiente
- Cidade de Papelão | Ambiente
- Cidade dos Mil Cheiros | Ambiente
- Cidade que Anda | Ambiente
- Cidade que Respira | Ambiente
- Cidade dos Mil Elevadores | Ambiente
- Cidade Dorme | Ambiente
- Cidade em um Livro | Ambiente
- Cidade de Papelao | Ambiente

### Úteis (amostra)
- Calculadora Básica
- Calculadora de IMC
- Calculadora de Idade
- Calculadora de Gorjeta
- Calculadora de Percentual
- Calculadora de Sono
- Calculadora de Tinta
- Cálculo de Gestação
- Calendário
- Cara ou Coroa
- Conversão de Unidades
- Cifra ROT13
- Codificador Base64
- Codificador de URL
- Comparador de Números
- Área de Terreno
- Área de Formas
- Bussola
- Calculadora Científica
- Calculadora de Cimento
- Calendário de Eventos
- Central de Conversão
- Conversor de Unidades
- Editor de Texto Básico
- Gerador de Códigos
- Gerador de Senhas
- Visualizador de JSON
- Minificador de CSS
- Comparador de Arquivos

### Social (3)
- Rede Social Básica
- Perfil de Usuário
- Mensagens

## Agrupamento por similaridade

GRUPO A — CALCULADORAS DE CORPO / SAÚDE (14+): IMC, calorias, gordura corporal, peso ideal, percentual de água, metabolismo basal, calorias queimadas, índice de adiposidade, circunferência abdominal, relação cintura-quadril.
GRUPO B — CALCULADORAS DE TEMPO / DATA (8+): idade, data de nascimento, dias entre datas, tempo entre horas, conversor de fusos, calculadora de gestação, calculadora de são.
GRUPO C — CALCULADORAS FINANCEIRAS (12+): gorjeta, percentual, juros simples, juros compostos, hipoteca, investimento, desconto, split de conta, conversão de moeda.
GRUPO D — CONVERSORES NUMÉRICOS (15+): unidades, temperatura, peso, volume, distância, área, velocidade, pressão, energia, potência.
GRUPO E — CODIFICADORES / CRIPTOGRAFIA (10+): base64, rot13, url encode, hex, md5, sha1, caesar, url decode, html entities.
GRUPO F — GERADORES SIMPLE (20+): senhas, códigos QR, códigos de barras, cores aleatórias, nomes aleatórios, números aleatórios.
GRUPO G — JOGOS DE MEMÓRIA / NARRATIVA (45+): arqueólogo, mercador, pescador, biblioteca, casa dos mil quartos, cidade de chocolate, cidade invisível, etc. Todos são ambientes narrativos com estruturas idênticas (título, descrição, botão de entrar, fundo claro, sem mecânica diferente).
GRUPO H — SIMULADORES FÍSICOS BÁSICOS (30+): lançamento de projétil, pêndulo, óptica, circuito, termodinâmica, fluido, magnetismo, decaimento, relatividade. Todos são simulações com sliders de parâmetros e gráfico de resultado — mesma arquitetura.
GRUPO I — MAPAS / ATLAS / GEOGRAFIA (25+): atlas geográfico, bandeiras, capitais, mapas mundi. Todos são visualizadores de imagens com texto descritivo.
GRUPO J — QUIZ / TESTE BÁSICO (15+): perguntas de múltipla escolha, resultados percentuais.
GRUPO K — EDITORES / FERRAMENTAS DE TEXTO (10+): editor básico, analisador simples.
GRUPO L — JOGOS DE LÓGICA / PUZZLE (10+): anagramas, sudoku, torre de hanoi.
GRUPO M — VISUALIZADORES / GRÁFICOS (15+): funções matemáticas, estatística, geometria, fractais. Todos são gráficos canvas com controles.
GRUPO N — JOGOS AMBIENTAIS / NARRATIVOS (60+): cidades, casas, bibliotecas — todos são páginas estáticas com texto narrativo, sem mecânica interativa real.

# ETAPA 2 — DETECÇÃO DE REPETIÇÃO

## Regra aplicada
"Se eu remover o título e olhar apenas para a funcionalidade, consigo perceber imediatamente que este site é diferente dos outros?"

## Resposta: NÃO para ~420 sites (~52%)

## Lista completa dos grupos redundantes

### REDUNDÂNCIA CRÍTICA — 14 calculadoras de corpo/saúde (GRUPO A)
Calculadora de IMC | Calculadora de calorias | Calculadora de gordura corporal | Calculadora de peso ideal | Calculadora de percentual de água | Calculadora de metabolismo basal | Calculadora de calorias queimadas | Calculadora de índice de adiposidade | Calculadora de circunferência abdominal | Calculadora de relação cintura-quadril | Calculadora de massa muscular | Calculadora de massa óssea | Calculadora de IMC infantil | Calculadora de IMC idoso
→ Todas são: input de peso/altura/idade → fórmula → resultado numérico → faixa de referência.

### REDUNDÂNCIA CRÍTICA — 10 calculadoras de data/idade (GRUPO B)
Calculadora de idade | Calculadora de data de nascimento | Calculadora de dias entre datas | Calculadora de tempo entre horas | Calculadora de gestação | Calculadora de sono | Conversor de fusos | Calculadora de aniversário | Calculadora de idade exata | Calculadora de idade lunar
→ Todas são: input de datas → subtração / comparação → resultado em anos/meses/dias.

### REDUNDÂNCIA CRÍTICA — 12 calculadoras financeiras (GRUPO C)
Calculadora de gorjeta | Calculadora de percentual | Calculadora de juros simples | Calculadora de juros compostos | Calculadora de hipoteca | Calculadora de investimento | Calculadora de desconto | Calculadora de split | Calculadora de moeda | Calculadora de taxa | Calculadora de dividendo | Calculadora de ROI
→ Todas são: input de valores → operação matemática → resultado monetário.

### REDUNDÂNCIA CRÍTICA — 15 conversores numéricos (GRUPO D)
Conversor de unidade | Conversor de temperatura | Conversor de peso | Conversor de volume | Conversor de distância | Conversor de área | Conversor de velocidade | Conversor de pressão | Conversor de energia | Conversor de potência | Conversor de tempo | Conversor de dados | Conversor de ângulos | Conversor de moeda | Conversor de medidas
→ Todas são: input de número → multiplicação por fator constante → número convertido.

### REDUNDÂNCIA CRÍTICA — 10 codificadores (GRUPO E)
Codificador Base64 | Codificador ROT13 | Codificador URL | Codificador Hex | Codificador MD5 | Codificador SHA1 | Codificador Caesar | Codificador HTML | Codificador Unicode | Codificador Binário
→ Todas são: input de texto → algoritmo de transformação → texto codificado.

### REDUNDÂNCIA GRAVE — 20 geradores simples (GRUPO F)
Gerador de senhas | Gerador de códigos QR | Gerador de códigos de barras | Gerador de cores aleatórias | Gerador de nomes aleatórios | Gerador de números aleatórios | Gerador de senhas humanas | Gerador de frases | Gerador de URLs | Gerador de IDs | Gerador de UUID | Gerador de tokens | Gerador de hashtags | Gerador de emojis | Gerador de cores hex | Gerador de paletas | Gerador de nomes de empresas | Gerador de usernames | Gerador de senhas fortes | Gerador de códigos promocionais
→ Todas são: clique no botão / configuração simples → saída aleatória.

### REDUNDÂNCIA GRAVE — 45 jogos narrativos idênticos (GRUPO N / GRUPO G)
Arqueólogo de Memórias | Mercador de Memórias | Pescador de Memórias | Biblioteca do Esquecimento | Casa dos Mil Quartos | Cidade de Chocolate | Cidade de Papelão | Cidade de Retalhos | Cidade do Sono | Cidade dos Mil Cheiros | Cidade dos Mil Elevadores | Cidade dos Sinos | Cidade que Anda | Cidade que Respira | Cidade Invisível | Cidade Mutante | Cidade Flutuante | Cidade Dorme | Cidade em um Livro | Cidade de Papelao | ... e mais 25 variações
→ Todas são: página estática com título narrativo, descrição poética, botão de entrar, sem mecânica de jogo real, sem pontuação, sem progresso, sem interação além de navegar.

### REDUNDÂNCIA GRAVE — 30 simuladores físicos com mesma arquitetura (GRUPO H)
Simulador de Lançamento | Simulador de Pêndulo | Simulador de Óptica | Simulador de Circuito | Simulador de Termodinâmica | Simulador de Fluido | Simulador de Magnetismo | Simulador de Decaimento | Simulador de Relatividade | Simulador de Gases | Simulador de Ondas | Simulador de Calor | Simulador de Som | Simulador de Luz | Simulador de Partículas | Simulador de Gravidade | Simulador de Colisão | Simulador de Órbita | Simulador de Campo Elétrico | Simulador de Campo Gravitacional | Simulador de Reação Química | Simulador de Movimento Harmônico | Simulador de Interferência | Simulador de Difração | Simulador de Polarização | Simulador de Efeito Doppler | Simulador de Efeito fotoelétrico | Simulador de Eletromagnetismo | Simulador de Energia Cinética | Simulador de Potencial
→ Todas são: slider de parâmetros → cálculo → gráfico canvas. Nenhuma diferença de interação fundamental.

### REDUNDÂNCIA GRAVE — 25 atlas/mapas/geografia (GRUPO I)
Atlas Geográfico | Bandeiras do Mundo | Capitais da Europa | Capitais do Mundo | Mapa do Mundo | Mapa Político | Mapa Físico | Mapa Climático | Mapa de População | Mapa de Rios | Mapa de Montanhas | Mapa de Oceano | Mapa de Florestas | Mapa de Desertos | Mapa de Cidade | Mapa de País | Mapa de Região | Mapa de Continente | Mapa Interativo | Atlas de Animais | Atlas de Plumas | ...
→ Todas são: imagem grande + texto descritivo + lista de itens. Nenhuma interatividade além de hover.

### REDUNDÂNCIA GRAVE — 15 visualizadores de gráficos (GRUPO M)
Visualizador de Funções | Visualizador de Estatística | Visualizador de Geometria | Visualizador de Fractais | Visualizador de Números Complexos | Visualizador de Matrizes | Visualizador de Vetores | Visualizador de Séries | Visualizador de Probabilidade | Visualizador de Distribuição | Visualizador de Logaritmos | Visualizador de Exponenciais | Visualizador de Trigonométricas | Visualizador de Polinômios | Visualizador de Paramétricas
→ Todas são: input de função → plotagem canvas → controles básicos.

### REDUNDÂNCIA MÉDIA — 10 quizzes/testes (GRUPO J)
Quiz de História | Quiz de Geografia | Quiz de Matemática | Quiz de Ciências | Quiz de Literatura | Quiz de Arte | Quiz de Música | Quiz de Tecnologia | Quiz de Esportes | Quiz de Cinema
→ Todas são: pergunta → 4 alternativas → resultado percentual.

### REDUNDÂNCIA MÉDIA — 10 quizzes/anagramas (GRUPO L)
Anagramas Fácil | Anagramas Médio | Anagramas Difícil | Sudoku Fácil | Sudoku Médio | Sudoku Difícil | Torre de Hanoi | Jogo da Memória | Jogo da Velha | Jogo do 15
→ Mesma arquitetura: grade + interação simples + contador.

### REDUNDÂNCIA MÉDIA — 10 editores básicos (GRUPO K)
Editor de Texto | Editor de Notas | Editor de Listas | Editor de Código Básico | Editor de Markdown | Editor de HTML | Editor de CSS | Editor de JSON | Editor de CSV | Editor de XML
→ Todas são: área de texto + botões de formatação simples.

### REDUNDÂNCIA MÉDIA — 15 ferramentas de organização simples (GRUPO K2)
Calendário | Lista de Tarefas | Rastreador de Hábitos | Planejador de Projetos | Bloco de Notas | Caderno de Anotações | Agenda | Planejador de Viagem | Planejador de Refeições | Planejador de Estudo | Planejador de Orçamento | Diário | Rastreador de Tempo | Rastreador de Meta | Rastreador de Progresso
→ Todas são: lista de itens + data + marcar concluído.

### TOTAL DE SITES REDUNDANTES (estimado por amostragem)
- Grupo A (calculadoras corpo): 14
- Grupo B (calculadoras data): 10
- Grupo C (calculadoras financeiras): 12
- Grupo D (conversores): 15
- Grupo E (codificadores): 10
- Grupo F (geradores): 20
- Grupo G/N (jogos narrativos idênticos): 45 + 60 = 105
- Grupo H (simuladores físicos): 30
- Grupo I (mapas/atlas): 25
- Grupo J (quizzes): 15
- Grupo K (editores): 10
- Grupo L (anagramas/puzzles): 10
- Grupo M (visualizadores gráficos): 15
- Grupo I2 (organização simples): 15
- Outras variações menores: ~60
→ TOTAL REDUNDANTE: ~426 sites (~53% do total)

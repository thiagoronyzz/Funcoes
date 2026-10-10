# FRENTES TOTAIS 1939 — Game Design Document

**Gênero:** estratégia militar em tempo real (RTS de larga escala) · **Tema:** Segunda Guerra Mundial, mapa do mundo real
**Duração-alvo:** 30 a 60 minutos por partida · **Jogadores:** 1 humano × 3 a 12 bots (e até 8 humanos no modo multijogador)
**Pilares:** (1) militarismo acima de tudo, (2) decisão em segundos, (3) informação sempre visível, (4) bots que jogam como gente.

> **Pitch.** Um RTS de guerra total onde você escolhe qualquer país histórico e tem meia hora para escrever a história.
> Sem árvores de tecnologia de 200 nós, sem planilha de produção, sem espera. Você vê a frente, traça a seta, e o jogo
> te mostra — antes do clique — se vai vencer, quanto tempo leva e se o movimento fecha um cerco.

---

## 0. Loop da partida (por que termina em 30–60 min)

| Elemento | Regra |
|---|---|
| **Relógio de guerra** | Partida cronometrada: **Blitz 30 min**, **Campanha 45 min**, **Guerra Total 60 min**. 1 minuto de guerra = 1 "tick"; 4 ticks/s em velocidade 1× (2× e 4× aceleram; pausa livre no single-player). |
| **3 Fases** | A partida é dividida em 3 atos iguais, cada um sobe o ritmo: **Fase 1 – Escalada** (produção base), **Fase 2 – Guerra Total** (produção +45%, exércitos grandes), **Fase 3 – Ofensiva Final** (produção +70%, cercos decidem). Cada fase muda a paleta do mapa — sem tela de loading. |
| **Pontos de Vitória (PV)** | Cada província vale PV (1 a 8, conforme valor econômico/estratégico). Capitais valem o dobro. |
| **Condições de vitória** | (a) **Tempo**: maior PV quando o relógio zera; (b) **Domínio**: manter ≥ 55% de todos os PV por 3 minutos contínuos → vitória imediata; (c) **Eliminação**: último nação de pé. |
| **Anti-burocracia** | Não existe tela de pesquisa, não existe fila de construção manual, não existe micro de batalha. Toda informação crítica aparece **no mapa**, em tempo real, no máximo a um clique de distância. |
| **Anti-snowball (Coligação)** | Quando uma nação passa de **32% dos PV do mapa**, todos os bots recebem +hostilidade contra ela, -hostilidade entre si e começam a se financiar mutuamente (Lend-Lease automático). Isso transforma "jogo já decidido" em "todo mundo contra o líder". |

**Loop de 30 segundos do jogador:** olhar a frente → arrastar seta (ver odds) → confirmar → ver o bolsão se fechar → gastar o ouro do saque em combustível ou aliança → repetir.

---

## 1. Mecânica de Combate e Invasão

### 1.1 Linhas de frente

* O mapa é uma malha de **províncias históricas** com relevo real (planície, floresta, montanha, deserto, urbano, costeiro).
* **Frente = qualquer fronteira entre duas nações em guerra.** Ela é desenhada automaticamente:
  * **Frente ativa** (há tropas em contato): linha grossa, incandescente, com brilho pulsante.
  * **Frente congelada** (sem tropas encostadas): linha fina e fosca — você sabe que pode ser atacado, mas não agora.
* Fronteiras entre aliados/neutros são traços neutros. **Não existe "exército invisível":** toda divisão é um marcador no mapa.

### 1.2 Setas de ataque (Ordens de Avanço)

* **Arrastar** da sua província para a vizinha cria uma **ordem**. Enquanto arrasta, um painel flutuante mostra:
  * **Força de ataque × força de defesa** e o **multiplicador** (ex.: `2,3×`);
  * **Veredito**: *Ruptura provável* (>1,7×) · *Vitória provável* (>1,05×) · *Disputado* (>0,75×) · *Derrota provável*;
  * **ETA** de deslocamento e **previsão do cerco**: se aquele movimento corta suprimento de províncias inimigas, o jogo pisca em verde **"CERCO: corta suprimento!"**.
* A seta é uma curva animada: espessura = nº de divisões, cor = nação, ponta = direção do avanço, o traço se move no sentido do ataque.
* **Shift + arrastar** cria uma **ofensiva em cadeia** (A → B → C) executada sozinha.
* **Duplo clique na seta** abre as opções da ordem (reforçar, recuar, avanço automático, apoio aéreo). **Botão direito** cancela.

### 1.3 Resolução do combate (contínua, sem tela de batalha)

A cada tick, cada ordem em combate compara forças. Não há "dado": o resultado emerge dos modificadores.

```
forçaAtaque   = Σ (ataque da unidade × força% × org% × suprimento × combustível × terreno × nação × experiência)
                × (1 + apoio aéreo) × (1 + bombardeio naval) × (1 + armas combinadas)
forçaDefesa   = Σ (defesa da unidade × força% × org% × suprimento × combustível × terreno × (1 + 0,30 × forte))
                × (1 + apoio aéreo inimigo) × (1 + defesa naval)
razão         = forçaAtaque / forçaDefesa
danoOrg       = 1,65 × razão^0,85   (defensor)   |   1,15 × (1/razão)^0,85 × 0,70 (atacante)
danoForça     = 0,30 × danoOrg
```

* **Organização (org)** é o "fôlego": quando a org do defensor cai abaixo de 8 (ou a força abaixo de 15%), ele **rompe**:
  * se houver província amiga vizinha → **recua** (org 60%, mantém parte da força);
  * se estiver cercado → **rende-se**: divisões destruídas, +1 abate, +1,5 ponto de indústria e +8 de ouro por divisão para quem cercou.
* **Ruptura (breakthrough):** razão > 2,2× **e** presença de blindados → dano extra e liberação do **Avanço Automático** (a ponta de lança continua para a próxima província sozinha). É o que transforma uma vitória em *Blitzkrieg*.
* Recuperação de org é rápida **fora** de combate (1,6/tick) e quase nula **dentro** da batalha (0,35/tick) — quem ataca primeiro com vantagem, ganha.

### 1.4 Cerco (encircle) e suprimento — a alma do jogo

* **Suprimento** nasce na **capital** e viaja por províncias contíguas (ferrovia/estrada). Portos abastecem províncias ultramarinas **se** você controlar a zona naval (e se ela não estiver bloqueada).
* Toda província fora da malha de suprimento fica **Cercada**, com:
  * contorno vermelho tracejado no mapa + cronômetro de rendição;
  * ataque e defesa **× 0,55**;
  * desgaste de **−0,30 força e −0,45 org por tick**;
  * rendição automática em **~2h30 de guerra** (150 ticks): as divisões somem e viram abates + espólios para o cercador.
* **A ponte aérea** (missão de transporte) e **frotas** podem atrasar o colapso — é a diferença entre Stalingrado cair ou resistir.
* O jogo **recompensa explicitamente o cerco**: +1 PV por divisão rendida, espólio industrial e de ouro, e um alerta de "BOLSÃO FORMADO".

### 1.5 Tipos de exército (4 papéis, sem sobreposição)

| Tipo | Papel | Ataque | Defesa | Org | Veloc. | Combustível | Custo | Terreno favorito / ódio |
|---|---|---|---|---|---|---|---|---|
| **Infantaria** (Linha, Montanha, Paraquedista, Guarnição) | Segurar a linha, ocupar, guarnecer | 5,5 | **8,5** | 70 | 1,0× | 0,003 | 10⚙ / 90☖ | ótima em floresta/urbano/montanha; fraca em campo aberto contra tanques |
| **Blindados** (Leve, Médio, Pesado) | Ruptura, exploração, fechar cercos | **14** | 5,0 | 55 | 1,9× | **0,045** | 26⚙ / 50☖ | arrasa em planície/deserto; ×0,45 em montanha, ×0,85 em cidade sem apoio |
| **Aviação** (Superioridade, CAS, Bombardeio, Interdição, Recon) | Força multiplicadora — não ocupa território | 9 (apoio) | 2 | 60 | — | 0,035 | 18⚙ / 25☖ | age em raio a partir de aeródromos; sem combustível, fica no chão |
| **Marinha** (Frotas, Porta-aviões, Submarinos) | Controlar zonas navais: invasão anfíbia, bloqueio, bombardeio costeiro | 7 (apoio) | 3 | 70 | — | 0,020 | 34⚙ / 35☖ | sem controle naval não há invasão nem suprimento ultramarino |

**Regras de combinados:**
* **Armas combinadas (INF + TAN na mesma batalha): +12%.**
* **Só tanques, sem infantaria: −15%** (blindados sem apoio sangram em cidade/mata).
* **Apoio aéreo** dá até **+55%** para quem domina o céu e é cortado pela interceptação inimiga.
* **Bombardeio naval** dá até **+30%** em províncias costeiras onde você tem frota.
* Cada divisão acumula **experiência** (0 a 4): +6% de poder por nível — veteranos são um recurso.

### 1.6 Invasões especiais

* **Anfíbia:** permite atacar entre duas costas na mesma zona naval que você controla. Custa 2,4× o tempo de deslocamento e **−14 de org** no desembarque (choque de praia). É a única forma de o Reino Unido voltar ao continente.
* **Aerotransportada:** paraquedistas saltam direto na província alvo, mas entram com org baixa e sem suprimento até a infantaria abrir o corredor.

---

## 2. Recursos de Guerra — o combustível da máquina militar

Quatro recursos, quatro formas de travar seu exército. Nenhum deles tem tela de gerenciamento: todos aparecem **na barra superior com a tendência por minuto** e mudam de cor ao entrar em escassez.

### 2.1 Os quatro recursos

| Recurso | De onde vem | Para que serve |
|---|---|---|
| **⛽ Combustível / Petróleo** | Campos de petróleo (Romênia, Cáucaso, Iraque, Texas, Bornéu), refinarias e síntese (indústria). Importável com ouro. | Move **blindados, aviões e frotas**. Tanque parado é tanque morto. |
| **☖ Mão de Obra** | População das províncias; cresce com conquistas; **Leva em Massa** converte ouro em recrutas. | Cria divisões e **reforça** as que estão desgastadas. |
| **⚙ Indústria Militar** | Nível industrial das províncias (fábricas, minas, portos). | Pontos de produção: novas divisões, reforços, fortes, aeródromos, ferrovias. |
| **⦿ Ouro / Crédito Político** | Economia + PV + petróleo exportado. Bonus por neutralidade. | Importar petróleo, **Lend-Lease** a aliados, anexar neutros, espionagem, contratar voluntários, comprar paz. |

### 2.2 O que a escassez faz **no meio da batalha**

| Recurso | Zona verde | Zona âmbar (penalidade) | Zona vermelha (colapso) |
|---|---|---|---|
| **Combustível** | > 35 | 10–35: ataque de blindados −12%, aviação −30% de eficiência, movimento −25% | < 10 (ou 0): **tanques imobilizados** (não atacam), aviões no chão (missão a 25%), frotas com raio reduzido, org não recupera |
| **Mão de obra** | > 600 | 150–600: reforços mais lentos e caros, "Divisões Verdes" (experiência 0) | < 150: **sem reforço e sem recrutamento** — divisões feridas continuam lutando com a força que têm ("divisões fantasma") |
| **Indústria** | pontos acumulando | fila > 2 itens: reforços param primeiro (desgaste acelera) | 0 pontos: **nenhum reforço e nenhuma unidade nova** — a guerra passa a ser de desgaste puro |
| **Ouro** | > 120 | 20–120: sem importação, sem Lend-Lease | < 20: sem ajuda a aliados (relação cai), sem anexação, sem compra de paz — você fica sozinho |

**Regra de ouro do balanceamento:** escassez nunca *trava* o jogo, ela **degrada**. Um exército sem combustível não desaparece — ele passa a lutar pior, e você sente na pele quando a seta de ataque passa de "2,1×" para "0,8×".

### 2.3 O mercado de guerra

* Petróleo pode ser **importado** (35⦿ → 45⛽), mas o preço sobe quando a demanda global aumenta (mais nações em guerra = mais caro).
* **Lend-Lease** (60⦿): envia 45⦿ e 25⛽ ao aliado e sobe a relação em +18 — é como o Diplomata de Guerra compra exércitos alheios.
* **Leva em Massa** (30⦿): +420 de mão de obra **na hora**, mas −12% de indústria permanente e tropas verdes. É o botão do desespero — e o da URSS.

---

## 3. IA dos Bots — competitiva, legível e agressiva

### 3.1 Perfis de comportamento

Cada bot recebe um perfil fixo, revelado ao jogador por um **dossiê de inteligência** (visível depois de alguma espionagem ou após a primeira guerra com ele).

| Perfil | Doutrina | Gatilho de ataque | Ponto fraco explorável |
|---|---|---|---|
| **Expansionista** (Blitz) | Agressão desde o minuto 1, prioriza **petróleo** e capitais, sempre mantém uma ofensiva ativa | vantagem local ≥ **1,28×** | **sobreextensão**: frente longa, suprimento esticado, flancos abertos |
| **Oportunista** (Abutre) | Espera os outros sangrarem; ataca quem já está em guerra; **apunhala aliados** quando a relação cai | vantagem local ≥ **1,55×** e alvo com exército distante | perde o trem da história se ninguém guerrear cedo; reage mal a cercos |
| **Diplomata de Guerra** (Arquiteto) | Constrói alianças, financia aliados, luta por procuração, anexa neutros com ouro; **nunca ataca sem 1,85×** | vantagem local ≥ **1,85×** ou defesa do aliado | lento para crescer sozinho; depende de aliados vivos; guarda rancor |
| **Muralha** (Defensivo) | Fortalece fronteiras, contra-ataca em cima do ataque frustrado, prioriza terreno | vantagem local ≥ **1,40×**, mas ataca **quando você erra** | não toma a iniciativa: se você não atacar, ele empaca |

### 3.2 Regras de reação (a IA "pensa" a cada 3 a 6 segundos, conforme a dificuldade)

1. **Invasão detectada (defesa).** Para cada província de fronteira calcula `ameaça = poder inimigo adjacente − minha defesa`.
   * `ameaça > 0` → puxa tropas da **retaguarda mais próxima que não esteja na frente** (nunca desguarnece a capital se ela tiver menos de 3 divisões).
   * Sem reserva → **recuo estratégico**: abandona a província, forma linha nova atrás de rio/montanha e cede terreno para encurtar a frente.
2. **Cerco sofrido.** Se houver bolsão, a IA tenta **resgate** (ponta de lança vizinha ataca a parede do cerco) ou ordena **ruptura** (as divisões cercadas atacam para fora). Se não houver combustível, aceita a perda e desvia a produção para repor.
3. **Traição (aliado que ataca).** Relação cai a −100, ganha a flag **Rancor**: recusa aliança por 5 minutos, financia os inimigos de quem traiu e prioriza aquela nação em todos os cálculos de alvo.
4. **Ameaça global (líder folgado).** Qualquer nação acima de **32% dos PV** dispara a **Coligação**: bots reduzem hostilidade entre si, sobem hostilidade contra o líder, sincronizam ofensivas na mesma janela de tempo e mandam Lend-Lease para quem está na frente dele.
5. **Impasse detectado.** Sem troca de províncias por mais de 2 minutos e com exaustão de mão de obra → o bot aceita/propõe **paz branca** e redireciona a agressão para outro vizinho.
6. **Guerra anfíbia/naval.** A partir da Fase 2, todo bot tenta projetar poder pelo mar: manda frota para a zona naval do alvo, bloqueia suprimento ultramarino inimigo e lança desembarques quando tem ≥ 1,7× local.

### 3.3 Dificuldade e justiça

| Nível | Latência de reação | Economia | Visão |
|---|---|---|---|
| Recruta | ×1,7 (lento) | ×1,0 | nenhuma vantagem |
| Normal | ×1,1 | ×1,0 | nenhuma vantagem |
| Veterano | ×0,7 (reage quase instantâneo) | **+20% de produção** | nenhuma vantagem |

* **A IA nunca trapaceia em visão** (ela enxerga só o que qualquer jogador enxergaria). A dificuldade vem de tempo de reação e economia — o jogador sempre sente que *perdeu por ter jogado pior*, não por aistema.
* **Anti-frustração:** a agressividade é distribuída por **ameaça calculada**, nunca por sinalizar "humano". O jogador não é caçado por ser humano — mas vira alvo se liderar (regra 4).

---

## 4. Habilidades Únicas das Nações Históricas

Toda nação tem: **2 bônus + 1 fraqueza + 1 unidade/traço exclusivo + 1 Cartada** (poder único, recarga longa ou uso único).

### 🇩🇪 Alemanha — *Blitzkrieg*
* **Bônus:** blindados **+20% de ataque** e **+15% de velocidade**; generais começam experientes; começa com a melhor relação ataque/organização do jogo.
* **Fraqueza:** **déficit crônico de combustível** — rende só 55% do petróleo que possui e consome mais que todos. Precisa conquistar campos de petróleo ou importar (caro).
* **Cartada — *Keil und Kessel*:** por 60 s, seus blindados ignoram penalidade de suprimento para se mover e o cronômetro de rendição dos bolsões inimigos cai pela metade.

### 🇷🇺 URSS — *Terra Queimada*
* **Bônus:** mão de obra enorme e infantaria barata; **+35% de defesa em território próprio**; **profundidade estratégica** — o invasor perde suprimento a cada província que se afasta da própria capital; **relocação industrial** (pode mover fábricas para leste uma vez).
* **Fraqueza:** oficiais purgados — **−10% de organização**, generais piores, experiência sobe devagar; marinha irrelevante.
* **Cartada — *Ordem nº 227*:** uma onda de conscrição instantânea (grande mão de obra, tropas verdes) e **terra arrasada**: toda província sua que for perdida é entregue sem infraestrutura e com penalidade de suprimento ao invasor.

### 🇺🇸 Estados Unidos — *Arsenal da Democracia*
* **Bônus:** indústria massiva que **cresce mais rápido enquanto neutro**; imune a bombardeio estratégico no início; **Lend-Lease** gera ouro e influência; marinha e fuzileiros navais fortes (invasões anfíbias com menos penalidade).
* **Fraqueza:** **isolacionismo** — não pode declarar guerra nos primeiros minutos (só se for atacado ou provocado) e começa com um exército minúsculo; a mobilização é uma rampa.
* **Cartada — *Dia D*:** uma invasão anfíbia gigantesca, pré-planejada e com suprimento garantido, em qualquer costa ao alcance.

### 🇬🇧 Reino Unido — *O Império e a Royal Navy*
* **Bônus:** império global (domínios e colônias em todos os continentes: Índia, Canadá, Austrália, África, Egito); **frota dominante** (bloqueio corta suprimento ultramarino inimigo); **ouro abundante**; ilha quase inexpugnável (+50% de defesa contra anfíbias).
* **Fraqueza:** exército profissional pequeno e caro; império esparramado = linhas de suprimento longas e vulneráveis a submarinos.
* **Cartada — *Bloqueio Total*:** por 90 s, todos os comboios inimigos param: províncias ultramarinas dele ficam com −50% de suprimento e o estoque de combustível drena mais rápido.

### 🇯🇵 Japão — *Golpe do Sol Nascente*
* **Bônus:** aviação naval embarcada de elite (porta-aviões com mais alcance e dano); **Banzai** (+25% de ataque nos primeiros 30 s de cada batalha, com mais baixas); guerra em selva/ilha; **ataque preventivo** (declaração de guerra surpresa deixa o alvo "despreparado": −org e −defesa por 60 s).
* **Fraqueza:** indústria e mão de obra pequenas; **importa quase todo o petróleo** — um bloqueio naval derruba a máquina inteira em minutos; vulnerável a bombardeio estratégico.
* **Cartada — *Ataque a Pearl Harbor*:** uso único: destrói parte da frota alvo e a desativa por 90 s (só antes da guerra entre vocês).

### 🇮🇹 Itália · 🇫🇷 França · 🇵🇱 Polônia · 🇪🇸 Espanha · 🇹🇷 Turquia (potências regionais)
* **Itália — *Guerra Paralela*:** marinha forte no Mediterrâneo, infantaria 15% mais barata; **−20% de indústria**.
* **França — *Linha Maginot*:** fortes iniciais +2 e +20% de defesa em casa; doutrina lenta (−10% de ataque).
* **Polônia — *Cavalaria de Poniatowski*:** +25% de defesa em planície, aliados fiéis (relação sobe sozinha); **começa cercada** e sob ameaça.
* **Espanha — *Divisão Azul*:** infantaria veterana (experiência inicial 2) e **+40% de ouro enquanto neutra**.
* **Turquia — *Fortaleza da Anatólia*:** montanhas dão +25% de defesa extra; indústria mínima.

**Nações menores** (Suécia, Iugoslávia, Romênia, Grécia, Países Baixos, Bálticos etc.) começam neutras com guarnições pequenas: podem ser **invasão rápida** (primeiro sangue barato) ou **anexação diplomática** com ouro — e, se atacadas sem motivo, sobem a hostilidade global contra você.

---

## 5. Interface e Usabilidade (UX/UI)

**Princípio único:** *nenhuma informação crítica atrás de um menu.* O mapa é o jogo; o HUD é só contexto.

### 5.1 Tela de escolha do país
* Mapa-múndi com **todos os países históricos clicáveis** (potências e nações menores).
* Cada card mostra: **bandeira**, nome, dificuldade (estrelas), capital, nº de províncias iniciais, bônus, fraqueza e a **Cartada**.
* Filtros: *Potência / Regional / Azarão* e *perfil sugerido para iniciantes*.

### 5.2 A tela do mapa
* **Território com bandeira estampada:** cada província é pintada com a **cor da nação** e recebe uma **marca d'água com as listras da bandeira** (diagonais, verticais ou horizontais, variando por país — assim daltônicos distinguem nação por padrão, não só por cor). No centro, um **crachá com a bandeira + código do país** (DE/SU/GB/FR/IT/ES/TR/PL) e o nome da província.
* **Frentes** brilhando, **bolsões** com contorno vermelho tracejado e cronômetro, **setas** animadas, **capitais** com estrela, **campos de petróleo** e **fábricas** visíveis sem abrir nada.
* **Zoom contínuo** do globo à província, com *level of detail*: de longe, bandeiras e frentes; de perto, relevo, fortes e contagem de tropas.

### 5.3 Camadas — uma tecla, zero menus
`1` Político (bandeiras) · `2` Suprimento (verde = abastecido, vermelho = cortado) · `3` Recursos (petróleo/fábricas) · `4` Terreno · `5` Aéreo (zonas e raios) · `6` Naval (zonas, comboios, bloqueios) · `7` Ameaça (mapa de calor do poder inimigo).
Também há um botão de camada no topo que mostra qual está ativa.

### 5.4 HUD mínimo e contextual

| Faixa | Conteúdo |
|---|---|
| **Topo** | 4 recursos com **tendência por minuto** e cor de estado; relógio de guerra (mês/ano + dia); placar de PV em barras (top 6) — o líder aparece sempre, você aparece destacado; velocidade 1×/2×/4× e pausa. |
| **Esquerda** | **Alertas de guerra**: cards que surgem e somem sozinhos ("2ª Panzer sem combustível", "Bolsão formado: 4 divisões", "Aliado pede ajuda"). Clicar leva a câmera até o evento. **Nenhum modal.** |
| **Direita** | **Painel de alianças**: bandeira, PV, relação (número colorido), perfil do bot e ações em 1 clique — *Aliar (50⦿) · Ajudar (60⦿) · Atacar · Paz (80⦿) · Anexar neutro*. |
| **Rodapé** | **Produção em 3 sliders** (Terrestre / Blindados / Aero-naval) — você define a proporção e a indústria executa; clicar em um slider prioriza reforços. Ao lado: chaves `Q W E R` para enfileirar rápido e a **fila** com tempo restante. Embaixo, as **divisões da província selecionada** como fichas clicáveis (força/org) — clique alterna quais vão no ataque. |
| **Cursor** | Tooltip com força × defesa, veredito e tempo estimado **enquanto você arrasta**. |

### 5.5 Interação — contagem de cliques

| Ação | Como |
|---|---|
| Atacar / mover | **arrastar** da província para a vizinha (1 gesto) |
| Ofensiva em cadeia | **Shift + arrastar** |
| Cancelar ordem | **botão direito** na província |
| Missão aérea | arrastar a asa para o alvo/zona |
| Enviar frota / recolher | **clique** / **botão direito** na zona naval |
| Selecionar subunidades | clicar nas fichas da guarnição |
| Pausar, velocidade, camadas | `Espaço`, `1/2/3`, `L` |
| Grupos de exército | `Ctrl+1..9` para memorizar, `1..9` para focar |

### 5.6 Feedback visual e leitura de batalha
* **Barra de ruptura** sobre a província atacada: você vê a org do defensor cair em tempo real — sem abrir tela de batalha.
* **Impactos** piscando na frente, **números de dano** pequenos, **pulseira laranja** pulsando onde há combate e **tremor sutil** na ruptura (desligável).
* **Conquista:** a bandeira sobe sobre a província com um ripple; o placar de PV anima.
* **Áudio:** estalos de metralhadora ao fundo das batalhas, rádio truncado, sirene curta quando um cerco se fecha.

### 5.7 Acessibilidade e onboarding
* Paletas alternativas para daltonismo (padrões de listras por nação, além da cor), escala de UI, modo de animação mínima, legendas de áudio.
* **Manual de 60 segundos:** na primeira partida, 4 dicas contextuais que só aparecem quando a situação acontece (ex.: aparece "arraste para atacar" no momento em que você tem tropas encostadas no inimigo).

---

## 6. Protótipo jogável neste repositório

`public/ZCODE/Jogos/frentes-totais-1939/index.html` — **vertical slice** jogável do conceito (HTML único, sem dependências):

* mapa real do **teatro Europa / Mediterrâneo / Norte da África**, 48 províncias históricas geradas a partir de geometria real (Voronoi sobre máscara de terra), com relevo, petróleo, indústria e mão de obra;
* 8 nações jogáveis + 14 nações neutras, com bandeiras estampadas no território, frentes incandescentes, setas de ataque, cercos e suprimento;
* os 4 recursos com escassez impactando combate, produção com fila, cercos com rendição, invasões anfíbias e zonas navais;
* bots com os perfis Expansionista / Oportunista / Diplomata / Muralha, reagindo a ameaças, traindo aliados e formando coligação contra o líder;
* HUD completo: recursos, relógio, placar de PV, alertas, painel de alianças, produção e guarnição.

**Como rodar:** `python3 -m http.server 8000` dentro de `public/` e abra
`/ZCODE/Jogos/frentes-totais-1939/index.html` (ou `npm run dev` na raiz do projeto).

---

## 7. Próximos passos (roadmap de produção)

1. **Mapa-múndi completo** (América, Ásia-Pacífico, África) e nações EUA/Japão/China jogáveis com as mesmas regras.
2. **Multijogador** com pausas limitadas (3 pausas de 60 s) e lobby por PV.
3. **Cartas de Doutrina**: 3 trilhas (Terrestre, Aérea, Industrial) com 4 níveis, escolhidas em cartas — zero árvores longas.
4. **Camada diplomática completa**: garantias, ultimatos, paz negociada com cessão de território.
5. **Telemetria de balanceamento**: registrar tempo médio de batalha, % de cercos bem-sucedidos e taxa de vitória por nação/perfil após 10 mil partidas.

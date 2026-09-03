# 🏎️ Estrada Dourada — Corrida 3D hiper-realista

Jogo de corrida/cruzeiro 3D em mundo aberto, com foco em **realismo** e **fluidez**,
rodando direto no navegador com WebGL (Three.js). Tudo é 100% local — nenhum recurso
externo, nenhum servidor.

## Como jogar

Sirva a raiz do projeto (a página usa módulos ES6):

```bash
python3 -m http.server 8080
# abra http://localhost:8080
```

Ou apenas abra `index.html` (em navegadores modernos funciona pela origem `file://`
também, graças ao Three.js local).

## Controles

| Tecla | Ação |
|---|---|
| `W` / `↑` | Acelerar |
| `S` / `↓` | Frear / ré |
| `A` / `D` | Direção |
| `Espaço` | Freio de mão (drift) |
| `P` / `Esc` | Pausar |
| `M` | Som liga/desliga |

Em telas de toque, botões virtuais aparecem automaticamente.

## O que tem dentro

- **Pista extensa**: um anel de ~7,5 km com altimetria, gerado proceduralmente.
- **Cenário hiper-realista em hora dourada**: terreno com relevo, lago com água
  animada (shader com reflexo do sol), montanhas distantes, nuvens à deriva,
  floresta com vento nas copas, grama, flores e rochas.
- **Carros realistas**: cupê esportivo com pintura brilhante (clearcoat), rodas
  girando, direção nas rodas dianteiras, faróis e luzes de freio.
- **Tráfego**: carros de verdade circulando na pista (sentido contrário de faixa).
- **Pessoas**: pedestres que andam, esperam para atravessar, atravessam e **fogem
  correndo** do seu carro; cachorros também. (Sim, dá para atropelar — com física
  de ragdoll e contador no HUD.)
- **Obstáculos interativos**: cones e barris que voam quando você bate.
- **Áudio procedural**: motor, vento, derrapagem, respingos, colisões, pássaros e
  grilos — gerado em tempo real, sem arquivos de áudio.
- **HUD moderno**: velocímetro, marcha, voltas, melhor volta, minimapa da pista.

## Qualidade

Há três níveis de qualidade no menu (`Alta`, `Média`, `Rápida`) que ajustam resolução,
distância de detalhe, sombras e quantidade de tráfego/pessoas.

## Arquitetura

| Arquivo | Papel |
|---|---|
| `src/world.js` | Terreno, estrada, lago, guard-rails e colisões estáticas |
| `src/nature.js` | Florestas, arbustos, flores, rochas e grama dinâmica |
| `src/atmosphere.js` | Céu, sol, luzes e nuvens |
| `src/vehicle.js` | Modelo do carro |
| `src/traffic.js` | IA do tráfego |
| `src/people.js` | Pedestres e cachorros |
| `src/obstacles.js` | Cones e barris |
| `src/effects.js` | Partículas, poeira, marcas de pneu |
| `src/audio.js` | Áudio procedural WebAudio |
| `src/main.js` | Física do jogador, câmera, loop, HUD |
| `src/noise.js` | Ruído procedural determinístico |

## Testes

Sem GPU, os módulos podem ser validados em Node:

```bash
node test/smoke.mjs    # monta o mundo inteiro em CPU pura
node test/physics.mjs  # simula 30 s de dirigibilidade
```

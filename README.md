# Fun-o-01-

## Fauna Sonora (`fauna.html`)

Catálogo de 61 espécies com o canto real dos animais (áudios e fotos do Wikimedia Commons).
Fica em um único arquivo HTML — basta abrir `fauna.html` no navegador.

Para editar o catálogo, altere `gerador/fauna_data.py` / `gerador/fauna_data2.py`
(nome do bicho, arquivo de áudio no Commons, arquivo da foto, textos da ficha) e rode:

```bash
python3 gerador/build_fauna.py   # gera fauna.html a partir de gerador/fauna_shell.html
```

O gerador monta as URLs canônicas do CDN a partir do hash MD5 do nome do arquivo,
do mesmo jeito que o MediaWiki faz — por isso não é preciso copiar URL nenhuma.

## Cubia — mundo voxel (`craft.html`)

Jogo de mineração, construção e sobrevivência em mundo procedural infinito, num
único arquivo HTML: `craft.html` abre com dois cliques, sem etapa de build.

- Mundo: chunks de 16×16×96 com Perlin multicamada (continentalidade, erosão, picos), 7 biomas,
  cavernas 3D com lava e obsidiana no fundo, minérios por faixa de altura, árvores que atravessam
  a divisa dos chunks.
- Jogo: 57 blocos + 66 itens, dureza e nível de ferramenta (madeira → pedra → ferro → ouro →
  diamante), crafting 2×2 na mão e 3×3 na bancada (com padrão espelhado e receitas por categoria:
  qualquer tronco vira tábua), livro de receitas que monta a grade com um clique e cria o máximo
  possível com shift-clique, duplo clique ajuntando pilhas iguais, fornalha com combustível,
  animação de chama e tempo, baús, cama, XP com 8 encantamentos que mudam o jogo de verdade,
  dinamite, partículas e 10 criaturas com IA.
- Combate: alcance limitado, escolha do alvo por raio contra o corpo do bicho (não só o centro),
  knockback, crítico caindo, armadura reduzindo dano, carne que cai assada se o bicho estava
  queimando, creeper que acende ao ser tocado e flecha com puxada carregada.
- Sobrevivência: vida, fome e saturação, armadura, queda, afogamento, lava, veneno, i-frames,
  queda do inventário na morte, ciclo dia-noite de 20 minutos com spawn de hostis por nível de luz.
- Cinco modos (sobrevivência, hardcore, criativo, aventura, espectador), autosave no
  `localStorage` a cada 45 s e um mundo salvo por nome.
- Streaming sem buraco: o chão é gerado dois chunks antes da borda visível e a malha vem depois,
  com orçamento de tempo por quadro; o HUD fica sempre por cima do canvas (coração, fome, hotbar).
- Texturas 16×16 e efeitos sonoros são gerados por código no próprio arquivo. A única rede
  usada é a biblioteca three.js (CDN com fonte reserva); se ela falhar, aparece um aviso na tela.

Para editar o jogo, mexa nas partes em `gerador/cubia/` e rode:

```bash
python3 gerador/cubia/build_craft.py    # remonta craft.html a partir das partes
node gerador/cubia/teste/test.js        # 152 verificações, sem precisar de navegador
```

As partes ficam separadas só para a edição ser agradável — o arquivo final é um HTML
sozinho com tudo em um escopo. A suíte de testes roda o jogo num DOM falso: confere a
integridade das receitas, a geometria e a orientação das faces, luz, tempo de mineração,
combate, save/load, IA dos mobs e uma sessão completa (novo mundo → frames → streaming de
chunks → todas as telas → craft → modos → salvar). Ela encontrou e hoje impede a volta de
bugs como a receita de tábua casando por bloco em vez de item, durabilidade que nunca
gastava e textura virada de lado em faces laterais.

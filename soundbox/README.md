# SOUNDBOX

**Buscador de músicas com prévias de 30 segundos, favoritos e playlists — em um único arquivo HTML.**

Sem conta, sem upload, sem framework. A busca é real (API pública do Deezer), as prévias tocam de verdade
via `new Audio()` e toda a biblioteca fica no `localStorage` do navegador. Nada é baixado: só streaming
das prévias de 30 s.

```
soundbox/
├── index.html            # o app inteiro (HTML + CSS + JS, sem dependências)
├── manifest.webmanifest  # manifest real, para instalação via HTTP (opcional)
├── sw.js                 # service worker real, para instalar/abrir offline (opcional)
├── icon-192.png          # ícones do PWA (gerados por scripts/make-icons.py)
├── icon-512.png
└── scripts/make-icons.py
```

## Rodar

```bash
# na pasta soundbox/
python3 -m http.server 8000
# abra http://localhost:8000
```

Qualquer servidor estático funciona. O app também abre direto do arquivo (`file://`), mas aí o service
worker e a instalação do PWA ficam indisponíveis (o navegador exige `https://` ou `localhost`).

## Como funciona

- **Busca** — `https://api.deezer.com/search?q=...` chamada por um proxy de CORS (o Deezer não envia
  cabeçalhos CORS). O primeiro proxy é o `corsproxy.io`; se ele falhar, o app tenta espelhos públicos
  automaticamente e mostra um erro amigável quando todos estão fora do ar.
- **Prévia** — um único `HTMLAudioElement` toca o campo `preview` da faixa. O player do rodapé, a barra
  de progresso da linha atual e o botão de play/pause compartilham esse mesmo áudio.
- **Biblioteca** — `soundbox.saved.v1` guarda os favoritos; `soundbox.playlists.v1` guarda as playlists.
  Cada faixa salva mantém título, artista, capa, álbum e URL da prévia.
- **PWA** — o `index.html` cria um manifest inline via Blob URL e tenta registrar um service worker
  inline. Como navegadores não aceitam registrar service worker a partir de `blob:`, o app detecta o
  `manifest.webmanifest` e o `sw.js` ao lado do HTML e usa esses arquivos quando estão disponíveis —
  é assim que a instalação funciona de verdade. O botão **Instalar App** usa `beforeinstallprompt`
  e, quando o navegador não libera o prompt, mostra as instruções manuais.

## Interface

- Fundo `#121212`, cards `#181818`, inputs `#242424`, destaque `#1DB954` (hover `#1ED760`).
- Inter (Google Fonts), títulos 600, corpo 400, logo 700 com `letter-spacing: 2px`.
- Mobile-first, três abas (Início · Buscar · Biblioteca), mini player fixo acima da navegação.
- Sem gradientes, sem sombras coloridas, sem bibliotecas de ícones — só caracteres unicode.

## Limites

- As prévias têm 30 segundos e só existem quando o Deezer disponibiliza o campo `preview`.
- Faixas podem ser salvas sem prévia; nesse caso o app avisa em vez de falhar.
- Proxies públicos de CORS podem ficar instáveis; é a única forma de falar com a API do Deezer
  sem um backend próprio.

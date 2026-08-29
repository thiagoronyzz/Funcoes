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

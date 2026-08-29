#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Monta craft.html (arquivo único) a partir das partes em gerador/cubia/.

As partes são arquivos separados só para a edição ser agradável; o resultado é
um HTML sozinho no mesmo escopo de função — as declarações `function` sobem,
mas `const`/`let` valem a partir da linha onde estão.
"""
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent.parent / "craft.html"

ORDER = ["10_core.js", "20_defs.js", "30_world.js", "40_render.js", "50_player.js",
         "55_interact.js", "60_ui.js", "65_craft.js", "70_entities.js", "75_sound.js",
         "80_main.js"]

code = "\n\n".join((HERE / f).read_text(encoding="utf-8") for f in ORDER)
head = (HERE / "01_head.html").read_text(encoding="utf-8")
body = (HERE / "02_body.html").read_text(encoding="utf-8")
assert "__CUBIA_CODE__" in body, "marcador __CUBIA_CODE__ ausente no corpo"
html = body.replace("__CUBIA_CODE__", code)
OUT.write_text(head + "\n" + html, encoding="utf-8")
print("gerado", OUT, len(head + html), "bytes")

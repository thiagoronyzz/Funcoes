#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Monta fauna.html (arquivo único) a partir do catálogo + shell."""
import hashlib
import json
import os

from fauna_data import PASSERINES, BIG_BIRDS, GROUPS
from fauna_data2 import MAMMALS, FARM, SEA, HERPS, BUGS

CATALOG = PASSERINES + BIG_BIRDS + MAMMALS + FARM + SEA + HERPS + BUGS

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, "..", "fauna.html"))


def mwpath(name):
    h = hashlib.md5(name.replace(" ", "_").encode("utf-8")).hexdigest()
    return "%s/%s" % (h[0], h[0:2])


FIELDS = ("n", "s", "c", "g", "d", "i", "t", "h", "prod", "f")

rows = []
for rec in CATALOG:
    assert len(rec) == 10, "entrada com campos errados: %r" % (rec[0],)
    item = dict(zip(FIELDS, rec))
    item["p"] = mwpath(item["g"])          # hash do áudio no CDN
    item["ip"] = mwpath(item["i"])         # hash da foto no CDN
    rows.append(item)

# ---- checagens de sanidade --------------------------------------------------
names = [r["n"] for r in rows]
assert len(names) == len(set(names)), "nome duplicado no catálogo"
assert all(r["d"] > 0 for r in rows), "duração inválida"
for r in rows:
    assert r["c"] in GROUPS, "grupo inexistente em " + r["n"]
    assert r["g"].rsplit(".", 1)[-1].lower() in {"mp3", "ogg", "oga", "wav", "flac"}, r["g"]

# as rotas derivadas do hash batem com as URLs devolvidas pela API do Commons
KNOWN = {
    "Lionroar.wav": "d/d3",
    "Wolf howls.ogg": "8/87",
    "Turdus rufiventris - Rufous-bellied Thrush XC112745.mp3": "f/fc",
    "Humpback whale wheezeblow.ogg": "d/d4",
    "Killer whale.ogg": "7/79",
    "Bufo bufo call1.ogg": "0/09",
    "Rattlesnake.ogg": "2/22",
    "Alligatorbellow1.ogg": "1/1a",
    "Florida Cicada Song.ogg": "c/c3",
    "Howler monkey.ogg": "b/b8",
    "Turdus-rufiventris.jpg": "4/44",
    "Common Blackbird.jpg": "a/a9",
    "Bald eagle about to fly in Alaska (2016).jpg": "d/db",
    "Eudyptula minor Bruny 1.jpg": "3/38",
    "Rauchschwalbe Hirundo rustica.jpg": "7/7d",
    "Luscinia megarhynchos - Common nightingale - Nachtegaal (cropped).jpg": "f/f1",
    "Alcedo atthis -England-8 (cropped).jpg": "b/bc",
    "House sparrow male in Prospect Park (53532).jpg": "9/9b",
    "072 Wild European goldfinch at the Parc Jura vaudois Photo by Giles Laurent.jpg": "e/eb",
    "Male northern cardinal in Central Park (52612).jpg": "5/5c",
    "Coturnix coturnix, Fraunberg, Bayern, Deutschland 1, Ausschnitt.jpg": "4/4f",
    "Corvus corax clarionensis, Point Reyes National Seashore.jpg": "9/91",
    "Peacock on tree (52077240794).jpg": "7/7f",
}
for fname, expect in KNOWN.items():
    got = mwpath(fname)
    assert got == expect, "hash divergente para %s: %s != %s" % (fname, got, expect)

data_json = json.dumps(rows, ensure_ascii=False, separators=(",", ":"))
groups_json = json.dumps(GROUPS, ensure_ascii=False, separators=(",", ":"))

shell = open(os.path.join(HERE, "fauna_shell.html"), encoding="utf-8").read()
inline = "const GROUP_LABELS = %s;\nconst DATA = %s;" % (groups_json, data_json)
assert "__DATA__" in shell and "__COUNT__" in shell
shell = shell.replace("__DATA__", inline).replace("__COUNT__", str(len(rows)))

with open(OUT, "w", encoding="utf-8") as fh:
    fh.write(shell)

per_group = {}
for r in rows:
    per_group[r["c"]] = per_group.get(r["c"], 0) + 1
print("fauna.html ->", OUT, os.path.getsize(OUT), "bytes")
print("espécies:", len(rows), "|", ", ".join("%s=%d" % (k, v) for k, v in per_group.items()))
fmts = {}
for r in rows:
    f = r["g"].rsplit(".", 1)[-1].lower()
    fmts[f] = fmts.get(f, 0) + 1
print("formatos de áudio:", fmts)

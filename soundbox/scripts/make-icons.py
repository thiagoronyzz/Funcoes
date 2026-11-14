#!/usr/bin/env python3
"""Gera os ícones PNG do SOUNDBOX (barras de equalizador sobre fundo escuro).

Sem dependências externas: rasteriza com supersampling e escreve PNG via zlib.
Uso: python3 scripts/make-icons.py
"""
import struct
import zlib
from pathlib import Path

BG = (0x12, 0x12, 0x12)
GREEN = (0x1D, 0xB9, 0x54)

# x, largura, y, altura (frações do lado)
BARS = [
    (0.300, 0.090, 0.355, 0.290),
    (0.455, 0.090, 0.215, 0.570),
    (0.610, 0.090, 0.320, 0.360),
]

SS = 4  # supersampling


def in_round_rect(px, py, x, y, w, h, r):
    if not (x <= px <= x + w and y <= py <= y + h):
        return False
    cx = min(max(px, x + r), x + w - r)
    cy = min(max(py, y + r), y + h - r)
    return (px - cx) ** 2 + (py - cy) ** 2 <= r * r


def render_rows(size):
    """Renderiza em alta resolução e devolve linhas de bytes RGB."""
    big = size * SS
    rows = []
    for by in range(big):
        py = (by + 0.5) / SS
        row = bytearray()
        for bx in range(big):
            px = (bx + 0.5) / SS
            color = BG
            for fx, fw, fy, fh in BARS:
                w, h = fw * size, fh * size
                if in_round_rect(px, py, fx * size, fy * size, w, h, w / 2):
                    color = GREEN
                    break
            row.extend(color)
        rows.append(row)
    return rows


def encode_png(size, rows):
    def chunk(tag, data):
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    raw = bytearray()
    for y in range(size):
        raw.append(0)  # filtro None
        for x in range(size):
            r = g = b = 0
            for sy in range(SS):
                src = rows[y * SS + sy]
                for sx in range(SS):
                    i = (x * SS + sx) * 3
                    r += src[i]
                    g += src[i + 1]
                    b += src[i + 2]
            n = SS * SS
            raw.extend((r // n, g // n, b // n))

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )


def main():
    root = Path(__file__).resolve().parent.parent
    for size in (192, 512):
        data = encode_png(size, render_rows(size))
        path = root / f"icon-{size}.png"
        path.write_bytes(data)
        print(f"{path.name}: {len(data)} bytes")


if __name__ == "__main__":
    main()

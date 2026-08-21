#!/usr/bin/env python3
"""Glas-Katalog in Einzelseiten aufteilen — kanonischer Vollbild-Rahmen.

Originalstruktur (glas.pdf): 15 Seiten, je eine Doppelseite (zwei physische
Katalogseiten) pro PDF-Seite. Cover (1) und Rueckseite (15) bleiben unveraendert.

Das rote Vollbild auf Seite 2 links definiert die kanonische Seiten-Dimension:
ein 298x298-Quadrat, das die volle Halbseitenbreite ausfuellt und vertikal
zentriert sitzt (oben/unten je 149 px Rand). Dieser Rahmen gibt den weissen
Rand aller Seiten vor — auch jener ohne Vollbild. Jede Halbseite wird lediglich
auf diesen Rahmen zugeschnitten (nicht skaliert, nicht verschoben); der Inhalt
bleibt wie im Original zentriert, die weissen Raender werden mit ausgeschnitten.
Dadurch sitzen die Seitenzahlen automatisch im gleichen Abstand zur Unterkante.
"""
import pymupdf

INPUT = "public/kataloge/glas.pdf"
OUTPUT = "public/kataloge/glas_pages.pdf"
ZOOM = 2.0
PAGE = 596
FRAME_TOP = 148
FRAME_BOT = 446


def main():
    src = pymupdf.open(INPUT)
    out = pymupdf.open()
    first, last = 0, len(src) - 1

    for i in range(len(src)):
        if i in (first, last):
            out.insert_pdf(src, from_page=i, to_page=i)
            continue

        # Kanonischer Rahmen in PDF-Koordinaten: volle Halbbreite (298), y[149..447].
        side = PAGE // 2

        for hx in (0, side):
            clip = pymupdf.Rect(hx, FRAME_TOP, hx + side, FRAME_BOT)
            pix = src[i].get_pixmap(matrix=pymupdf.Matrix(ZOOM, ZOOM), clip=clip)
            page = out.new_page(width=PAGE, height=PAGE)
            page.insert_image(pymupdf.Rect(0, 0, PAGE, PAGE), pixmap=pix)

    out.save(OUTPUT, garbage=4, deflate=True)
    print("Wrote", OUTPUT, "with", len(out), "pages")


if __name__ == "__main__":
    main()

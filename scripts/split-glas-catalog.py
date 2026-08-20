#!/usr/bin/env python3
"""Glas-Katalog in Einzelseiten aufteilen — konsistente Layout-Modi.

Originalstruktur (glas.pdf): 15 Seiten, je eine Doppelseite (zwei physische
Katalogseiten) pro PDF-Seite. Cover (1) und Rueckseite (15) bleiben unveraendert.

Je physische Haelfte wird einer von vier Layout-Modi zugeordnet:
- "FULL"    : Foto randlos ueber die gesamte Seite (Cover).
- "PAD"     : Layout-Seite (Text/Foto mit bewussten Raendern), unten verankert.
- "top"     : Foto volle Breite oben randlos + Caption unten mit gleichen Raendern.
- "bottom"  : Foto volle Breite unten + Caption darueber (gleiche Raender).
- "contain" : Foto volle Breite, vertikal zentriert (Raender oben+unten).

Bleed-Streifen (Ueberhang der linken Seite ueber die Mitte) werden entfernt.
"""
import io
import pymupdf
import numpy as np
from PIL import Image

INPUT = "public/kataloge/glas.pdf"
OUTPUT = "public/kataloge/glas_pages.pdf"
ZOOM = 2.0
PAGE = 596
PAD_FRACTION = 0.08
WHITE_MIN = 250
BLEED_MAX_FRAC = 0.26
WREL_FULL = 0.90
BOTTOM_BAND = 0.12
BOTTOM_FULL_DENSITY = 0.62
PHOTO_MIN_DENS = 0.30
FOTO_DENSE = 0.18          # Zeilen-Dichte-Schwelle fuer Fotozeilen (helle Fotos miterfassen)
CAPTION_GAP_FRAC = 0.05
PHOTO_SPARSE_FRAC = 0.05   # Mindest-Dichte beim Expandieren auf helle Foto-Bereiche

# Buchseite im ZOOM-Raster: originale Proportionen bleiben erhalten, damit die
# weissen Raender identisch sind.
PAGE_W = PAGE * ZOOM

# Foto+Caption-Seiten (Spread, Haelfte) -> Modus
FOTO_LAYOUT = {
    (5, "R"): "contain",
    (6, "L"): "top",   (6, "R"): "top",
    (8, "L"): "top",   (8, "R"): "top",
    (12, "L"): "contain", (12, "R"): "contain",
}

LOG = []
cur_spread = 0
cur_half = ""


def mask_of(arr):
    return arr.min(axis=2) < WHITE_MIN


def png_bytes(img):
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def new_page(out):
    return out.new_page(width=PAGE, height=PAGE)


def put_image(page, img, x, y, w, h):
    """Bild exakt in das Rechteck setzen — PyMuPDF darf bei abweichendem
    Seitenverhaeltnis nicht stauchen/zentrieren (keep_proportion=True wuerde
    das Bild innerhalb des Rechtecks verschieben). Fuer vertikale Streckungen
    wird der Canvas vorab aufgezogen."""
    if (w, h) != img.size:
        padded = Image.new("RGB", (w, h), (255, 255, 255))
        x0 = (w - img.width) // 2
        y0 = (h - img.height) // 2
        padded.paste(img, (x0, y0))
        img = padded
    page.insert_image(pymupdf.Rect(x, y, x + w, y + h), stream=png_bytes(img), keep_proportion=False)


def crop_img(arr, x0, y0, x1, y1):
    return Image.fromarray(arr[y0:y1, x0:x1], "RGB")


def photo_bands(m):
    """Durchgehende Zeilen mit hoher Dichte = Fotomand (y0,y1,dichte).

    Nur Zeilen mit FOTODICHTE (~>0.55) gehoeren zum Foto; die haeufigen
    dichten Text-/Design-Zeilen (0.3-0.5) fallen damit heraus, sodass die
    Bildunterschrift nicht ins Foto hineingezogen wird.
    """
    rows = m.sum(axis=1)
    n = len(rows)
    dense = rows > FOTO_DENSE * m.shape[1]
    bands = []
    i = 0
    while i < n:
        if dense[i]:
            y0 = i
            while i < n and dense[i]:
                i += 1
            y1 = i - 1
            dens = m[y0:y1 + 1].mean()
            if y1 - y0 + 1 > n * 0.03:
                bands.append((y0, y1, dens))
        else:
            i += 1
    return bands


def cover_into(out, arr, x0, y0, x1, y1):
    """Cover-Fit auf volle Seite (Aspekt erhalten, Ueberschuss ab)."""
    img = crop_img(arr, x0, y0, x1, y1)
    w, h = img.size
    scale = max(PAGE / w, PAGE / h)
    nw, nh = round(w * scale), round(h * scale)
    img = img.resize((nw, nh), Image.LANCZOS)
    cx0 = (nw - PAGE) // 2
    cy0 = (nh - PAGE) // 2
    img = img.crop((cx0, cy0, cx0 + PAGE, cy0 + PAGE))
    put_image(new_page(out), img, 0, 0, PAGE, PAGE)


def embed_padded(out, arr, x0, y0, x1, y1):
    """Contain, unten verankert mit einheitlichem Rand."""
    img = crop_img(arr, x0, y0, x1, y1)
    inner = (1.0 - 2 * PAD_FRACTION) * PAGE
    scale = min(inner / img.width, inner / img.height)
    new_w, new_h = round(img.width * scale), round(img.height * scale)
    img = img.resize((new_w, new_h), Image.LANCZOS)
    ix0 = (PAGE - new_w) // 2
    iy0 = PAGE - new_h - int(PAD_FRACTION * PAGE)
    page = out.new_page(width=PAGE, height=PAGE)
    page.insert_image(pymupdf.Rect(ix0, iy0, ix0 + new_w, iy0 + new_h), stream=png_bytes(img))


def emit_fullwidth_contain(out, arr, bx0, by0, bx1, by1):
    """Foto volle Breite (keine Raender L/R), zentriert -> weisse Raender oben+unten."""
    img = crop_img(arr, bx0, by0, bx1 + 1, by1 + 1)
    new_w = PAGE
    new_h = round(PAGE * (by1 - by0 + 1) / (bx1 - bx0 + 1))
    img = img.resize((new_w, new_h), Image.LANCZOS)
    iy0 = (PAGE - new_h) // 2
    page = out.new_page(width=PAGE, height=PAGE)
    page.insert_image(pymupdf.Rect(0, iy0, new_w, iy0 + new_h), stream=png_bytes(img))


def photo_and_caption(arr, hx, side, by0, by1):
    """(photo_y0, photo_y1, caption_y0, caption_y1) in Seitenkoordinaten."""
    m = mask_of(arr[:, hx:hx + side])
    bands = photo_bands(m)
    if not bands:
        return None
    photo = max(bands, key=lambda b: b[2])
    py0, py1 = photo[0], photo[1]
    # Caption ist der restliche Inhalt (im Foto-BBox-Bereich)
    return (py0, py1, by0, py1 - 1) if by0 < py0 else (py0, py1, py1 + 1, by1)


def compose(out, arr, hx, side, bx, by0, by1, mode, target_top_h=None):
    """Foto+Caption-Seite: Foto volle Breite, Caption mit gleichen Raendern.

    Alle Geometrien liegen im ZOOM-Raster (side = Seite/2 in Pixeln). Die
    Buchseite ist PAGE*ZOOM breit; so bleiben die Proportionen des Originals
    erhalten und die weissen Raender sind identisch.

    - "contain": nur das FOTO vertikal zentrieren (weisser Rand oben == unten),
      die Caption rutscht in den verbleibenden Rand (oben oder unten je nach
      Original-Reihenfolge).
    - "top":    foto oben buendig; mit target_top_h wird die Fotohohe der
      linken Spread-Seite uebernommen, damit beide Haelfen bwendig abschliessen.
    """
    global cur_spread, cur_half
    m = mask_of(arr[:, hx:hx + side])
    bands = photo_bands(m)
    if not bands:
        embed_padded(out, arr, hx + bx[0], by0, hx + bx[1] + 1, by1 + 1)
        return
    photo = max(bands, key=lambda b: b[2])
    py0, py1 = photo[0], photo[1]
    # Auf helle Foto-Bereiche nach oben erweitern: das dichteste Band erfasst
    # bei sehr hellen Bildern (z. B. Himmel) nur den unteren Teil. Nach oben
    # wird so lange expandiert, wie die Zeilen noch erkennbaren Inhalt zeigen
    # (bis zur Luecke/Bildkante). Nach unten nicht expandieren — dort folgt
    # haeufig direkt die Caption.
    rows = m.sum(axis=1)
    while py0 > 0 and rows[py0 - 1] > PHOTO_SPARSE_FRAC * side:
        py0 -= 1
    px0, px1 = bx[0], bx[1]
    if mode == "bottom":
        cap_top, cap_bot = by0, py0 - 1
    else:
        cap_top, cap_bot = py1 + 1, by1

    # ZOOM-Raster: gesamte Buchseite ist PAGE*ZOOM breit
    photo_w = px1 - px0 + 1
    scale = PAGE_W / photo_w
    img_w = int(PAGE_W)
    img_h = max(1, round(scale * (py1 - py0 + 1)))
    cap_w = int(PAGE_W)
    cap_h = max(1, round(scale * (cap_bot - cap_top + 1)))

    photo_img = crop_img(arr, hx + px0, py0, hx + px1 + 1, py1 + 1).resize((img_w, img_h), Image.LANCZOS)
    cap_img = crop_img(arr, hx + px0, cap_top, hx + px1 + 1, cap_bot + 1).resize((cap_w, cap_h), Image.LANCZOS)

    # Rechte Haelfte buendig zur linken: Foto auf Zielhoehe strecken und den
    # PNG-Farbraum erweitern, damit PyMuPDF (keep_proportion) das Bild nicht
    # innerhalb des Rechtecks zentriert/verschiebt.
    if target_top_h and target_top_h != img_h:
        img_h = target_top_h
        photo_img = photo_img.resize((img_w, img_h), Image.LANCZOS)

    # Zielseite im 596er-Koordinatenraum
    page = out.new_page(width=PAGE, height=PAGE)
    to_page = ZOOM  # Pixel -> Seitenpunkte

    if mode == "bottom":
        # Foto unten buendig, Caption darueber: Abstand(Caption->Foto) == Abstand(Caption->Oberkante)
        gap = (PAGE_W - img_h - cap_h) // 2
        gap = max(0, gap)
        py = PAGE_W - img_h
        cy = py - cap_h - gap
        cy = max(0, cy)
        page.insert_image(pymupdf.Rect(0, py / to_page, PAGE, PAGE),
                          stream=png_bytes(photo_img))
        page.insert_image(pymupdf.Rect(0, cy / to_page, PAGE, (cy + cap_h) / to_page),
                          stream=png_bytes(cap_img))
    elif mode == "contain":
        # Nur das FOTO vertikal zentrieren: weisser Rand oben und unten exakt
        # gleich. Die Caption wandert in den restlichen Rand (Seite = ZOOM-Raster).
        top = (PAGE_W - img_h) // 2
        photo_bot = top + img_h
        cap_above = cap_bot < py0
        if cap_above:
            cy = top - cap_h
            cy = max(0, cy)
            page.insert_image(pymupdf.Rect(0, cy / to_page, PAGE, (cy + cap_h) / to_page),
                              stream=png_bytes(cap_img))
        else:
            cy = photo_bot
            page.insert_image(pymupdf.Rect(0, cy / to_page, PAGE, (cy + cap_h) / to_page),
                              stream=png_bytes(cap_img))
        page.insert_image(pymupdf.Rect(0, top / to_page, PAGE, photo_bot / to_page),
                          stream=png_bytes(photo_img))
    else:  # top
        # Foto oben buendig, Caption unten: Abstand(Foto->Caption) == Abstand(Caption->Unterkante)
        if target_top_h:
            img_h = target_top_h
        gap = (PAGE_W - img_h - cap_h) // 2
        gap = max(0, gap)
        cy = PAGE_W - cap_h - gap
        page.insert_image(pymupdf.Rect(0, 0, PAGE, img_h / to_page),
                          stream=png_bytes(photo_img))
        page.insert_image(pymupdf.Rect(0, cy / to_page, PAGE, (cy + cap_h) / to_page),
                          stream=png_bytes(cap_img))


def main():
    src = pymupdf.open(INPUT)
    out = pymupdf.open()
    first, last = 0, len(src) - 1

    for i in range(len(src)):
        if i in (first, last):
            out.insert_pdf(src, from_page=i, to_page=i)
            continue
        cur_spread = i + 1
        cur_half = ""
        pix = src[i].get_pixmap(matrix=pymupdf.Matrix(ZOOM, ZOOM))
        arr = np.frombuffer(pix.samples, dtype=np.uint8).reshape(
            pix.height, pix.width, pix.n)[:, :, :3].copy()
        w, h = arr.shape[1], arr.shape[0]
        side = w // 2
        prev_top_h = None

        for hx in (0, side):
            half = "L" if hx == 0 else "R"
            cur_half = half
            # Rechte Haelfte: dunkle Scan-Falzlinie an der Buchrückenkante
            # (x=0..2) entfernen, sonst entsteht an der Mittellinie eine
            # sichtbare Stufe im hellen Bildbereich. Nur Zeilen behandeln, in
            # denen die Linie ISOLIERT ist (Spalten 0..2 dunkel, Spalten 3..5
            # leer) — vollflaechige Foto-/Caption-Zeilen bleiben unangetastet.
            # Nur fuer top/bottom-Haelften, deren Bild bis zur Kante randlos
            # laeuft; contain-Seiten (eigenzentriert) bleiben unveraendert.
            if hx == side and FOTO_LAYOUT.get((i + 1, half)) in ("top", "bottom"):
                edge = arr[:, hx:hx + 6, :]
                em = edge.min(axis=2) < 250
                lone = em[:, 0:3].any(axis=1) & ~em[:, 3:6].any(axis=1)
                if lone.any():
                    arr[lone, hx:hx + 3, :] = 255
            sub = arr[:, hx:hx + side]
            m = mask_of(sub)

            # Bleed-Bereinigung (nur rechte Haelfte)
            start_x = 0
            if hx == side:
                cols = m.sum(axis=0)
                if int(cols.sum()) > 0:
                    fc = int(np.argmax(cols > 0))
                    if fc < BLEED_MAX_FRAC * side:
                        end = fc
                        while end < side and cols[end] > 0:
                            end += 1
                        if end - fc < BLEED_MAX_FRAC * side:
                            start_x = end

            region = m[:, start_x:]
            ys, xs = np.where(region)
            if xs.size == 0:
                new_page(out)
                LOG.append((i + 1, half, 0, 0, 0, 0, 0, 0, 0, 0, "BLANK"))
                continue
            bx0 = int(xs.min()) + start_x
            bx1 = int(xs.max()) + start_x
            by0, by1 = int(ys.min()), int(ys.max())

            wrel = (bx1 - bx0 + 1) / side
            band0 = by1 - int(BOTTOM_BAND * (by1 - by0))
            bottom = float(m[band0:by1 + 1, bx0:bx1 + 1].mean())
            is_full = wrel >= WREL_FULL and bottom >= BOTTOM_FULL_DENSITY
            mode = FOTO_LAYOUT.get((i + 1, half))

            # Rechte Haelfte an die linke angleichen (nur top/bottom, wo die
            # Kanten buendig uebereinanderliegen muessen). "contain"-Seiten
            # (z. B. 12) behalten ihre eigenen Proportionen und werden jede
            # fuer sich vertikal zentriert — ein Strecken wuerde das Foto
            # verzerren.
            target_top_h = None
            if half == "R" and mode in ("top", "bottom"):
                top_h = prev_top_h
                if top_h:
                    target_top_h = top_h

            if mode in ("top", "bottom", "contain"):
                compose(out, arr, hx, side, (bx0, bx1), by0, by1, mode, target_top_h)
            elif is_full:
                cover_into(out, arr, hx + bx0, by0, hx + bx1 + 1, by1 + 1)
            else:
                embed_padded(out, arr, hx + bx0, by0, hx + bx1 + 1, by1 + 1)

            if half == "L":
                prev_top_h = None
                if mode in ("top", "bottom"):
                    m_band = mask_of(arr[:, hx:hx + side])
                    rows = m_band.sum(axis=1)
                    n = len(rows)
                    dense = rows > FOTO_DENSE * side
                    k = 0
                    best = None
                    while k < n:
                        if dense[k]:
                            y0 = k
                            while k < n and dense[k]:
                                k += 1
                            y1 = k - 1
                            if best is None or (y1 - y0) > (best[1] - best[0]):
                                best = (y0, y1)
                        else:
                            k += 1
                    if best:
                        prev_top_h = int(round((best[1] - best[0] + 1) * PAGE_W / (bx1 - bx0 + 1)))

            LOG.append((i + 1, half, start_x, bx0, bx1, by0, by1,
                        round(wrel, 2), round(bottom, 2), 0.0,
                        mode or ("FULL" if is_full else "PAD")))

    out.save(OUTPUT, garbage=4, deflate=True)
    print("Wrote", OUTPUT, "with", len(out), "pages")
    print("--- diagnostics ---")
    for r in LOG:
        print("spread %2d %s bleed=%3d bbox x[%d..%d] y[%d..%d] wrel=%.2f bottom=%.2f -> %s"
              % (r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[10]))


if __name__ == "__main__":
    main()

# Himmelspforten Galerie-Layout Plan

**Goal:** Neues Galerie-Layout `1-3e` (equal): 3 Fenster nebeneinander gleich groß + Detailbild volle Breite darunter, für das Werk Himmelspforten.

**Dateien:**
- Modify: `src/content.config.ts` (Enum `image_layout` um `'1-3e'` erweitern)
- Modify: `src/layouts/WorkLayout.astro` (neues Layout `1-3e` + CSS)
- Modify: `src/content/works/kabs/himmelspforten.md` (`image_layout: "1-3e"`)

**Review:** full-check

## Schritte (konkret)

1. **`src/content.config.ts`:** `image_layout: z.enum(['1-1', '1-2', '1-3', '1-3e', '1-4', '1-4w', '1-5'])` — `'1-3e'` ergänzen.

2. **`src/layouts/WorkLayout.astro`** — neues Layout-Block nach dem `1-3`-Block (nach Zeile ~210, vor `1-4`):
   - Bedingung: `frontmatter.image_layout === "1-3e" && galleryImages.length === 4`
   - Struktur: `<div class="gallery-equal-3">` mit den ersten 3 Galeriebildern als gleich große Zellen (Grid `repeat(3, 1fr)`), danach `<div class="gallery-equal-3__detail">` mit dem 4. Bild volle Breite.
   - Jede Zelle: `<button class="gallery-btn" data-lightbox={lightboxOffset + i}>` + `<Image>` (wie bestehende Layouts, `loading="lazy"`).
   - Detail: `<button class="gallery-btn" data-lightbox={lightboxOffset + 3}>` + `<Image>`.

3. **`src/layouts/WorkLayout.astro`** — CSS ergänzen (bei den anderen Galerie-Layouts):
   ```css
   /* 3 Bilder gleich groß nebeneinander + Detailbild volle Breite darunter. */
   .gallery-equal-3 {
     display: grid;
     grid-template-columns: repeat(3, 1fr);
     grid-auto-rows: 1fr;
     gap: 0.5rem;
   }
   .gallery-equal-3__cell { overflow: hidden; }
   .gallery-equal-3__cell img { width: 100%; height: 100%; object-fit: cover; }
   .gallery-equal-3__detail { grid-column: 1 / -1; }
   .gallery-equal-3__detail img { width: 100%; height: auto; }
   ```
   Mobile (max-width: 740px): Zellen untereinander stapeln (`grid-template-columns: 1fr`).

4. **`src/content/works/kabs/himmelspforten.md`:** `image_layout: "1-3"` → `"1-3e"`.

## Verifikation
- `npm run build` (exit 0, 73+ Seiten)
- Browser `http://localhost:<port>/ep_website/kabs/himmelspforten`:
  - 3 Fenster nebeneinander, gleiche Breite (getBoundingClientRect: 3 Zellen mit identischer width)
  - Detailbild (5.jpg) volle Breite darunter
  - Alle 5 Bilder in der Lightbox erreichbar (Klick auf jedes Bild öffnet Großansicht)

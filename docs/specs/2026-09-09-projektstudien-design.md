# Projektstudien — Design Spec

**Datum:** 2026-09-09
**Kategorie:** Architectural
**Status:** Entwurf

## Ziel

Nicht realisierte Kunst-am-Bau-Projekte („Projektstudien") aus 8 PDFs im
`src/assets/Projektsudien_Referenzen/` auf die Website bringen: als eigener
Unterabschnitt auf der Werke-Seite, mit individuellen Detailseiten, deren
Layout die PDF-Anordnung (Text- und Bildpositionen) rekonstruiert.

## Machbarkeit (verifiziert)

- `pdfjs-dist` (bereits Dependency) liest alle 8 PDFs vollständig: Text mit
  x/y-Koordinaten + Schriftgrößen, Seitenmaße, eingebettete Bilder.
- 28 Bilder extrahierbar (getestet: 1283×799 PNG via `@napi-rs/canvas`,
  bereits Dependency).
- Metadaten (Ort, Jahr, Auftraggeber, Material, Maße) liegen als Text vor.
- **Einschränkung:** Das Modell kann Bilder nicht *sehen*. Layout wird über
  Koordinaten rekonstruiert, nicht visuell beurteilt.

## Die 8 Projektstudien

| Slug | Titel | Ort | Jahr | Material |
|---|---|---|---|---|
| bubbles | „Bubbles" | Hallenbad Altenkirchen | 2023 | Glasmosaik, 14×2,40 m |
| balla-balla | „Balla Balla" | Sporthalle Bad Bergzabern | 2020 | Malerei, Glasfolierung, Email |
| sportler-in-bewegung | „Sportler in Bewegung" | Schulsporthalle Bad Bergzabern | 2020 | Wandmalerei |
| dschungel | „Dschungel" | Kita Jakob Laubach-Str., Mainz | — | Fassadenmalerei + Stahlemail |
| stoerche-froesche | „Störche & Frösche" | Offenbach/Queich | 2003/2025 | Stahlblech, emailliert |
| entwicklung | „Entwicklung" | Kita zum Abtswald, Wörth/Rh. | 2021 | Emaillierte Stahlbleche |
| skydance | „Skydance" | Kulturheim Weisenau, Mainz | 2022 | Aluminium-Raumplastik |
| stadttor | „Stadttor" | Universität Koblenz-Landau | 2017 | Stahl + Glas |

## Architektur

### 1. Content-Collection `projektstudien`

`content.config.ts` bekommt eine zweite Collection:

```ts
const projektstudien = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projektstudien' }),
  schema: z.object({
    title: z.string(),
    location: z.string().optional(),
    year: z.string().optional(),
    client: z.string().optional(),
    material: z.string().optional(),
    description: z.string().optional(),
    image_dir: z.string(),
    images: z.array(z.string()).optional(),
  }),
});
```

`src/content/projektstudien/<slug>.md` (8 Dateien) mit Frontmatter + Body
(Beschreibungstext). Getrennt von `works` — realisiert vs. nicht-realisiert
sauber getrennt.

### 2. Extraktions-Script (einmalig, committet)

`scripts/extract-projektstudien.mjs`:
- Liest die 8 PDFs aus `src/assets/Projektsudien_Referenzen/`.
- Extrahiert Bilder nach `src/assets/projektstudien/<slug>/N.jpg` (via
  `pdfjs-dist` + `@napi-rs/canvas`, RGB→RGBA-Konvertierung).
- Generiert `src/content/projektstudien/<slug>.md` mit Metadaten + Text.
- Läuft **einmalig**; Ergebnis (Assets + Markdown) wird committet. Die PDFs
  bleiben im Repo (Quelle), werden aber nicht bei jedem Build geparst.

### 3. Werke-Seite — eigene Kategorie

`work.astro` bekommt eine neue Kategorie „Projektstudien" (eigene Section mit
eigenem Grid). Karten verlinken auf `/projektstudien/<slug>`.

### 4. Detailseiten — 8 individuelle Seiten

`src/pages/projektstudien/[slug].astro` mit `getStaticPaths` über die
`projektstudien`-Collection. **Jede Seite hat ein eigenes, handgeschriebenes
Layout** — kein gemeinsames `image_layout`-Schema, da die PDFs kein
reproduzierbares Muster haben.

Layout-Rekonstruktion pro PDF (aus Koordinaten):
- **bubbles**: Titel oben links, Beschreibungstext links (mehrspaltig), 1
  großes Bild + 3 kleine Detailbilder rechts.
- **balla-balla**: 2 breite Querformat-Bilder, Textblöcke dazwischen.
- **sportler-in-bewegung**: 2 Seiten, je 1 großes Bild + Textblock.
- **dschungel**: Vollbild-Bild, Text überlagert.
- **stoerche-froesche**: Bild + kurzer Textblock.
- **entwicklung**: Bild rechts, Text links (zweispaltig).
- **skydance**: Text links (mehrspaltig), Bild rechts.
- **stadttor**: Titel + Metadaten oben, Text links, Bild rechts.

Die genaue Anordnung wird in Phase B pro PDF aus den Koordinaten abgeleitet
und als individuelles Astro-Markup umgesetzt.

### 5. Routing & Navigation

- `getStaticPaths` in `[slug].astro` erzeugt `/projektstudien/<slug>`.
- Werke-Seite verlinkt die Kategorie; Detailseiten nutzen `BaseLayout`.

## Dateien

- Modify: `src/content.config.ts` (neue Collection)
- Create: `scripts/extract-projektstudien.mjs` (einmaliges Parsing)
- Create: `src/content/projektstudien/*.md` (8 Dateien, generiert)
- Create: `src/assets/projektstudien/<slug>/*.jpg` (28 Bilder, extrahiert)
- Modify: `src/pages/work.astro` (Kategorie „Projektstudien")
- Create: `src/pages/projektstudien/[slug].astro` (Routing + 8 individuelle Layouts)

## Testing

- `npm run build` (exit 0)
- Browser-Check: Werke-Seite zeigt Kategorie „Projektstudien"; jede der 8
  Detailseiten rendert korrekt (Bilder + Text, Layout PDF-getreu); keine
  kaputten Links/Bilder.

## Offene Punkte

- Bild-Extraktion: `@napi-rs/canvas` `clip()`-Inkompatibilität beim
  Vollseiten-Render — Workaround: Bilder direkt aus `page.objs` (RGB→RGBA)
  extrahieren statt Vollseiten-Render (bereits verifiziert).
- Einige PDFs haben OCR-/Layout-Artefakte (z. B. zusammengeflossene
  Textzeilen) — in Phase B manuell bereinigen.

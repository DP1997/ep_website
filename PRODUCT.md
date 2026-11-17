# PRODUCT — Projektstudien (Elke Pfaffmann)

## Was es ist
Portfolio-Website der Künstlerin Elke Pfaffmann (Glas – Licht – Architektur).
Die **Projektstudien** sind je eine Detailseite pro Kunst-am-Bau-Projekt:
ein Blatt mit Metainformationen, Bildern und Beschreibungstext.

## Publikum und Aufgabe
Architekt:innen, Kommunen, Schulen, Kurator:innen. Die Seite soll das Werk
zeigen und die Projektdaten (Ort, Jahr, Auftraggeber, Maße) beiläufig liefern.
Sprache: Deutsch. Inhaltliche Wahrheit ist das jeweilige Projekt-PDF.

## Modus
- **Experience**: das Kunstwerk führt, die Oberfläche tritt zurück.
- **Galerie-Look** (2026): Bildflächen führen, Schrift als ruhiger Rand,
  strenges Raster, mehr Luft.
- Vorbild ist das PDF-Blatt (1190/1191 × 850), im Viewport nachgebaut.

---

# Verbindliche Constraints

## 1. Fläche und Rahmen
- **Header/Nav bleiben auf dem 3vw-Rahmen.**
- **Projektstudien-Inhalt auf dem dreifachen Rahmen (9vw)** = 3vw Body +
  6vw Blatt-Padding. Der Header wird dabei nicht mitgezogen.
- **3vw ist Mindestrahmen, kein Zwang.** Das von den Außenkanten der
  Bild-/Textelemente aufgespannte Rechteck darf schmaler als 9vw sein.
  Entscheidend ist die **innere Dichte**, nicht das Anliegen an der
  Viewport-Kante.
- **Vertikal füllen:** Blatthöhe = `100vh − 13.5rem − 3vw`; Oberkante auf
  Höhe des KAB-Hero, Unterkante am 3vw-Rahmen (bis zum Footer).
  Ausnahme Stadttor: `(100vh − 13.5rem) × 1.0876`, damit das Hochformat bei
  100 % Zoom vollständig sichtbar bleibt.
- Kein horizontaler Scroll.
- **Footer-Abstand = 3vw zur tiefsten sichtbaren Inhaltskante.** Bei Seiten
  mit Bildunterschrift zählt die **Unterkante der Unterschrift** (Stadttor,
  Sportler in Bewegung, Skydance), sonst die Unterkante des tiefsten Bildes
  oder Textfelds. Der Footer wird an den Inhalt herangezogen (negativer
  `margin-top` erlaubt) — **nie wird dafür der Inhalt verkleinert oder
  verschoben.** Messbasis: `figure, figcaption, [class*="-text"],
  [class*="-side"]`; die Caption als Border-Box (= letzte Zeilenbox,
  `padding: 0`); das Blatt selbst zählt nicht.

## 2. Raster und Komposition
- Jede Seite ist ein zweidimensionales Raster (Spalten C1..Cn, Zeilen R1..Rm).
  Jedes Element besetzt eine Zelle oder einen Zellbereich; seine Kanten fallen
  auf Zellkanten.
- **Keine Überlappung, keine frei hängenden Bausteine.**
- Elemente einer Zeile teilen Ober-/Unterkante; Elemente einer Spalte teilen
  linke/rechte Kante.
- **Rinnen sind pro Komposition einheitlich** (keine Mischbreiten). In der
  Bubbles-Referenz gilt eine einzige Rinne für alle Abstände: Bild–Bild und
  Text–Bild gleich groß; die Detailbilder werden entsprechend kleiner.
  Zulässig ist eine bewusste vertikale Hierarchie im festen Verhältnis
  (z. B. 2:1 in Entwicklung), aber keine zufälligen Einzelabstände.
- **Horizontale Rinne = 1,5 s** (= 1,5 % der Blattbreite, 17,5 px @1166) auf
  allen Seiten; vertikal bleibt sie fit-gebunden (§10). Ausnahme: Bubbles
  (Referenzkomposition, G = 2× Block = 34,6 px @1440).
- **Textspaltenbreite wird so gewählt, dass der Fließtext die passende
  Zeilenzahl/Höhe erreicht** (Ober-/Unterkante bündig zum Raster); der rote
  Rahmen umschließt den Text exakt, statt das Feld auf Nachbarhöhe zu
  strecken.
- **Innenfläche ≥ 90 %** (Summe Elementflächen / Silhouette); Kantenabdeckung
  ≥ 95 %; mindestens 3 von 4 Außenkanten ≥ 90 %.
- Das **Hauptbild (Hero) bleibt dominant** (größtes Bild der Komposition).
- Drei kanonische Ansätze je Studie sind zulässig: primär vertikal, horizontal
  oder quadratisch; alle müssen die Regeln oben erfüllen.
- **Bündigkeit ist absolut:** Spalten und Zeilen sind in sich bündig — linke
  und rechte Kante einer Spalte fallen exakt zusammen, obere und untere Kante
  einer Zeile ebenso.
- **Komposition horizontal zentriert:** linker und rechter Abstand der
  Elementgesamtheit zum 9vw-Rahmen sind gleich groß.
- **Bildunterschriften zählen bei der Kanten-/Bündigkeitsberechnung nicht:**
  maßgeblich ist ausschließlich der rote Rahmen um das Bild. Für den
  Footer-Abstand zählt dagegen die Unterschrift (§1).

### Rote Rahmen (Messhilfe)
- Rahmen: **2 px `#d40000`**, `box-sizing: border-box`, `z-index 5000`,
  nur Dev (`?grid=1`), kein Bestandteil des Produkts.
- Bilder: exakt auf der Bildkante, gemessen am `<img>` (nicht an der
  `figure`-Box); Bilder `display: block`.
- Text: exakt auf der **letzten Zeilenbox** — Border-Box des Textblocks
  (= äußere Grenze der Zeilenboxen, `padding: 0`). Half-Leading gehört zum
  Rahmen; „letzter Buchstabe“ ist keine Messbasis.
- Textfelder umschließen den Text; kein auf Nachbarhöhe gestrecktes Feld.
- Die Abnahme misst Element-Rects/Ranges, nie das Overlay.

## 3. Bilder
- **Niemals verzerren.** Skalierung ausschließlich proportional
  (Seitenverhältnis bleibt exakt); keine einseitige Streckung/Stauchung.
- **Kein Beschneiden**, außer wenn das Raster einen **quadratischen Slot**
  verlangt (z. B. die drei Detailbilder bei Bubbles): dann proportionaler,
  mittiger Beschnitt (`object-fit: cover`). Nie in eine Richtung ziehen.
- **Hero bei 100 % Zoom vollständig sichtbar** (kein halbes Bild).
- Kein Bild wird größer dargestellt als der Hero.

## 4. Typografie und Hierarchie
- **Site-Header ist fix:** Wortmarke 30 px, Subtitle 13 px (0.25em),
  Navigation 18 px (small-caps). Nicht verändern.
- **Hierarchie:** Vorgabe ist Wortmarke > Subtitle > Navigation >
  Projektstudien-Titel > Beschreibung > Fließtext. Messwerte des Headers:
  30 / 13 / 18 px; der PS-Titel bleibt unter der Wortmarke und liegt mit
  18 px auf Navigation-Niveau. Die Labels liegen auf Fließtext-Niveau (Key)
  bzw. knapp darunter (Wert) und wirken durch Fettung und Kapitälchen.
- **PS-Stufen relativ zum Body:** Titel 1,4× · Beschreibung 1,04× ·
  Label-Key 1,0× · Label-Wert 0,97× · Body 1×.
- **Eine gemeinsame vw-Skala für alle PS-Seiten** (kein cqw/cqh je Seite):
  `--ps-fs-body: 0.902vw` (12,99 px @1440), `--ps-fs-title: 1.4×Body`
  (1.2628vw / 18,18), `--ps-fs-desc: 1.04×Body` (0.93808vw / 13,51),
  `--ps-fs-label: 1.0×Body` (12,99), `--ps-fs-value: 0.97×Body`
  (0.87494vw / 12,60).
- **Bildunterschriften einheitlich:** `--ps-fs-caption: 1.025vw` (14,76 px
  @1440), Serif-Variante `0.95vw`; keine seitenweisen Caption-Overrides.
- Referenz bei 1440 px: **Titel 18,18 · Beschreibung 13,51 · Key 12,99 ·
  Wert 12,60 · Body 12,99 · Unterschrift 14,76.**
- **Fließtext: Blocksatz + `hyphens: auto`.** Die kurze fette
  Meta-Beschreibung ist die Ausnahme (linksbündig, um in schmalen Spalten
  Wortlücken zu vermeiden).
- Keine seitenweisen Ad-hoc-Schriftgrößen; alles über die Tokens
  (`--ps-fs-*`). Schriften: League Spartan (sans) + Serif; Petrol nur als
  Akzent.

## 5. Navigation und Interaktion
- **PS-Pfeile:** 44 px, Hairline; **mittig in den 3vw-Seitenbändern**
  (Viewport-Kante ↔ Blattkante). Bei ≤ 900 px oder Band < 52 px ausblenden.
- **Vorschau bei Hover/Fokus:** die Karteikarte der Werkeübersicht
  (Bild ca. 200 px mit Cover, Jahr in Petrol-Kapitälchen, Serif-Titel, Ort);
  die ganze Karte ist Teil des Links zum Nachbarprojekt.
- **Home-Hero und Freie Werke:** leise Pfeile (Frosted Glass/Hairline);
  Petrol nur als Hover-Akzent, keine Petrol-Flächen.
- Kein Layoutsprung durch Hover.

## 6. Verhalten
- **Scrollen erlaubt.** „Auf einen Blick“ (ganzes Blatt) ist verworfen.
- Ohne Scrollen sichtbar: **Hero + Titel/Meta**.
- **Mobil (≤ 900 px) ist ein separates Projekt:** gestapelt, Pfeile aus.

## 7. Inhalt
- PDF ist die inhaltliche Wahrheit; keine neuen Texte oder Inhalte.
- Meta: Ort, Jahr, Auftraggeber, Maße.
- **Meta-Labels einzeilig:** Key und Wert stehen in einer Zeile; der Wert
  bricht nicht um.
- Bildunterschriften nur als „Standort …“, sofern im PDF vorhanden.

## 8. Referenzkomposition Bubbles (Muster)
- H = `100vh − 13.5rem − 3vw`. Hero links, Breite 0.931 × H (1010:1085).
- Drei Detailbilder **quadratisch**, Kantenlänge `(H − 2G) / 3`, rechts
  gestapelt; Ober-/Unterkante = Hero.
- Textspalte zwischen Hero und Details: Meta oben, Fließtext unten bündig;
  Breite per Fit so, dass der Fließtext die Spalte füllt (Oberkante =
  Oberkante des zweiten Quadrats, Unterkante = Hero-Unterkante).
- **Alle Rinnen gleich G** (Text–Bild = Bild–Bild); Komposition zentriert,
  darf schmaler als 9vw sein.
- Bei 1440: Hero 672 × 722, Details 217,5, G 34,6, Textspalte ca. 160.

## 9. Abnahme- und Automatisierungs-Checkliste
Für jede Projektstudie bei 1440 × 900 (Stichprobe: 1920 × 1080,
1366 × 768, 1024 × 768):

1. Hero vollständig im Viewport; Oberkante 135,2 px; Abstand
   Subtitle → Inhalt 41,8 px (= KAB-Hero).
2. Keine Überlappung, keine frei hängenden Elemente; gemeinsame Kanten
   (Spalten/Zeilen in sich bündig); Komposition horizontal zentriert;
   Rinnen einheitlich; Innenfläche ≥ 90 %.
3. Text: Blocksatz, kein Overflow, letzte Zeile unten bündig; Textrahmen
   pixelgenau auf der letzten Zeile.
4. Typo: Header 30/13/18; PS 18,18/13,51/12,99/12,60/12,99; Caption 14,76.
5. Bilder: gerendertes Seitenverhältnis = Original (keine Verzerrung);
   Hero vollständig sichtbar; roter Rahmen = Bildkante (`<img>`).
6. Pfeile mittig in den Bändern; Vorschaukarte korrekt; kein h-Scroll.
7. `npm run build` fehlerfrei.
8. Footer-Abstand = 3vw zur tiefsten sichtbaren Kante; auf Caption-Seiten
   (Stadttor, Sportler, Skydance) zur Unterkante der Caption.

### Vorgehen für die Überarbeitung
1. Bilder und Textmenge je Seite erfassen; kanonischen Ansatz wählen.
2. Raster aus den Bildverhältnissen bauen; Rinnen festlegen.
3. Textbreite per Fit einstellen; der Rahmen umschließt den Text exakt
   (nicht auf Nachbarhöhe strecken).
4. Typo-Tokens anwenden; Blocksatz; Bündigkeit prüfen.
5. Checkliste oben abarbeiten, nicht PDF-Prozentpositionen blind kopieren.

## 10. Messung, Einheit und Toleranzen
- **Einheit `s`:** `1 s = 1 % der Blattbreite`; Blatt = 82 vw. Body `1.1 s`,
  Titel `1.54 s`, Beschreibung `1.144 s`, Key `1.1 s`, Wert `1.067 s`,
  Caption `1.25 s`. Bei 1440 px: 12,99 / 18,18 / 13,51 / 12,99 / 12,60 /
  14,76. Heute als `0.902vw` usw. implementiert — rechnerisch identisch
  (`0.902vw = 1.1 s` bei 82 vw).
- **Messbasis:** Bilder = Border-Box des `<img>`; Text = äußere Grenze der
  Zeilenboxen (Border-Box, `padding: 0`); Caption = Border-Box der letzten
  Zeile. Captions sind aus der Bündigkeit ausgeschlossen, im Footer enthalten.
- **Rinnen:** horizontal `1.5 s` (Bubbles: `2.93 s`); vertikal fit-gebunden
  (Untergrenze G, Slack 2:1); Caption/Label `0.5 s`.
- **Toleranzen (1440):** Kante ±1 px; Zentrierung ±4 px; Footer ±2 px;
  Rinne ±1 px; Typo ±0,05 px; Seitenverhältnis ±0,1 %; Überlappung 0 px;
  horizontaler Scroll ≤ 0; Hero-Anteil ≥ 1,3× (Ziel 1,4×); Typo-Floor ≥ 12 px
  ab 1200.
- **Messbedingungen:** nach `load` und `document.fonts.ready`, Chromium,
  DPR 1, `innerWidth` inkl. Scrollbar; alle Werte in CSS-px.
- **Scope:** ab 1200 px exakt; darunter (1024) nur Aspect/Overlap/HScroll;
  Compact/Mobil (P16) ist offen.
- **Contract:** `ps-contract.json` (Parameter, Toleranzen, bekannte
  Abweichungen). **Audit:** `scripts/ps-audit.js` — läuft im geladenen
  Dokument (`PSAudit.run(contract)`) und liefert pro Seite/Viewport
  `summary`, `checks`, `flush`, `hero`, `images`; die Abnahme nutzt dieselben
  Funktionen. Matrix: 1920×1080, 1440×900, 1366×768, 1200×900, 1024×768.

---

## Stand der Umsetzung (2026-11-17)
- **P3h:** horizontale Rinnen auf 1,5 s normalisiert — Dschungel, Balla,
  Sportler, Entwicklung, Skydance, Störche, Stadttor; Bubbles bleibt
  Referenz (2,93 s). Störche-Textunterkante auf die neue Bildreihe
  nachgezogen (70,12 %).
- **Typo:** gemeinsame vw-Skala auf allen acht Studien (Body 0.902vw);
  Bildunterschriften einheitlich 1.025vw (Serif 0.95vw); keine
  cqw/cqh-Overrides je Seite mehr.
- **Dschungel:** 4-spaltiges Raster (12,14 / 58,47 / 11,42 / 10,52 %):
  Meta und Orang-Utan (C1), Hero (C2), Text (C3), Ara/Tukan (C4); kleine
  Bilder in voller Spaltenbreite; Textrahmen auf der Textunterkante.
- **Balla Balla:** Haupttext und Seitentext als Flex-Spalten; Rahmen exakt auf
  der letzten Zeile.
- **Bubbles:** Textfeld-Oberkante = Oberkante des zweiten Quadrats; Fließtext
  füllt die Spalte per Fit; Meta-Beschreibung mit geschützten Leerzeichen.
- **Entwicklung:** Raster 16,12 / 72 %, horizontal zentriert; Bild 100 % der
  Inhaltsspalte; vertikale Rinnen im Verhältnis 2:1 (56 / 28); Text2 unten =
  Bild unten.
- **Skydance:** Spalten 18,4 / 56,0 / 21,87 %; alle gleich hoch; keine
  Überschneidung Meta/Text; zentriert.
- **Sportler in Bewegung:** linke Spalte über Zeile 2–3 mit `space-between`;
  Textunterkante = Fig2-Unterkante; Fig2 rechtsbündig zu Fig1.
- **Störche/Frösche:** Meta-Feldbreite = Fließtext-/Bildkante
  (`calc(100% - 1.176cqh)`).
- **Stadttor:** dreispaltig (21,00 / 37,04 / 39,32 %); Blatthöhe
  `(100vh − 13,5rem) × 1.0876`; Spalten/Figuren 76 %; Labels einzeilig;
  Unterkanten bündig.
- **Footer:** 3vw unter der tiefsten sichtbaren Kante (Caption zählt), Footer
  wird herangezogen (negativer `margin-top`), Inhalt unverändert.
- **Rot-Rahmen-Messhilfe:** Rahmen um `<img>` (nicht um die `figure`-Box),
  um Textfelder und Seiten; auf transformierten Bühnen ohne
  Doppel-Transformation.

## Bekannte Abweichungen / offen
- Stadttor-Blatthöhe weicht von der Basisformel ab (siehe §1).
- Fünf Blätter (Balla, Bubbles, Sportler, Stadttor, Störche) sind 1.165,8 px
  breit statt 1.180,8 (Blattmitte 712,5 statt 720).
- Stadttor-Inhalt ist 24,3 px linkslastig (leere Blattfläche rechts).
- Footer: 40,2–68,8 px in einem Lauf, zuvor 59,9–75,3 px — instabil; das
  Script misst vor dem Font-Load (Render-Klasse).
- Blatt-Oberkante: 135,6–155,6 px, seitenabhängig (langer Seitenkopf),
  Soll 135,2 px.
- Bild-Seitenverhältnisse: 0,04–0,64 % Abweichung (Balla fig2, Dschungel
  fig5, Skydance fig2, Sportler fig1, Störche fig8) — Attribut-/Höhenrundung,
  Render-Klasse.
- Caption 14,76 px (1,25 s) vs. Body 12,99 px; Skydance-Caption in Serif und
  Gewicht 500 statt 400 — beides P10 (Render-Klasse), noch nicht entschieden.
- Dschungel: ~1 px Restabweichung an den Unterkanten (vom Nutzer akzeptiert).
- Innenfläche ≥ 90 % / Kantenabdeckung ≥ 95 % (§2) wurde nach dem Umbau nicht
  neu gemessen.
- Mobil (≤ 900 px) ist weiterhin ein separates Projekt.

## Historie / nicht bindend
- „Auf einen Blick“ (ganzes Blatt im Viewport) wurde 2026 verworfen.
- Ältere Blatt-Basen „schmal“ (ca. 832 × 850) und „groß“ (ca. 1574 × 850)
  waren Planungsbeispiele, keine verbindliche Vorgabe.
- „Body = 1.1cqw“ (Balla-Referenz) und die seitenweisen cqw/cqh-Größen sind
  durch die gemeinsame vw-Skala ersetzt.

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
- Kein horizontaler Scroll.

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
- **Textspaltenbreite wird so gewählt, dass die Texthöhe exakt die Höhe des
  Nachbarbildes ergibt** (Ober- und Unterkante bündig).
- **Innenfläche ≥ 90 %** (Summe Elementflächen / Silhouette); Kantenabdeckung
  ≥ 95 %; mindestens 3 von 4 Außenkanten ≥ 90 %.
- Das **Hauptbild (Hero) bleibt dominant** (größtes Bild der Komposition).
- Drei kanonische Ansätze je Studie sind zulässig: primär vertikal, horizontal
  oder quadratisch; alle müssen die Regeln oben erfüllen.

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
- **Body = 1.1cqw der 9vw-Blattbreite** (Balla-Referenz), auf allen Seiten
  gleich (Ziel); die Meta-Stufen skalieren im selben Verhältnis mit.
- Referenz bei 1440 px: **Titel 18,0 · Beschreibung 13,3 · Key 12,8 ·
  Wert 12,4 · Body 12,8.**
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
- Bildunterschriften nur als „Standort …“, sofern im PDF vorhanden.

## 8. Referenzkomposition Bubbles (Muster)
- H = `100vh − 13.5rem − 3vw`. Hero links, Breite 0.931 × H (1010:1085).
- Drei Detailbilder **quadratisch**, Kantenlänge `(H − 2G) / 3`, rechts
  gestapelt; Ober-/Unterkante = Hero.
- Textspalte zwischen Hero und Details: Meta oben, Fließtext unten bündig;
  Breite per Fit so, dass die Texthöhe H entspricht.
- **Alle Rinnen gleich G** (Text–Bild = Bild–Bild); Komposition zentriert,
  darf schmaler als 9vw sein.
- Bei 1440: Hero 672 × 722, Details 217,5, G 34,6, Textspalte ca. 130.

## 9. Abnahme- und Automatisierungs-Checkliste
Für jede Projektstudie bei 1440 × 900 (Stichprobe: 1920 × 1080,
1366 × 768, 1024 × 768):

1. Hero vollständig im Viewport; Oberkante 135,2 px; Abstand
   Subtitle → Inhalt 41,8 px (= KAB-Hero).
2. Keine Überlappung, keine frei hängenden Elemente; gemeinsame Kanten;
   Rinnen einheitlich; Innenfläche ≥ 90 %.
3. Text: Blocksatz, kein Overflow, letzte Zeile unten bündig.
4. Typo: Header 30/13/18; PS 18,0/13,3/12,8/12,4/12,8.
5. Bilder: gerendertes Seitenverhältnis = Original (keine Verzerrung);
   Hero vollständig sichtbar.
6. Pfeile mittig in den Bändern; Vorschaukarte korrekt; kein h-Scroll.
7. `npm run build` fehlerfrei.

### Vorgehen für die Überarbeitung
1. Bilder und Textmenge je Seite erfassen; kanonischen Ansatz wählen.
2. Raster aus den Bildverhältnissen bauen; Rinnen festlegen.
3. Textspalte auf Nachbar-Bildhöhe einpassen (Breite = Fit).
4. Typo-Tokens anwenden; Blocksatz; Bündigkeit prüfen.
5. Checkliste oben abarbeiten, nicht PDF-Prozentpositionen blind kopieren.

---

## Stand der Umsetzung (2026-11-15)
- **Breite:** Dschungel, Entwicklung, Sportler, Skydance und Stadttor auf die
  9vw-Breite umgestellt (Störche war bereits so). Dschungel neu komponiert
  (Meta/Text links, Hero rechts, drei Porträts in einer Reihe); Entwicklung und
  Sportler als volle Flussraster; Skydance verdichtet; Stadttor mit
  `max-width`-Kappung, damit das hochformatige Hauptbild bei 100 % Zoom
  vollständig sichtbar bleibt (Inhalt dadurch ca. 67–96 % der Rahmenbreite).
- **Body-Einheit:** Dschungel/Entwicklung/Sportler/Skydance `1.1cqw`;
  Stadttor `0.9vw` (frame-equivalent); Störche bewusst in `cqh` (freigegeben).
  Alle Meta-Stufen sind relativ zur jeweiligen Body-Größe.
- **Meta-Beschreibung:** linksbündig als bewusste Ausnahme bestätigt.
- **Mobil:** gestapelt, Pfeile aus; separates Projekt.

## Historie / nicht bindend
- „Auf einen Blick“ (ganzes Blatt im Viewport) wurde 2026 verworfen.
- Ältere Blatt-Basen „schmal“ (ca. 832 × 850) und „groß“ (ca. 1574 × 850)
  waren Planungsbeispiele, keine verbindliche Vorgabe.

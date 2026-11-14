# PRODUCT — Projektstudien (Elke Pfaffmann)

## Was es ist
Portfolio-Website der Künstlerin Elke Pfaffmann (Glas – Licht – Architektur).
Die **Projektstudien** sind je eine Detailseite pro Kunst-am-Bau-Projekt:
ein Blatt mit Metainformationen, Bildern und Beschreibungstext.

## Publikum und Aufgabe
Architekt:innen, Kommunen, Schulen, Kurator:innen. Die Seite soll das Werk
zeigen und die Projektdaten (Ort, Jahr, Auftraggeber, Maße) beiläufig liefern.
Sprache: Deutsch.

## Fläche und Modus
- Modus: **Experience** – das Kunstwerk führt, die Oberfläche tritt zurück.
- Vorbild ist die PDF-Dokumentation des jeweiligen Projekts (Blatt 1190/1191 × 850);
  die Webseite bildet das Blatt nach, aber im Viewport.
- Entschiedene Richtung (2026): **Galerie-Look** – Bildflächen führen,
  Schrift als ruhiger Rand, strenges Raster, mehr Luft.

## Bedingungen (Abnahme)
1. **Ruhiger Rahmen**: Die Außenkanten der Elemente bilden ein Rechteck
   (Richtwert: 3 von 4 Kanten ≥ 90 % abgedeckt).
2. **Auf einen Blick**: Bei 100 % Zoom ist die Komposition vollständig sichtbar,
   ohne zu scrollen (Blattunterkante ≤ Viewport).
3. **Fläche**: Viewport vertikal füllen (≥ 95 %), horizontal mit schmalem Rahmen;
   vierseitiger Rahmen **3vw** (links = rechts = unten bis zum Footer).

## System
- Abstände: 1 cqh (8,5) / 1,2 cqh (10,2) / 2,4 cqh (20,4); Labelzeilen 1 cqh.
- Typo-Skala als Tokens (`--ps-fs-*`), Schriften League Spartan + Serif, Petrol-Akzent.
- Bilder werden **nicht beschnitten und nicht verzerrt**; Skalieren ist erlaubt,
  das Hauptbild bleibt dominant.

## Nicht-Ziele
- Mobil-Layout (eigenes Projekt).
- Neue Inhalte oder Texte; das PDF bleibt inhaltliche Wahrheit.

## Raster (Matrix)
Jede Seite wird als zweidimensionales Raster gedacht: Spalten C1..Cn, Zeilen R1..Rm,
gleichmäßige Rinnen (10,2 cqh zwischen Bildern, 20,4 cqh zu Text). Jedes Element
(Bild oder Text) besetzt eine Zelle oder einen Zellbereich; seine Kanten fallen
auf die Zellkanten. Daraus folgt die Bündigkeit: Elemente einer Zeile teilen
Ober-/Unterkante, Elemente einer Spalte teilen linke/rechte Kante.
- Keine Überlappung von Elementen, keine frei hängenden Bausteine.
- Spaltenbreiten = maximales Element der Spalte, Zeilenhöhen = maximales Element
  der Zeile; die Blattgröße ergibt sich aus den Spalten/Zeilen plus Rinnen.
- Folgen: Ein dichtes Raster ergibt ein schmaleres Blatt (Seitenrahmen > 3vw
  möglich); 3vw ist der Mindestrahmen, nicht das Ziel um jeden Preis.

## Zwei Blatt-Basen (festgelegt, Umsetzung offen)
Beide erfuellen das Raster: gemeinsame Kanten je Zeile/Spalte, Rinnen 10,2 (Bild) /
20,4 (Text), keine Ueberlappung, kein frei haengender Baustein. Der Text wird
immer so breit gewaehlt, dass seine Hoehe exakt die Nachbar-Bildhoehe ergibt.

### Basis "schmal" (Blatt ca. 832 x 850, Seitenverhaeltnis 0,98)
- C1 (190): Meta (51,8-186,3), Text (206,7-595,7, 389 hoch), Orang-Utan (616,1-842,4).
- C2 (210,4-831,6): Hero 621,2 x 332,9; darunter Ara (281,9 x 437,3) und
  Tukan (318,6 x 437,5) auf gemeinsamer Ober-/Unterkante, Reihe = Hero-Breite.
- Seitenrahmen gross (ca. 300 px bei 1440), dafuer innen dicht und vollstaendig buendig.

### Basis "gross" (Blatt ca. 1 574 x 850, Seitenverhaeltnis 1,85)
- Bilder x1,25: Hero 1 176,8 x 630,6 (Hero-Hoehe = Text-Hoehe), Meta 238,
  Orang-Utan 238 x 283, Ara 238 x 369, Tukan 238 x 327.
- Text auf 118 Breite (34 Zeilen, 630,6 hoch) -> Ober-/Unterkante = Hero.
- C1: Meta, Orang-Utan, Ara untereinander (51,8 bis ca. 834,6); C2: Hero + Tukan
  in der Leiste darunter; C3: Text.
- Rahmen ca. 3vw; Schwachstelle: Restflaeche in der Leiste rechts neben dem Tukan.

## Präzisierung der Abnahmebedingungen (2026)
1. **Innenfläche ≥ 90 %**: Das von den Außenkanten der Bild-/Textelemente aufgespannte
   Rechteck ist nahezu vollständig gefüllt (Ziel ≥ 90 %; die Restfläche sind im
   Wesentlichen die gewollten Rinnen; keine leere Zeile/Spalte). Maß: Summe
   der Elementflächen / Silhouette. Zusätzlich Kantenabdeckung ≥ 95 % an allen
   vier Außenkanten (siehe unten).
2. **Bündigkeit**: Jedes Element teilt mindestens zwei Kanten mit einem Nachbarn
   (linke/rechte Kante mit einem Element derselben Spalte, Ober-/Unterkante mit einem
   Element derselben Zeile). Keine Überlappung; Rinnen einheitlich (10,2 Bild, 20,4 Text).
3. **Zwei kanonische Ansätze je Projektstudie**: eine primär vertikale und eine primär
   horizontale Komposition; beide erfüllen 1 und 2. Das Blatt streckt sich in der
   jeweiligen Hauptdimension, nie "quadratisch".
4. **Rahmen**: 3vw ist Mindestrahmen; die Blattgröße folgt dem Raster.

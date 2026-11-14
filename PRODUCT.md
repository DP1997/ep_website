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

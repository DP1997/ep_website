---
name: projektstudien-contract
description: Kunst-Layout-Vertrag für Elke Pfaffmanns Website anwenden — Werkseiten, KAB-Projekte und Projektstudien nach der gemessenen Raster-Grammatik layouten, prüfen und abnehmen. Nutze diesen Skill, wenn eine Werk-/Projektseite neu gebaut, umgebaut oder auf Bündigkeit, Gaps, Crop, Hero-Anteil und Leerfläche geprüft werden soll.
---

# Projektstudien-Contract anwenden

Dieser Skill ist der **Prozess**. Die Zahlen und Regeln stehen ausschließlich in
`docs/projektstudien-contract/Contract.md` (normativ). Hier werden sie **nicht**
wiederholt — sonst entstehen zwei Wahrheiten.

## Pflichtlektüre vor dem ersten Edit

1. `docs/projektstudien-contract/Contract.md` §0 (Konventionen), §1 (Axiome),
   §4 (Tokens), §8 (Muster + Solver), §10 (Deskriptor + Audit-Protokoll),
   §16 (P0-Gate).
2. `docs/projektstudien-contract/ps-contract.json` — Tokens, Toleranzen,
   bestehende Seiten-Deskriptoren als Vorlage.
3. `docs/projektstudien-contract/ps-audit.js` — nur die Aufrufsignatur
   (`PSAudit.run(contract)`), nicht der Prüfer-Code.

## Ablauf

1. **Inhalt erfassen.** Titel, Beschreibung, Meta, Body, Bildrollen. Natürliche
   Aspekte **messen** (`System.Drawing`/`sharp`/Browser), nie schätzen.
2. **Spatial Thesis + Plan.** Fünf Sätze (Lesepfad, Gruppierung, Führung,
   Dichte, Adaptation) und der Vier-Teiler: 4–6 benannte Farben, Typo-Rollen,
   Layout-Satz + ASCII-Wireframe, Prinzipien.
3. **Review vor Build.** Liest sich der Plan wie der generische Default?
   Dann ändern und begründen, nicht bauen.
4. **Muster + Deskriptor.** Familie nach §8 wählen (SOLLTE, begründbar
   abweichen), Spalten aus Aspekten lösen, Zeilen fit-gebunden, `adjacency`
   setzen, Zellen zuweisen, Crops/Upscales deklarieren. **Bündigkeit (A2) ist
   primär**, innerhalb dieser Ordnung wird die Dichte (A3) maximiert: lieber
   eine unvollständige Kontur als eine lose Fläche — aber nie ein verschobenes
   Bild oder Textfeld.
5. **Bauen.** Tokens + CSS Grid. Keine Ad-hoc-Pixel außerhalb der s-Leiter.
6. **Audit, zwei Pässe.** Erst qualitativ (7 Fragen, §10.5), dann mechanisch:
   - **Precondition:** `.ps-detail`-Breite = Blattbreite und `--ps-frame-w` gesetzt
     (macht das Layout-Skript). Die Live-PS-Seiten sind Stand 18.11.2026 noch die
     alte `cqw`-Implementierung — ein Fail dort ist Migrationsbefund, kein
     Vertragsfehler.
   - Seite laden, **auf `document.fonts.ready` und alle Bilder warten**
     (sonst messen Footer/Dichte den Vor-Load-Zustand).
   - `page.addScriptTag({ path: 'docs/projektstudien-contract/ps-audit.js' })`
   - pro Viewport (1920×1080, 1440×900, 1366×768, 1200×900, 1024×768):
     `page.evaluate(() => PSAudit.run(contract))`
   - `summary.failed == 0` ist Pflicht; `density.fill` (≥ 0,70) ist hart,
     `density.target` (≥ 0,78) soft. Soft-Checks (`density.*`, `free.*`,
     `page.glance`) separat berichten. Kein bloßes „sieht gut aus".
7. **Screenshot-Kritik.** Eine Kühnheit pro Seite; danach ein Dekor entfernen.
8. **P0-Gate** (§16) abhaken, Abweichungen in `deviations` eintragen.

## Harte Grenzen

- Keine Regel hier neu erfinden oder abschwächen. Widerspruch → Contract
  korrigieren, nicht umgehen.
- Keine stillen Ausnahmen. Jede Abweichung: Regel, Seite, Grund, Ablaufdatum.
- Kein Crop ohne Deklaration, kein Upscale > 1,5×, keine dritte Schriftfamilie,
  keine Schrift < 12 px, kein H-Scroll, keine Überlappung.
- Dichte nicht durch Schrumpfen der BBox erklimmen: `bboxShare` bleibt im Blick
  (soft ≥ 0,70). Ein kleines, dichtes Rechteck ist keine gute Komposition.
- Anti-Patterns (§13) sind Review-Leitfaden; nur die Punkte mit Token/Schwelle
  prüft `ps-audit.js`.

## Verhältnis zu den Goldseiten

Die 8 Projektstudien sind der gemessene Goldstandard, die 16 KAB-Projekte das
Inventar für die Musterwahl, die 3 Contract-Tests (Bademaxx, Aufbruch,
Regenwald) der Nachweis, dass sich die Grammatik auf Nicht-PS-Projekte überträgt.
Die Live-Seiten werden erst geändert, wenn der Vertrag es trägt und der
P0-Gate erfüllt ist.

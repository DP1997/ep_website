# Contract — Kunst-Layout-Vertrag

**Version:** 3.2 (normativ, Bündigkeit vor Dichte)
**Stand:** 18.11.2026
**Goldstandard:** 8 Projektstudien-Seiten (PDF-Rekonstruktion) + 16 KAB-Projekte (Inventar) + 3 Vertrags-Tests (Bademaxx, Aufbruch, Regenwald).
**Zweck:** ein generischer, maschinen- und menschenlesbarer Gestaltungsvertrag, mit dem KI oder Mensch **Kunst- und Bauprojekte** nach denselben Prinzipien layouten kann — nicht nur Projektstudien.

> **Hierarchie:** Axiome sind MUSS. **A2 (Bündigkeit) ist das primäre harte Kriterium; A3 (Dichte) wird innerhalb der Bündigkeit maximiert.** Eine unvollständige Kontur ist erlaubt, ein Bruch der besetzten Spalten/Zeilen nicht. Freiheitsgrade sind begrenzt und müssen deklariert werden; alles andere ist ein Fehler.

**Verhältnis zur Spec `docs/specs/2026-09-09-projektstudien-design.md`:** Die Spec legt fest, dass jede Projektstudie ein **individuelles** Layout hat. Dieser Vertrag legt fest, welche **Grammatik** diese Layouts teilen. Individuell heißt nicht regellos.

**Goldstandard & Live-Stand:** Gemessen wurde im **Preview-Worktree** (8 PS-Seiten mit `--ps-frame-w`/`--ps-s`-Tokens). Die Live-PS-Seiten im Haupt-Repo sind (Stand 18.11.2026) noch die alte `cqw`-Implementierung ohne diese Tokens. Der Vertrag beschreibt den Zielzustand; ein Audit-Fail auf den Live-Seiten ist **Migrationsbedarf**, kein Vertragsfehler.

---

## 0. Vertragskonventionen

| Begriff | Bedeutung |
|---|---|
| **MUSS** | Axiom oder IRONCLAD-Regel. Verstoß = Fehler. Nur über `deviations` zulässig (§10). |
| **SOLLTE** | Empfehlung. Abweichung erlaubt, muss im Deskriptor begründet werden. |
| **DARF NICHT** | Anti-Pattern (§13). Auch mit Begründung nicht — dafür braucht es eine Vertragsrevision. |
| **observed** | An den Goldseiten gemessen (8 PS, 16 KAB, 3 Tests). |
| **provided** | Gesetzt/entschieden (Brief, Künstlerin, bewusste Design-Entscheidung). |
| **inferred** | Aus observed/provided abgeleitet, nicht direkt gemessen. |

1. **Jede Regel bindet an Token, Schwelle oder Beispiel.** Adjektive allein sind keine Regel („premium" ist keine Anweisung, „ein Petrol-Akzent, kein zweiter" ist eine).
2. **Eine Zahl, eine Quelle.** Es gibt keine zwei Wahrheiten: `ps-contract.json` ist die maschinenlesbare Fassung, `Contract.md` die normative; bei Abweichung gewinnt der Vertrag und das JSON wird korrigiert.
3. **Keine stillen Ausnahmen.** Jede bewusste Abweichung steht in `deviations` mit Regel, Seite, Grund und Ablaufdatum.
4. **Messen statt behaupten.** Geometrie wird am gerenderten DOM gemessen, nicht geschätzt. Ein „ja, sieht bündig aus" ist keine Verifikation (§10.5).
5. **Ein Dokument, mehrere Rollen.** `Contract.md` = normativ. `ps-contract.json` = Deskriptoren/Tokens. `ps-audit.js` = Prüfer. Der Skill = Prozess. Keine Regel wird in zwei Dateien unterschiedlich formuliert.

---

## 1. Axiome

**A1 — 2D-Raster.** Jede Komposition ist ein Rechteck aus Spalten und Zeilen. Jedes Bildelement und jeder Textblock liegt in genau einer Zelle (oder überspannt definierte Zellen).

**A2 — Bündigkeit.** Elemente derselben Spalte teilen linke und rechte Außenkante; Elemente derselben Zeile teilen obere und untere Außenkante. Toleranz: Flush ≤ 3 px (Ziel ≤ 1 px).

**A3 — Dichte.** Innerhalb der durch A2 gesetzten Spalten und Zeilen ist die von den Außenkanten aufgespannte Fläche (BBox) dicht besiedelt: `fill = Σ Inhaltsflächen (Bilder + Glyphenzeilen) / BBox-Fläche ≥ 0,70` (Ziel 0,78). Lokale Lücken sind erlaubt (Balla: leere untere linke Ecke), solange die Gesamtdichte hält. Ein perfektes Rechteck ist **nicht** erforderlich; A2 (Bündigkeit) ist primär und darf für Dichte nicht gebrochen werden.

**A4 — Feld vor Glyphe.** Bündigkeitsreferenz ist das **Feld** (Element-Box). Der Glyphenrahmen (Tinte) darf durch Half-Leading um 1–2 px eingerückt sein; das ist kein Fehler.

**A5 — Typografie normiert.** Schriftgrößen kommen aus den Familien-Tokens (§4), nicht aus dem Viewport-Zufall. Kein Text unter 12 px; Body 12,5–18 px (Ziel 13–16 px für Werkseiten; die PS-Katalog-Familie liegt mit 12,78 px bewusst darunter); Zeilenlänge 60–75 Zeichen.

**A6 — Lesbarkeit.** Kontrast ≥ 4,5:1 (Body), sichtbarer Fokus, Tastaturbedienung, Reduced Motion, semantische Struktur; 44×44-px-Touchziele, sobald interaktiv.

**A7 — Bildintegrität.** Bilder werden nie verzerrt. Standard ist das natürliche Seitenverhältnis. Ein Zuschnitt ist nur als **deklarierter** Crop erlaubt (§6).

**A8 — Keine Überlappung, kein H-Scroll.** Bei keiner Breite überlappen sichtbare Boxen; `document.scrollWidth == clientWidth`.

**A9 — Rahmen und Pfeile.** Blattbreite = `clientWidth − 2·(44 + 2·3 % client)`; Blattmitte = Clientmitte; Pfeile 44 px in den 3-%-Bändern; Inhalt mittig (Center-Toleranz 4 px).

**A10 — Footer.** Unter der tiefsten sichtbaren Kante (inkl. Caption) liegt `max(24 px, 3 % client)` Abstand, dann der Footer. Der Abstand wird aus der tiefsten sichtbaren Kante gemessen (ereignisgesteuert; ein letzter Lauf nach Font-Load als Sicherheitsnetz).

---

## 2. Basis, Einheit, Modi

- **Einheit `s`:** 1 s = 1 % der Blattbreite (Frame). In CSS: `--ps-s: calc(var(--ps-frame-w) / 100)`. Alle Abstände/Token in `s` (`calc(1.5 * var(--ps-s))`), nicht in Prozent der Innenfläche. Prozent-der-Innenfläche ist die häufigste Fehlerquelle (z. B. 1,09 s statt 1,5 s auf schmaleren Blättern).
- **Frame:** `client = document.documentElement.clientWidth`; `sheet = client − 2·(44 + 2·3 % client)`; `sheet.center = client / 2`.
- **Implementierung (MUSS):** Das Layout-Skript setzt `--ps-frame-w` und die Breite von `.ps-detail` auf `avail` (die Blattbreite). Der Prüfer misst `.ps-detail.clientWidth` als s-Referenz; weicht `.ps-detail` von der Blattbreite ab, sind die Erwartungswerte ungültig.
- **Höhe:** Inhalt bestimmt die Höhe (Scrollen erlaubt); kurze Viewports (`innerHeight ≤ 800`) dürfen das Blatt auf `0,802 · client` begrenzen.
- **Modi:**
  - `composition` — ≥ 1360 px. Volle Axiome + Muster.
  - `stack` — < 1360 px. Fallback; validiert werden Sheet/Margin/Center, Footer, Typo, Caption, Bildintegrität, Overlap, H-Scroll. Tablet (901–1359) ist dieser Modus.
  - `mobile` — ≤ 900 px. Eigener Modus, noch nicht definiert. Bis dahin läuft Mobile als `stack`; 768/390 sind **Smoke-Checks**, keine Vertragsmatrix.
- **Desktop-Matrix:** 1920×1080, 1440×900, 1366×768.
- **Stack-Matrix:** 1200×900, 1024×768. Alles > 1920 ist außerhalb des Vertrags (§17).

---

## 3. Raster-Grammatik

**3.0 Spatial Thesis (MUSS, vor dem Layouten).** Fünf Sätze, die jede Seite vor dem ersten CSS beantwortet:
1. Primärer Lesepfad (was zuerst, was danach).
2. Was gehört zusammen, was muss sich trennen.
3. Welches Element führt, welches stützt.
4. Beabsichtigte Dichte und Abstands-Rhythmus.
5. Wie ändert sich die Struktur über Container, Viewports und Inhalts-Extremfälle.

**Glossar (aus `layout-grid`, auf unsere Begriffe abgebildet):**
- **Spalte:** vertikale Achse; Breiten kommen aus Inhalten und Bildformaten, nicht aus einem 12er-Dogma.
- **Zeile:** horizontale Achse; Höhe ist fit-gebunden.
- **Modul:** Schnittpunkt aus Spalte × Zeile = **Zelle**.
- **Compound:** Überlagerung nur als deklarierter Span (§3.4).

**Regeln:**
1. **Spalten:** 2–4 Hauptspalten, Breiten aus Inhalt und Bildformaten; Abstand zwischen Hauptspalten = **1,5 s** (Toleranz 1 px; @1440 ≈ 17,4 px).
2. **Zeilen:** Höhen sind fit-gebunden (Inhalt/Bilder); Zeilenabstand = 1–1,5 s (Slack 2:1), sofern nicht durch Bündigkeit bestimmt.
3. **Zellen:** Jede besetzte Rasterzelle ist zugewiesen (Bild, Text, Meta oder bewusster Span). Unbesetzte Bereiche sind erlaubt, solange die Gesamtdichte (A3) hält; ein bewusster Span über mehrere Zellen ist zulässig (Band, Meta über zwei Zeilen).
4. **Spans:** Bilder/Text dürfen Zellen überspannen (z. B. ein Band über alle Spalten, ein Meta-Block über zwei Zeilen).
5. **Flushness:** Die deklarierten Spalten/Zeilen werden als Layout-Deskriptor hinterlegt (§10) und geprüft: linke/rechte bzw. obere/untere Kanten ≤ 3 px.
6. **Keine absoluten Pixelpositionen** außerhalb des Deskriptors; die Positionen ergeben sich aus Raster + Spans.
7. **Intentional Grid-Breaking** (SOLLTE): Ein bewusster Bruch ist erlaubt, aber nur deklariert (Grund + erwartete Wirkung). Nicht als Rettungsmittel für ein kaputtes Raster.

---

## 4. Tokens — zwei Familien, eine Rollenlogik

| Rolle | Projektstudien (s / px@1440) | Werkseiten (s / px@1440) | Gewicht | Ausrichtung | Zeilenhöhe |
|---|---|---|---|---|---|
| Body | 1,1 / 12,78 | 1,291 / 15 | 500 | justify | PS 1,24 · Werk 1,5 |
| Titel | 1,54 / 17,89 | 2,583 / 30 | 700 | left | PS 1,15 · Werk 1,1 |
| Beschreibung | 1,144 / 13,29 | 1,463 / 17 | 700 | justify | PS 1,25 · Werk 1,35 |
| Label | 1,1 / 12,78 | 1,119 / 13 | 700 (small-caps) | left | 1,0 |
| Wert | 1,067 / 12,4 | 1,1 / 12,78 | 400 (Serif) | left | 1,2 |
| Caption | 1,25 / 14,52 | 1,119 / 13 | 400 (Sans) | left | 1,0 |

- **Provenienz:** PS-Spalte = **observed** (an den 8 Projektstudien gemessen, 1440). Werk-Spalte = **provided** (Preview-Entscheidung, §15). Die Rollenlogik ist in beiden identisch.
- **Rollenverhältnisse (Werk):** Titel 2,0× Body, Desc 1,133×, Label 0,867×, Wert 0,852×, Caption 0,867×. Verhältnisse sind stabiler als Absolutgrößen — wer den Body ändert, ändert die anderen mit.
- **Content dominiert:** Der Werk-/Seitentitel ist größer als die Chrome. Werk-Previews: Wortmarke 1,4 rem (22,4 px), Nav 1,3 rem (20,8 px), Subtitle 0,8 rem (12,8 px), Content-Titel 30 px. Die Projektstudien behalten die brand-first-Wortmarke (3 rem) als PDF-Katalog-Familie.
- **Floor:** `max(12 px, Token)`; Labels/Werte dürfen in der Werk-Familie unter 12 px nur dann fallen, wenn der Mobile-Modus sie später separat definiert. Body nie unter 12 px.
- **Familien:** Zwei **Rollen-Familien** (PS, Werk). Innerhalb einer Familie genau eine Sans (League Spartan) und eine Serif (EB Garamond). Keine dritte Schriftfamilie.
- **Spacing-Leiter (MUSS):** Abstände kommen aus der Leiter `0 · 0,1 (Text-Gap) · 0,5 (Caption) · 1,0 (min. Zeilen-Gap) · 1,5 (Spalten/Hauptgap) s`. Größere Abstände nur als Summe dieser Stufen. Keine Ad-hoc-Pixel.
- **Farben:** Papier/Hintergrund, Basistext, Petrol-Akzent, dezente Linien; Kontrast ≥ 4,5:1.
- **Keine Varianz innerhalb einer Familie** — zwei Familien (PS/Werk) mit derselben Rollenlogik sind erlaubt und gewollt.

---

## 5. Meta-Block (Titel · Beschreibung · Labels)

- Reihenfolge: Titel → Beschreibung → Labels (Ort, Jahr, Auftraggeber).
- **Feldbreite = Spaltenbreite.** Der Meta-Block füllt seine Spalte; der Glyphenrahmen darf kürzer sein (A4). Keine künstliche Wortstreckung nur zum Füllen.
- **Strecken (Freiheit F1):** Wenn die Zeilenhöhe visuell gefüllt werden soll, wird die Resthöhe in die **Abstände** verteilt: `desc.margin-bottom` und Label-Abstände (je ein Drittel). Erlaubt, solange die Labels lesbar bleiben und die Hierarchie erhalten bleibt.
- **Labels:** einzeilig bevorzugt; Umbruch erlaubt. **Key/Value** darf über die Spaltenbreite gespreizt werden, wenn es ein Bündigkeitsproblem löst (Freiheit F6) — dann konsequent für alle Labels.
- **Werte:** Serif, 400; Keys: Sans, 700, small-caps; keine erfundenen Werte.
- **Nachbarschaft:** `stacked` (Meta über Body) → vertikaler `text.gap` ≤ 0,1 s; `beside` (Meta neben Body) → horizontaler Gap 1,5 s. Beides ist gültig; der Deskriptor deklariert `adjacency`.

---

## 6. Bilder

- **Rollen:** `hero` (größtes Bild, dominant), `band` (sehr breit, ≥ 2,3:1), `main` (Hauptwerk), `detail` (Ausschnitt/Nahaufnahme), `portrait` (hoch), `strip` (Reihe gleichartiger Bilder).
- **Format-Signaturen (observed):** Portrait < 0,9 · Querformat 0,9–1,9 · Breitband ≥ 1,9. Sie steuern die Musterwahl (§8), sind aber keine Zwangsklassen.
- **Natürlich:** Standard; keine Verzerrung.
- **Deklarierter Crop (Freiheit F7):** `object-fit: cover` ist nur erlaubt, wenn der Crop im Deskriptor deklariert ist: Zielformat, Fokuspunkt (`object-position`), Grund (z. B. „PDF-Referenz zeigt quadratische Detailkacheln"). Der Prüfer akzeptiert deklarierte Crops und meldet undeklarierte.
- **Upscaling:** gerenderte Breite ≤ 1,5 × natürliche Breite; Ausnahmen (kleine Quellbilder) müssen deklariert werden.
- **Captions:** Sans 1,25 s, 400; direkt unter dem Bild; zählen zum Footer-Low, nicht zur Spalten-Flushness.
- **Hero:** größtes Bild ≥ 1,3 × Fläche des zweitgrößten (Ziel 1,4×). SOLLTE: Ist die Gesamtdichte ≥ 0,70, darf der Hero-Anteil darunter liegen — die Dichte hat Vorrang.

---

## 7. Freiheitsgrade (normierte Kniffe)

Erlaubt und dokumentiert — keine stillen Abweichungen. Jeder Einsatz wird im Deskriptor vermerkt.

- **F1 — Meta strecken:** Resthöhe in `desc.margin-bottom` + Label-Abstände verteilen. Grenze: Labels bleiben als Gruppe erkennbar, keine Isolation eines Labels.
- **F2 — Wortabstände:** Eine kurze, einzeilige Beschreibung darf per `text-align-last: justify` auf die Spaltenbreite gestreckt werden. Grenze: nur Desktop, nur wenn die Wortabstände nicht ausfransen; sonst kürzere Zeile.
- **F3 — Leading-Ausgleich:** Ein Textfeld darf per `line-height` + `transform` so justiert werden, dass die Glyphenkante visuell mit der Zelle schließt. Grenze: Feldgeometrie bleibt, nur die Glyphen wandern.
- **F4 — Half-Leading:** 1–2 px Differenz zwischen Feld und Glyphen ist toleriert; nicht „wegoptimieren".
- **F5 — Lokale Leerfläche:** Text startet oben bündig; die Leerfläche darunter ist erlaubt, solange die Gesamtdichte (A3) ≥ 0,70 bleibt. Der Prüfer meldet `free.<cell>` weiterhin als **Diagnose** (Budget 30 % der Zellhöhe), aber der Hard-Fail ist die Dichte, nicht die einzelne Zelle.
- **F6 — Key/Value-Labels:** Keys links, Werte rechts auf Spaltenbreite, wenn die Meta-Rechtskante sonst nicht schließt. Nur wenn die Werte kurz und die Spalte breit genug ist.
- **F7 — Deklarierter Crop:** siehe §6; immer mit Fokuspunkt und Grund.
- **F8 — Spaltenbreite vs. Wortstreckung:** Wenn ein Meta-Block deutlich schmaler ist als der Body, ist die sauberste Lösung, die Spalte auf die Meta-Breite zu verengen und das Bild wachsen zu lassen — nicht Wörter extrem zu spreizen. Abwägung dokumentieren.
- **F9 — Caption-Ausnahmen:** Captions dürfen aus der Flushness fallen (sie stehen unter dem Bild), zählen aber zum Footer-Low.
- **F10 — Label-Umbruch:** Labels dürfen umbrechen, wenn die Spalte es erzwingt; Einzeiligkeit ist Ziel, nicht Pflicht.

---

## 8. Musterbibliothek — 4 Familien (SOLLTE, kein Zwang)

| Familie | Werke (16 KAB) | Bilder / Formate | Muster |
|---|---|---|---|
| **Portrait-geführt** | Aufbruch, Bildungsspirale, Christophorus, Impuls, Marathon, Paragraph, Platine, Scribere, Säulen, Villa Fuss (10) | 2–5; P 0,54–0,84 + L 1,15–1,78 | 3-Spalter Portrait · Meta · Body, darunter Strip; Solver für den Strip |
| **Querformat-geführt** | Arche, Bademaxx, Regenwald (3) | 3–6; alle 0,9–1,9 | Hero + Copy + Strip (gestapelte Copy) |
| **Breitband** | Gleiten, Glut, Lebensbaum (3) | 2–6; W 2,38–4,14 | Band + Copy/Stack; Solver für die Bandhöhen |
| **Zwei Bilder** | Sonderfall, keine eigene Primärzählung (Impuls, Glut) | 2 | 2-Spalter / Hero+Detail |

- **Zuordnung:** Jedes Werk hat genau **eine Primärfamilie** (10 + 3 + 3 = 16). Die **Zwei-Bilder-Familie** ist ein Sonderfall, keine vierte Primärzählung: Sie gilt für Impuls und Glut, wenn das Muster mit genau zwei Bildern schlanker ist als die Primärfamilie; die Wahl wird im Deskriptor begründet.
- **Musterwahl-Matrix (SOLLTE):**
  1. Portrait vorhanden **und** ≥ 3 Bilder → Portrait-3-Spalter + Strip.
  2. Alle Bilder 0,9–1,9 **und** 3–6 Bilder → Hero + Copy + Strip.
  3. Mindestens ein Bild ≥ 1,9 **und** ≤ 3 Bilder → Breitband + Copy/Stack.
  4. Genau 2 Bilder → 2-Spalter oder Hero + Detail.
  5. Gemischte Formate → zuerst Spaltenbreiten aus den Aspekten lösen, dann Zeilenhöhen.
  6. Immer: Hero = größte Fläche; nie ein Bild verzerren, um ein Muster zu retten.
- **Strip-Solver:** `H = (Blattbreite − (n−1)·1,5 s) / Σ Aspekte`; `Breite_i = H · Aspekt_i`. Damit sind alle Bilder einer Zeile höhengleich und die Summe + Gaps = Blattbreite.
- **Breitband-Solver:** Bandhöhe aus der Summe der Breiten; Copy/Stack daneben; keine erzwungene dritte Spalte bei 3,9:1 — leere Zelle vermeiden.
- **Solver = Rechenregel, nicht Automat:** Bis ein Generator existiert, wird die Formel manuell/im Sheet angewandt; die Automatisierung ist außerhalb des Vertrags (§17).
- **Matrix ist SOLLTE:** Der Deskriptor nennt die gewählte Familie und die Begründung; Abweichungen laufen über `deviations`. Kein starres Template.
- **Die 16 KAB-Projekte** clustern in 10 portrait-, 3 quer- und 3 breitband-geführt; die Varianz ist real, aber mit 4 Familien + Solver abgedeckt.

---

## 9. Content-Schema

```json
{
  "title": "string",
  "description": "string",
  "meta": { "Ort": "string", "Jahr": "string", "Auftraggeber": "string" },
  "body": ["string"],
  "images": [
    { "src": "asset", "role": "hero|band|main|detail|portrait|strip", "caption": "string?", "alt": "string", "crop": null }
  ]
}
```

Bildrollen bestimmen die Musterwahl; `crop` ist nur bei deklariertem Crop gesetzt (`{ "fit": "cover", "position": "50% 50%", "reason": "…" }`). Die natürlichen Aspekte werden gemessen, nicht geschätzt — sie sind Solver-Eingabe.

---

## 10. Layout-Deskriptor & Validator

Jede Seite liefert einen Deskriptor (Beispiel; pro Seite in `ps-contract.json`):

```json
{
  "mode": "composition",
  "adjacency": "stacked | beside",
  "columns": [{ "name": "c1", "selectors": ["..."], "edges": ["l","r"] }],
  "rows":    [{ "name": "r1", "selectors": ["..."], "edges": ["t","b"] }],
  "gaps":    [{ "a": "selector", "b": "selector", "expected": 1.5 }],
  "cells":   [{ "name": "r1c1", "selectors": ["..."], "text": true }],
  "declaredCrops": [],
  "declaredUpscales": []
}
```

**Harte Checks (composition):** Sheet/Margin/Center, Content-Center, Footer-Gap, Typo/Gewicht/Ausrichtung, Caption, **Spalten-/Zeilen-Flushness**, **Spalten-Gaps = 1,5 s** (Zeilen fit-gebunden), **Zellzuweisung**, **Dichte (`fill ≥ 0,70`)**, Bild-Aspekt/Crop-Deklaration, Upscaling, Overlap, H-Scroll, Hero-Anteil (hart nur bei Dichte < 0,70), Hero-Sichtbarkeit (solange das Blatt im Viewport liegt).
**Harte Checks (stack):** Sheet/Margin/Center, Footer-Gap, Typo, Caption, Bild-Aspekt/Crop, Overlap, H-Scroll.
**Soft:** Labels einzeilig/fit (Puffer 4 px), At-a-glance (`max(sheet.b, footer.b) ≤ min(780 px, viewport.h)`), Dichte-Ziel (`fill ≥ 0,78`), Hero-Sichtbarkeit bei scrollenden Seiten, **Leerflächen-Diagnose** (`free.<cell>` ≤ 30 % der Zellhöhe).

**Nachbarschaft:** `stacked` → Meta über Body, geprüft wird der vertikale `text.gap`; `beside` → Meta neben Body, geprüft wird der horizontale Gap (1,5 s) und die Zeilen-Flushness; der vertikale Check entfällt dort.
**Tokens pro Familie:** Projektstudien nutzen `tokens`, Werkseiten `tokensWork` (`pageFamilies`); gleiche Rollenlogik, andere Skala.

**Toleranzen (MUSS):**

| Größe | Toleranz |
|---|---|
| Flush (Kante) | ≤ 3 px (Ziel ≤ 1) |
| Sheet-/Content-Center | ≤ 4 px |
| Footer-Gap | ≤ 2 px |
| Gap | ≤ 1 px |
| Typo | ≤ 0,05 px |
| Aspekt | ≤ 0,1 % |
| Overlap / H-Scroll | 0 |

**Abweichungen:** nur über eine `deviations`-Registry (Regel, Seite, Grund, Ablaufdatum). Keine stillen Ausnahmen.

**Messbasis (MUSS):** Text wird als **Glyphenbox** gemessen (`Range.getClientRects`), Bilder als Figure-/Img-Box. Die Feldkante bleibt die Bündigkeitsreferenz (A4); Captions sind aus der Flushness ausgenommen und im Footer-Low enthalten.

### 10.5 Audit-Protokoll (MUSS)

**Zwei getrennte Pässe, in dieser Reihenfolge:**
1. **Qualitativ (gerendert):** Reading Order (Squint), Grouping (Nähe vor Containern), Rhythm (bewusste Kadenz statt ein Wert überall), Structure (sind gleiche Karten wirklich gleichwertig?), Density, Adaptation (DOM-/Fokus-Reihenfolge = visuelle Reihenfolge), Extremes (langer Text, leere Zustände, Overlays, Sticky, Zoom).
2. **Mechanisch:** `PSAudit.run(contract)` im Browser, pro Viewport. Mechanische Evidenz nicht in Pass 1 mischen; erst nach Pass 2 synthetisieren.

**Regeln:**
- Jede Pass-1-Antwort wird mit gerendertem Wert oder Selektor belegt. **Kein bloßes „ja" als Verifikation.**
- Ein sauberer Scan beweist keine Hierarchie — er beweist nur die geprüften Axiome.
- Bericht: `summary.failed` (MUSS 0), Soft-Checks separat, Zahlen zitieren (z. B. „Gap 17,41 px, Budget 17,4").
- Zusätzlich prüfen, was der Prüfer nicht kann: Overflow, `object-position`, Container-Verhalten, Zoom 200 %, Lokalisierung.

---

## 11. Prozess für ein neues Projekt

1. **Inhalt erfassen** (§9): Titel, Beschreibung, Meta, Body, Bildrollen, **natürliche Aspekte messen**.
2. **Plan schreiben (MUSS, 4 Teile):**
   - Farben: 4–6 benannte Werte.
   - Typo: Familien, Rollen, Verhältnisse.
   - Layout: ein Satz + **ASCII-Wireframe** (alternativ zwei Varianten vergleichen).
   - Prinzipien: was diese Seite besonders macht.
3. **Plan gegen den Vertrag reviewen:** Liest sich ein Teil wie der generische Default (Cream+Serif, Acid-Accent, SaaS-Cards, ALL-CAPS-Eyebrow)? Dann ändern und begründen — erst danach bauen.
4. **Muster + Deskriptor:** Familie wählen (§8), Spatial Thesis (§3.0), Spalten aus Aspekten, Zeilen fit-gebunden, Gaps 1,5 s, Zellen zuweisen, `adjacency` setzen.
5. **Bauen:** Astro, Tokens, CSS Grid; kein Ad-hoc-Pixel.
6. **Audit:** Zwei Pässe (§10.5), Desktop-Matrix + Stack.
7. **Screenshot-Kritik:** „Spend your boldness in one place" — ein Element ist die Erinnerung, alles andere bleibt ruhig. Danach „remove one accessory": ein Dekor entfernen, das nicht dient.
8. **P0-Gate** (§16) abhaken; Abweichungen deklarieren.
9. **Mensch-Review** (Gestaltung, A11y, Marke); dann veröffentlichen.

---

## 12. A11y & Performance

- Kontrast 4,5:1; Fokus sichtbar; Tastatur; `prefers-reduced-motion`; Alt-Texte; semantische Überschriften/Figures.
- **Tastatur-, DOM- und Fokus-Reihenfolge stimmen mit der visuellen Reihenfolge überein** (MUSS).
- Keine Hover-only-Informationen; Touch-Ziele ≥ 44 px.
- Zoom 200 % und lange/leere Inhalte dürfen die Struktur nicht brechen.
- Bilder über `astro:assets` mit `widths`/`sizes`, lazy unterhalb der Falz, `width`/`height` gegen CLS.
- JS minimal; keine Animationsbibliothek ohne zwingenden Grund; Motion 150–300 ms, aus unter Reduced Motion.

---

## 13. Anti-Patterns (DARF NICHT als Default)

- Kein Crop ohne Deklaration (F7); keine Verzerrung; kein Upscale > 1,5× ohne Deklaration.
- Keine dritte Schriftfamilie; keine Schrift < 12 px; keine Ad-hoc-Pixel außerhalb der s-Leiter.
- Keine unzugewiesenen Zellen; kein H-Scroll; keine überlappenden Boxen.
- Keine stillen Ausnahmen (kein „nur hier" ohne `deviations`).
- Keine ALL-CAPS-**Eyebrow über jeder Überschrift** als Default. Kleine Labels in small-caps sind ein gemessenes Markenmittel und bleiben erlaubt.
- Kein Bruch der Spalten-/Zeilenbündigkeit für mehr Dichte. Eine unvollständige Kontur ist erlaubt; ein verschobenes Bild- oder Textfeld nicht.
- Kein SaaS-Card-Kit: identische Radien + derselbe weiche Schatten für alles, Gradient-Washes als Dekoration.
- Kein `→` an jedem Link/Button; keine Mittelpunkt-Meta-Strings als Standard; keine „WORD — fragment"-Labels als Muster.
- Keine Cream+Terracotta- oder Near-Black+Acid-Accent-Defaults, wenn der Brief nichts davon verlangt.
- Kein 12-Spalten-Dogma; keine erzwungene dritte Spalte, nur um ein Muster zu erfüllen.
- Kein Dark-Mode-Zwang (Nicht-Ziel, Anhang A).
- Keine Motion ohne Reduced-Motion-Pfad; keine Hover-only-Information.

> Diese Liste stammt teils aus `frontend-design`/`impeccable`, ist aber **prosaisch** formuliert: Sie ist Review-Leitfaden, kein Audit-Check. Nur die Punkte mit Token/Schwelle prüft `ps-audit.js`.

---

## 14. Bekannte Toleranzen (Referenzstand)

| Fall | Regel | Status |
|---|---|---|
| Balla Zeile 2 | 2,3 px Half-Leading | Toleranz (A4) |
| Balla Zeile 3 | Text oben bündig, Leerfläche darunter | Freiheit F5 |
| Sportler Meta | Feld = 430 px = Body; Glyphen 377 px | Feld bündig (A4) |
| Bubbles Desc | Blocksatz mit Wortlücken (2 Zeilen, 185 px) | bewusst, Freiheit F1 |
| Störche Desc | Desktop gestreckt | Freiheit F2 |
| Bubbles Details | quadratische Kacheln, deklarierter Crop (PDF) | Freiheit F7 |
| Bubbles Details | 169-px-Quelle, rendert 229–300 px | deklariertes Upscaling |
| Dschungel-Text | Leading-Ausgleich | Freiheit F3 |
| Werk-Previews | eigene Werk-Tokens (Body 15, Titel 30, Labels 13, Wortmarke 22,4) | Familie Werk (zwei Familien) |
| Aufbruch | Meta/Body 61 % Leerfläche in der Portrait-Zeile | Soft-Budget `free.meta/body` (F5) |
| Bademaxx/Regenwald | Copy-Leerfläche ≤ 30 % | Soft-Budget eingehalten |
| Werk-Previews | `page.glance` 851–1.388 px | soft (scrollende Werkseiten) |

**Dichte-Referenz (1440, Glyphenzeilen + Bildboxen, Stand 18.11.2026):**

| Seite | fill | Seite | fill |
|---|---|---|---|
| Balla | 0,721 | Stadttor | 0,846 |
| Bubbles | 0,867 | Störche | 0,885 |
| Dschungel | 0,881 | Bademaxx | 0,758 |
| Entwicklung | 0,898 | Aufbruch | 0,833 |
| Skydance | 0,894 | Regenwald | 0,843 |
| Sportler | 0,763 | | |

Balla (0,721) ist der Referenzfall für eine erlaubte lokale Lücke; die harte Schwelle 0,70 liegt knapp darunter, das Ziel 0,78 darüber.

---

## 15. Test des Vertrags

Drei Werk-Previews (Bademaxx, Aufbruch, Regenwald) wurden in einem **Preview-Klon** gebaut und geprüft; die Seiten selbst liegen nicht in diesem Repo. Die zugehörigen Deskriptoren stehen in `ps-contract.json` (`layouts.bademaxx`, `.aufbruch`, `.regenwald`) und sind die Referenz für Nachbauten. Ergebnisse:

- **Bademaxx:** 5-Spalten-Ordnung; Hero spannt Spalte 1–3, Text Spalte 4–5; darunter fünf gleiche Detailbilder (das 3:2-Bild deklariert auf 4:3 beschnitten) — `fill` 0,758, 0 hart.
- **Aufbruch:** 3-Spalten-Ordnung; Band aus 4-3-2, darunter Hero 1 + das auf 0,662 beschnittene Detail 5 + Text — `fill` 0,833, 0 hart; Hero-Anteil 1,01 ist soft, weil die Dichte ≥ 0,70 liegt.
- **Regenwald:** 3-Spalten-Ordnung; Hero spannt Spalte 1–2, Text sitzt in Spalte 3, Strip 2-3-4 füllt dieselben Spalten — `fill` 0,843, 0 hart.

Verifiziert bei 1440 (composition) **nach** `document.fonts.ready` und Bildload. Spalten/Zeilen der drei Layouts sind bündig (Aufbruch: c1–c3; Regenwald: c3; Bademaxx: fünf gleiche Strip-Spalten). Der Footer-Gap kann im MCP-Browser um den 4/3-`vw`-Faktor abweichen; bei DPR 1 entspricht `3vw` der Vertragsformel. 1920/1366 und Stack sind für die neuen Layouts noch nicht nachgemessen.

---

## 16. P0-Gate & QA-Checkliste

**P0 (MUSS — ohne diese Punkte keine Abgabe):**
- [ ] Familie (PS/Werk) und Tokens gewählt; keine dritte Familie.
- [ ] Spatial Thesis (5 Sätze) und Musterwahl im Deskriptor; `adjacency` gesetzt.
- [ ] Content-Schema vollständig; alle Bild-Aspekte gemessen.
- [ ] `PSAudit.run(contract)` bei 1920/1440/1366 und 1200/1024 **nach Font- und Bildload**: `summary.failed == 0`.
- [ ] Dichte `fill ≥ 0,70` hart geprüft; `density.target` (0,78) soft berichtet.
- [ ] Soft-Checks berichtet (`free.*`, `page.glance`, Labels), nicht verschwiegen.
- [ ] `deviations` leer oder vollständig begründet.
- [ ] A11y: Fokus, Kontrast, Reduced Motion, Alt-Texte, Touch-Ziele, Reihenfolge.
- [ ] Screenshot-Kritik durchgeführt; genau eine Kühnheit.

**Quality Bar (beantwortet der Vertrag diese fünf Fragen?):**
1. Welche Oberfläche/Familie ist es?
2. Was bleibt aus den Referenzen erhalten?
3. Was darf nicht kopiert werden?
4. Welche Tokens, Gaps und Muster sind bindend?
5. Was würde das erste Artefakt im Review durchfallen lassen?

**Abnahme-Satz:** Ein zweiter Agent kann das erste Artefakt bauen, **ohne nachzufragen**.

---

## 17. Außerhalb des Vertrags (vorerst)

- Mobile-Modus (≤ 900 px) als eigener Modus; 768/390 sind bis dahin Smoke-Checks.
- 2560 px / Ultra-Wide / 4K; Bild-Upscaling oberhalb 1,5×.
- Automatischer Solver/Generator (die Solver-Formeln gelten, die Automatisierung nicht).
- Dark Mode, Motion-System, i18n.
- Inhaltsredaktion, neue Assets, andere Site-Seiten.

---

## Anhang A — Herkunft & Nicht-Ziele (Research, Stand 17.11.2026)

**Übernommen (Struktur/Sprache/Prozess):**

| Quelle | Übernommen | Nicht übernommen |
|---|---|---|
| `nexu-io/open-design@reference-design-contract` | Evidenz-Konfidenz (`observed/provided/inferred`), Keep/Change/Do-not-copy, eine Stance, P0-Gate „zweiter Agent baut ohne Nachfragen", Handoff-Kürze | Stil-Ableitung aus fremden Screenshots |
| `anthropics/skills@frontend-design` | Plan (4 Teile + ASCII-Wireframe), Review vor Build, „boldness in one place", Screenshot-Kritik | AI-Tells als Prüfkriterium, Copywriting |
| `bergside/awesome-design-skills@editorial` | „jede Regel an Token/Schwelle/Beispiel", MUSS/SOLLTE, QA-Checkliste | Fonts, Farben, Component-States |
| `julianoczkowski/designer-skills@design-tokens` | Token-Namensschema, Spacing-Formel-Idee, Line-Height-Bereiche, „Bestand scannen, dann erweitern" | Dark-Mode-Pflicht, Radii/Shadows/Motion |
| `owl-listener/designer-skills@layout-grid` | Glossar (Modular/Compound), „Grid dokumentieren", intentional grid-breaking | 12-Spalten-Dogma |
| `pbakaus/impeccable` (lokal, `reference/layout.md`) | Zwei-Pass-Audit, Spatial Thesis (5 Punkte), „kein bloßes Ja", Verify-Liste | Squint-Automatisierung (nur qualitativ übernommen), CSS-Heuristik-Detector |
| `arvindrk/extract-design-system` | `raw → normalized → Artefakt`, „nichts inferieren" | Fremde Sites, Projektdateien schreiben |

**Nicht-Ziele (bewusst):** Dark Mode, Motion-System, Component-Bibliothek, AI-Layout-Generierung als Ersatz für Solver/Validator, 12-Spalten-Raster, visuelle Regression über Screenshot-Diffs (noch nicht).

**Fazit:** ~70 % sind gelöste Räder (Tokens, Skala, Grid, A11y, Prozess) und werden wiederverwendet. ~30 % sind custom und bleiben hier: Flushness mit Toleranz, **Dichte (Ink/BBox)**, No-Crop-Invariante, Hero-Anteil, bildgetriebene Muster, Strip/Band-Solver, Playwright-Geometrieaudit. Die Dichte-Metrik liefert kein geprüftes Skill; sie kommt aus dem Balla-Befund (hohe Füllung trotz leerer Ecke).

---

## Anhang B — Werkzeuge

| Datei | Rolle |
|---|---|
| `docs/projektstudien-contract/Contract.md` | normativ (dieses Dokument) |
| `docs/projektstudien-contract/ps-contract.json` | Tokens, Toleranzen, Seiten-Deskriptoren, `deviations` |
| `docs/projektstudien-contract/ps-audit.js` | Browser-Prüfer; exponiert `PSAudit.run(contract)` und `PSAudit.measure(contract)` |
| `.opencode/skills/projektstudien-contract/SKILL.md` | Prozess-Skill: Trigger, Ablauf, P0-Gate; verweist hierher |

**Audit-Aufruf:** Seite im Browser laden → `page.addScriptTag({ path: 'docs/projektstudien-contract/ps-audit.js' })` → pro Viewport `page.evaluate(() => PSAudit.run(contract))`. Der Prüfer erwartet die `ps-*`-Struktur: Root `.ps-detail`, darin ein direktes `div[class^="ps-"]` als Blatt, Text in `[class*="-text"]`, Seiten in `[class*="-side"]`, plus `.site-foot`. Neue Templates übernehmen diesen Wrapper; Spalten/Zeilen/Zellen kommen aus dem Deskriptor, der Root nicht.

**Caveat:** Die Skill-Recherche hat den Stichtag 17.11.2026. `pbakaus/impeccable@layout` existiert nicht als eigenes Paket; bewertet wurde die lokal installierte Referenz. Die Werk-Tokens sind `provided`, nicht an echten Werkseiten gemessen.

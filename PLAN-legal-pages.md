# Impressum & Datenschutz — Inhalt + Layout Plan

**Category:** Bounded
**Review:** full-check

**Goal:** Impressum und Datenschutzerklärung inhaltlich rechtswirksam aktualisieren (veraltete Rechtsgrundlagen, toter ODR-Link, falscher Hoster, fehlende DSGVO-Abschnitte, CDN-Drittdienst) und das Layout verbessern (CSS-Deduplizierung, Inhaltsverzeichnis, Typografie).

**Files:**
- Modify: `src/pages/impressum.astro` (Rechtsgrundlagen DDG/MStV, ODR-Abschnitt entfernen, gemeinsame CSS nutzen)
- Modify: `src/pages/datenschutz.astro` (Hoster generisch, CDN erwähnen, fehlende DSGVO-Abschnitte, Inhaltsverzeichnis, Social-Media-Abschnitt, gemeinsame CSS nutzen)
- Create: `src/styles/components/legal.css` (gemeinsame Styles, aus beiden Seiten extrahiert)

## Steps (concrete, no placeholders)

1. **Gemeinsame CSS-Datei anlegen** — `src/styles/components/legal.css` mit dem vereinigten Style-Set aus beiden Seiten (`.page-content`, `h1`, `.legal-section`, `.legal-section h2`, `.legal-block h3`, `.legal-block p/li`, `.legal-block strong`, `.legal-address`, `.legal-list`, `.legal-block a`, Media-Query ≤740px). Zusätzlich: `h1 { margin-bottom: 2.5rem }` (statt 5rem), `.legal-section h2 { text-wrap: balance }`, `.legal-section { scroll-margin-top: 120px }` (Anker unter dem fixen Header). In beiden Seiten das `<style>`-Block entfernen und `import "../styles/components/legal.css";` im Frontmatter ergänzen.

2. **Impressum — Rechtsgrundlagen aktualisieren:**
   - `§ 5 TMG` → `§ 5 DDG`
   - `§ 55 Abs. 2 RStV` → `§ 18 MStV`
   - `§ 7 Abs.1 TMG` → `§ 7 Abs. 1 DDG`
   - `§§ 8 bis 10 TMG` → `§§ 8 bis 10 DDG`

3. **Impressum — ODR/Streitschlichtung entfernen:** Den kompletten `<section>` "Streitschlichtung" (Zeilen 31–37) löschen — die EU-OS-Plattform wurde 2025 eingestellt, der Link ist tot.

4. **Datenschutz — Hosting generisch:** Im Abschnitt "2. Hosting" die konkrete Nennung "Tuta GmbH & Co. KG, Kölner Str. 292, 50825 Köln" und den Tuta-Link entfernen. Ersetzen durch generische Formulierung: "Die Website wird bei einem externen Dienstleister gehostet. Die beim Besuch der Website erhobenen Daten werden auf den Servern des Hosters gespeichert. Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO zur Wahrung unserer berechtigten Interessen an einer fehlerfreien und sicheren Bereitstellung der Website." (Art. 28 AVV-Satz kann bleiben, da generisch.)

5. **Datenschutz — CDN-Drittdienst im Hosting-Abschnitt ergänzen:** Neuer Absatz nach dem Hosting-Text: "Zur Auslieferung von Skripten und Bibliotheken (u. a. für die Katalog-Ansicht) wird ein Content Delivery Network (CDN) des Anbieters jsDelivr (jsdelivr.com) genutzt. Beim Laden dieser Ressourcen wird Ihre IP-Adresse an den CDN-Anbieter übermittelt. Die Nutzung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO zur technisch fehlerfreien und effizienten Bereitstellung der Website."

6. **Datenschutz — fehlende DSGVO-Abschnitte ergänzen** (im Abschnitt "3. Allgemeine Hinweise und Pflichtinformationen", als neue `<h3>`-Blöcke):
   - **Einschränkung der Verarbeitung:** "Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen (Art. 18 DSGVO)."
   - **Widerspruchsrecht:** "Sie haben das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit gegen die Verarbeitung Ihrer personenbezogenen Daten Widerspruch einzulegen (Art. 21 DSGVO)."
   - **Beschwerderecht:** "Im Falle datenschutzrechtlicher Verstöße steht Ihnen ein Beschwerderecht bei einer Aufsichtsbehörde zu (Art. 77 DSGVO)."
   - **SSL/TLS-Verschlüsselung:** "Diese Seite nutzt aus Sicherheitsgründen eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von http:// auf https:// wechselt und an dem Schloss-Symbol in Ihrer Browserzeile."

7. **Datenschutz — Social-Media-Abschnitt ergänzen** (neuer Abschnitt nach "4. Datenerfassung"): "Diese Website verlinkt auf Präsenzen bei Instagram und Facebook. Beim Aufruf dieser Links werden keine Daten an die Anbieter übertragen; erst beim Klick auf den Link verlassen Sie diese Website. Für die dortige Datenverarbeitung gelten die Datenschutzhinweise des jeweiligen Anbieters."

8. **Datenschutz — Inhaltsverzeichnis mit Ankern:** Nach dem `<h1>` ein `<nav class="legal-toc">` mit `<ul>` einfügen, das die 8 Abschnitte verlinkt. Jeder `<section class="legal-section">` bekommt eine `id` (z. B. `id="datenschutz-auf-einen-blick"`, `id="hosting"`, `id="allgemeine-hinweise"`, `id="datenerfassung"`, `id="cookies"`, `id="urheberrecht"`, `id="bildnachweise"`, `id="quelle"`). Die `<h2>`-Überschriften bleiben unverändert. `.legal-toc`-Styles in `legal.css`: `list-style: none`, Links in `var(--color-primary)`, `margin-bottom: 3rem`.

## Verification
- `npm run build` (exit 0)
- Browser-Check auf `/impressum` und `/datenschutz`:
  - Impressum: keine "TMG"/"RStV"-Erwähnung mehr, kein ODR-Abschnitt, DDG/MStV korrekt.
  - Datenschutz: kein "Tuta" mehr, CDN-Absatz vorhanden, 4 neue DSGVO-Abschnitte (Einschränkung, Widerspruch, Beschwerde, SSL/TLS), Social-Media-Abschnitt, Inhaltsverzeichnis mit funktionierenden Ankern (scroll-margin-top greift).
  - Layout: gemeinsame legal.css greift, h1-Abstand reduziert, h2 mit text-wrap: balance, keine CSS-Duplikation mehr.

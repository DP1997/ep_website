# Retrospektive (Interaktion)

## Start
- Nutzer spezifiziert Feature pr├ñzise inkl. Sonderf├ñllen (Close-Button von Anfang an rot) und expliziter Erhaltungsweise (Code auskommentieren, nicht l├Âschen)

## Stop
- KI exploriert >20 Tool-Calls (grep/read/bash) ohne zuvor den verlangten Ausf├╝hrungsplan zu pr├ñsentieren

## Continue
- KI nutzt read/grep/glob statt Terminal f├╝r Recherche und bleibt eigenst├ñndig (Tool-Autonomie)

## Glad · Sad · Mad
- Glad: Det þö¿µêÀeiler Anweisungen enthalten Farb-Regeln, Ausnahme (Close-Button) und klar "kein L├Âschen, nur kommentieren"
- Sad: Sitzungs-Transript endet mitten in der Exploration ohne sichtbares Ergebnis/Plan/Kommunikation
- Mad: KI verbrannte >20 Recherschritte bevor ein strategischer Ausf├╝hrungsplan pr├ñsentiert wurde

## Learnings → AGENTS.md
### Quellcode-Verifikation vor Signatur-Annahme
- **Beobachtung:** "Let me inspect the StPageFlip source to confirm exactly which option controls..." vor Umsetzung
- **Regel:** Event-Signaturen
- **Nutzen:** Sichert korrekte Callback-/Optionsparameter, verhindert falsche Umsetzung
- **Priorität:** hoch

### Exploration vor Plan
- **Beobachtung:** ~20 grep/read/read-Bash ohne vorherigen Ausf├╝hrungsplan f├╝r Nutzer sichtbar
- **Regel:** Ausf├╝hrungsplan vor Code-├änderung
- **Nutzen:** Nutzer folgt Fortschritt, Kontext bleibt klein
- **Priorität:** mittel

### Nicht-destruktive Refactoring-Pr├ñferenz
- **Beobachtung:** Nutzer will track-Funktion nicht l├Âschen sondern elegant kommentiert/deaktiviert lassen
- **Regel:** (keine explizite AGENTS-Zeile, aber Nutzungspr├ñferenz)
- **Nutzen:** Erhaltung der Codebase f├╝r sp├ñtere Wiederherstellung
- **Priorität:** mittel

### Tool-Autonomie mit read-first
- **Beobachtung:** KI nutzt gezielt grep/read/glob statt ganzer Dateien, nur f├╝r Suche
- **Regel:** Dateioperationen / gezieltes Lesen
- **Nutzen:** Spart Kontext und Tokens
- **Priorität:** hoch

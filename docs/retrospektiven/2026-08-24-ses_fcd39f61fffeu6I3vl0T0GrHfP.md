# Retrospektive (Interaktion)

## Start
- [Nutzer] Iteriert in kleinen Schritten mit konkretem visuellem Feedback ("Pille oben rechts ist besser")

## Stop
- [Nutzer] Gibt Feedback als Korrekturwunsch statt Best├ñtigung, KI committet nicht (AGENTS-Regel)

## Continue
- [KI] Fragt nach Best├ñtigung vor Commit ("Committen?")

## Glad · Sad · Mad
- Glad: KI verifiziert live im Browser mit numerischen DOM-Messungen statt nur Build
- Sad: KI musste mehrfach nachbessern (Verzerrung, Rahmenbreite, Toast-Hidden)
- Mad: KI f├╝hrte versehentlich doppelte Funktionen ein und entfernte Kommentare

## Learnings → AGENTS.md
### Browser-Verifikation
- **Beobachtung:** KI pr├╝fte jede ├änderung live per Playwright mit exakten Zahlen (workBottom=Viewport, AR=1.464) statt nur Build
- **Regel:** AGENTS: Debugging/Verifikation
- **Nutzen:** Reduziert Nachbesserungs-Schleifen
- **Priorität:** hoch

### Best├ñtigung-vor-Commit
- **Beobachtung:** KI wartete nach jeder Feature-Fertigstellung auf Nutzer-Best├ñtigung, bevor es committete
- **Regel:** AGENTS: Auto-Commit nach abgeschlossener Arbeit
- **Nutzen:** Verhindert falsche Commits bei unfertiger Arbeit
- **Priorität:** hoch

### Kleine-├änderungs-Schleifen
- **Beobachtung:** Nutzer gab Feedback in winzigen Schritten (Pille-Position, Rahmenbreite, Toast-Farbe), KI setzte je einzeln um
- **Regel:** AGENTS: Pr├ñgnanz/Token-Effizienz
- **Nutzen:** Schnelle Iteration, klare Zuordnung
- **Priorität:** mittel

### Fehler-Erkennung-durch-Nutzer
- **Beobachtung:** Nutzer entdeckte Bugs (verzerrte Bilder, permanenter Toast, fehlende Meldung), die KI-Tests ├╝bersahen
- **Regel:** AGENTS: Debugging
- **Nutzen:** Visuelle Pr├╝fung durch Nutzer bleibt n├Âtig
- **Priorität:** mittel

### Best-Practice-Recherche
- **Beobachtung:** KI erkl├ñrte State-of-the-Art (Facet-Counts, Toast-Goldstandard) bevor Implementierung
- **Regel:** AGENTS: Bibliotheken/Modern
- **Nutzen:** Nutzer entscheidet fundiert
- **Priorität:** niedrig

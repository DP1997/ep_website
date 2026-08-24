# Retrospektive (Interaktion)

## Start
- [KI] webfetch/bashtools zur Recherche genutzt, bevor Code ge├ñndert wurde

## Stop
- [KI] wiederholte blockierende Terminal-Warte-Schleifen (Nutzer musste 3x "weiter" sagen)

## Continue
- [KI] Diagnose isoliert (Audio/Whisper vs. Trigger) statt blind zu raten

## Glad · Sad · Mad
- Glad: Smoke-Test best├ñtigte GPU/CUDA-Pfad vor Nutzung
- Sad: Hotkey-Kollisionen (Ctrl+Shift+M, Win+Shift+Space) erst nach mehreren Fehlversuchen erkannt
- Mad: Falsche Annahmen (Conformer XL existiere, foges sei Windows-tauglich) ohne Verifikation

## Learnings → AGENTS.md
### Hotkey-Verifikation
- **Beobachtung:** Hotkeys erst gegen System-Reservierungen pr├╝fen, bevor sie eingebaut werden
- **Regel:** Event-Signaturen: NIEMALS annehmen, IMMER pr├╝fen
- **Nutzen:** Vermeidet mehrfache Fehlversuche
- **Priorität:** hoch

### Isolierte Diagnose
- **Beobachtung:** Audio/Engine vs. Trigger getrennt testen, um Ursache einzugrenzen
- **Regel:** Debugging: nach 2+ Fixversuchen console.log/Debug einbauen
- **Nutzen:** Spart Zeit, findet echte Ursache
- **Priorität:** hoch

### Umgebungs-Erkundung
- **Beobachtung:** Bestehende Env (Conda, CUDA, gecachtes Modell) pr├╝fen statt neu aufzusetzen
- **Regel:** Gezieltes Lesen statt ganze Repos einlesen
- **Nutzen:** Nutzt vorhandene Ressourcen, weniger Setup
- **Priorität:** mittel

### Autostart-Frage
- **Beobachtung:** Nach Abschluss aktiv nachfragen, ob Autostart/Login-Start gew├╝nscht
- **Regel:** Auto-Commit nach abgeschlossener Arbeit
- **Nutzen:** Deckt implizite Anforderungen ab
- **Priorität:** mittel

### Annahme-Verifikation
- **Beobachtung:** Behauptungen (Modellgr├Â├ƒen, Plattform-Kompatibilit├ñt) vor Umsetzung verifizieren
- **Regel:** Event-Signaturen: NIEMALS annehmen
- **Nutzen:** Vermeidet falsche Empfehlungen
- **Priorität:** hoch

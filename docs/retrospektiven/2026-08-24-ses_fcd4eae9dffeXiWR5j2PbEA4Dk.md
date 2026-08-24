# Retrospektive (Interaktion)

## Start
- [Nutzer] Worktree-├£berblick anfordern

## Stop
- [KI] Mehrfach-Debugging ├╝ber viele Sessions statt einer (Nutzer: "immer nur mit einem Sitzungsverlauf")

## Continue
- [Nutzer] Vor Umsetzung nachfragen, ob Worktree korrekt ist

## Glad · Sad · Mad
- Glad: KI fand scoped Styles als Ursache f├╝r "kein Unterschied"
- Sad: Viele Token im Debugging durch zu breite Testl├ñufe
- Mad: Modell deepseek-v4-flash ignoriert strikte Format-Vorgaben wiederholt

## Learnings → AGENTS.md
### cmd.exe-Argumentlimit
- **Beobachtung:** Langer Prompt (12k+) schl├ñgt fehl, kurzer liefert sauberes JSON
- **Regel:** Lange Inhalte per --file ├╝bergeben, Prompt kurz halten
- **Nutzen:** Robustheit
- **Priorität:** hoch

### --sanitize redigiert Inhalte
- **Beobachtung:** Analyse lieferte nur Struktur, keine Inhalte
- **Regel:** --sanitize nur f├╝r externe Weitergabe, nie f├╝r Analyse
- **Nutzen:** Qualit├ñt
- **Priorität:** hoch

### stderr verschmutzt Export
- **Beobachtung:** *> schrieb stderr-Meldung in JSON-Datei
- **Regel:** stderr sauber verwerfen, stdout getrennt erfassen
- **Nutzen:** Robustheit
- **Priorität:** hoch

### Variablen-Tippfehler
- **Beobachtung:** $MaxTranscriptChars statt $MaxChars ÔåÆ leerer String
- **Regel:** Funktionen isoliert testen, Variablen konsistent benennen
- **Nutzen:** Effizienz
- **Priorität:** mittel

### Selbst-Analyse-Loop
- **Beobachtung:** opencode run erzeugt eigene Sessions, die erneut analysiert w├╝rden
- **Regel:** Analyse-Sessions mit --title-Pr├ñfix markieren und ausschlie├ƒen
- **Nutzen:** Kosten
- **Priorität:** hoch

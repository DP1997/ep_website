# AGENTS.md

## Rolle & Stack

- **Rolle:** Du bist ein erfahrener Frontend-Entwickler mit Fokus auf Performance, Barrierefreiheit und moderne Web-Architektur.
- **Stack:** Primärer Stack ist Astro, ergänzt durch modernes Vanilla JavaScript (ES6+) und modernes CSS.
- **Kernprinzip:** "Ship less JavaScript." HTML und CSS vor JS priorisieren. Astros Islands-Architektur voll ausschöpfen.
- **Performance First:** Jede Codezeile muss ihre Existenz rechtfertigen. Abstraktionsschichten vermeiden, die Performance behindern.
- **Semantische Struktur:** Immer semantische HTML5-Elemente (`<article>`, `<section>`, `<nav>`, etc.) für Barrierefreiheit und SEO.

## Arbeitsweise

- **Kommentare:** Generierten Code immer mit knappen Erklärungen versehen (was und warum).
- **Ausführungsplan:** Vor jeder Code-Änderung einen strategischen Schritt-für-Schritt-Plan im Chat ausgeben und nur einmalig freigeben lassen, dann direkt umsetzen statt erneut anzufragen.
- **Plan-Gate:** Vor dem ersten Programmcode (Code-Änderungen) einen kurzen, knappen Plan mit den wichtigsten Details im Chat präsentieren und freigeben lassen. Erst nach Freigabe beginnt die Umsetzung — danach volle Autonomie bis zur Fertigstellung (keine weiteren Rückfragen, außer bei irreversiblen/destruktiven, sicherheitskritischen oder außerhalb des Worktrees wirkenden Aktionen).
- **TODO-Liste:** Der Plan wird als konkrete TODO-Schritte über die `todowrite`-Funktion angelegt (Status: `pending`/`in_progress`/`completed`). So erscheinen die Schritte im separaten Terminal-Fenster von opencode und der Nutzer kann jederzeit nachverfolgen, was abgeschlossen ist, woran gerade gearbeitet wird und was noch aussteht. Status bei jedem Schrittwechsel aktualisieren.
- **Prägnanz (Orchestrator):** Kurz, klar und ohne Fülltext antworten (maximal 3 Zeilen, außer der Nutzer verlangt explizit Details). Bulletpoints statt Prosa, keine Zusammenfassungen nach Commits, keine Erklärungen wenn nicht explizit verlangt. Nur Diff statt Volltext zeigen. Der `caveman`-Skill ist optional, wenn maximale Kompression gewünscht ist. **Ausnahme:** Plan-, Review- und Analyse-Deliverables (z. B. Feasibility-Analyse, Code-Review-Berichte, Plan-Dokumente) sind von der 3-Zeilen-Grenze ausgenommen — sie dürfen so ausführlich sein, wie es ihr Zweck erfordert.
- **Caveman-Default (Worktree-Session):** In gespawnten Feature-Worktree-Sessions ist `caveman`-Stil der Default — maximale Kompression, keine langen Sätze, keine Prosa-Zusammenfassungen, keine Wiederholung des Offensichtlichen. Statusmeldungen auf das Nötigste reduzieren (z. B. "Task 2 done, 3/5 Tests grün" statt Absatz). **Ausnahme:** Plan-, Review- und Analyse-Deliverables sind auch hier von der Kompression ausgenommen.

## Auto-Commit nach abgeschlossener Arbeit

- **Automatisch committen:** Nach einer erfolgreich umgesetzten Änderung oder einem Bugfix automatisch committen — ohne explizite Aufforderung.
- **Erfolgssignal:** Der Nutzer fährt mit einem neuen Problem oder Feature fort, ohne auf die vorherige Implementierung einzugehen. In diesem Fall gilt die Arbeit als bestätigt und wird committet.
- **Gegensignal:** Geht der Nutzer auf die vorherige Implementierung ein (Feedback, Korrekturwunsch, Feinschliff), war sie noch nicht korrekt oder unvollständig — dann NICHT committen, sondern erst nacharbeiten.
- **Zeitpunkt:** Der Commit zur vorherigen Implementierung wird erst festgestellt, wenn die nächste Prompt des Nutzers eintrifft. Erst dann ist klar, ob die Arbeit bestätigt oder nachzubessern ist.

## Token-Effizienz (minimaler Input/Output, maximale Leistung)

- **Kontext klein halten:** Kurze, fokussierte Sessions pro Feature/Bug. Nach abgeschlossener Aufgabe neue Session starten.
- **Gezieltes Lesen:** Nur die für die Aufgabe relevanten Dateien lesen. Vor dem Lesen per `grep`/`glob` eingrenzen, nicht ganze Repos oder Verzeichnisse einlesen.
- **Output begrenzen:** Build-/Test-Logs nur auf relevante Zeilen filtern (z. B. `Select-String "error|Complete"`), nie den vollen Output in den Chat ziehen. Bei großen Tool-Outputs nur die relevanten Ausschnitte zeigen.
- **Delegation:** Für Recherche/Analyse den `explore`-Sub-Agent nutzen, damit nur das Ergebnis (nicht alle gelesenen Dateien) in den Kontext gelangt. Große Dateien/Recherchen in großen segmentierten Read-Fenstern lesen oder an explore-Agent delegieren.
- **Wiederkehrendes auslagern:** Konventionen und Regeln in dieser `AGENTS.md` halten, statt sie pro Prompt neu zu formulieren.

## Bibliotheken

- **Aktive Pflege:** Nur aktiv gepflegte Quellen verwenden (Commits in den letzten 1–2 Jahren, aktive Issues/PRs, klare Roadmap, moderne Build-Tooling/CI).
- **Veraltete warnen:** Vor veralteten Bibliotheken warnen: Risiken (Sicherheit, Kompatibilität, fehlende Bugfixes) erklären und Alternativen vorschlagen. Explizite Zustimmung des Nutzers einholen, bevor veraltete Abhängigkeiten verwendet werden.
- **Ablehnen:** Bibliotheken ohne nennenswerte Updates seit 5+ Jahren ablehnen. Turn.js (letztes Update ~2012) ist explizit blockiert — stattdessen StPageFlip oder moderne Alternativen.
- **Pinnen:** Versionen pinnen (z. B. `page-flip@2.0.7`, nicht `latest`). Wartungsstatus überwachen. Lokales Bundling vs. CDN-Import abwägen.

## Software- & Tool-Kompatibilität

- **Plattform zuerst:** Vor Installation oder Verwendung von Software, Tools, Agenten, Skills oder Plugins IMMER zuerst die Kompatibilität mit dem Zielsystem prüfen — nicht erst nach der Installation. Zielsystem (aktuell): Windows 11 (win32), PowerShell 5.1, Node 22.12+, Astro 7, Git-Bash/WSL vorhanden.
- **Checkliste vor jeder Installation:** 1) Deklarierte Plattform-Unterstützung (Manifest `platforms`, `engines`, README-/Requirements-Angaben); 2) Laufzeit-Abhängigkeiten (bash/sh/Python/`uname`/Rust-Builds sind typische macOS/Linux-only-Kandidaten, Windows-Pfade ohne `.exe` verdächtig); 3) Build-Scripts auf Platform-Zweige für das eigene OS prüfen.
- **Kein stille Installation:** Bei Nicht-Kompatibilität NICHT installieren. Dem Nutzer melden, warum (mit Beleg, z. B. Manifest-Zeile), und kompatible Alternativen vorschlagen.

## Feasibility-Analyse (vor JEDEM Feature)

- **Machbarkeit zuerst:** Bevor ein Feature, Request oder Bugfix implementiert wird, prüfen: Ist es überhaupt möglich und sinnvoll (Stack, Abhängigkeiten, bestehende Architektur)? Verwerfen, wenn die Idee alles zerschießen würde, fernab gängiger Praxis ist oder einen extrem ungewissen Ausgang hat (hacky, umständlich, unklar ob es funktioniert).
- **Aufwandsabschätzung:** Wenn machbar, Einstufung in drei Kategorien — **Komplex** (mehrere Module/Ansätze, hohe Fehleranfälligkeit, tiefer Architektur-Eingriff), **Mittel** (lokale Änderung mit Randbedingungen, mehrere Dateien, Koordination nötig), **Trivial** (eine Datei, klar abgegrenzt, sofort umsetzbar).
- **Ergebnis dokumentieren:** Kurze Begründung (Machbarkeit + Aufwand) + Empfehlung (umsetzen / anders lösen / verwerfen) im Chat ausgeben. Die Entscheidung des Nutzers abwarten, bevor Code entsteht.
- **Review-Pflicht nach Verifikation:** Nach abgeschlossener Implementierung und Verifikation ist ein Code-Review verpflichtend, bevor der Worktree als fertig gemeldet wird. Die Art skaliert mit der Komplexität: **Trivial/Mittel** → `requesting-code-review` (1 Subagent, kombiniertes Verdict). **Komplex** → `code-review` (2 parallele Subagenten, getrennte Verdicts Standards vs. Spec). Nicht beide gleichzeitig — bei komplex gilt Schritt 10 statt Schritt 9.

## Fail-Fast statt Gates

- **Grundregel:** Gates nur dort, wo ein Fehler teuer ist (Konzept-Freigabe, Merge, Push). Überall sonst: Fail-Fast — automatisch validieren, nur bei Anomalie den Nutzer einschalten.
- **Automatisch validieren:** Erwartung (Branch, Worktree, Build, Tests, Assets) automatisch prüfen, ohne vorab um Erlaubnis zu fragen.
- **Nur bei Anomalie melden:** Bei Übereinstimmung still weiterarbeiten. Nur bei Mismatch/Fehlschlag den Nutzer als korrigierende Instanz einschalten.
- **Kein Bestätigungs-Gate:** Freigaben, die der Orchestrator bereits erteilt hat (z. B. Worktree-Spawn), nicht erneut einholen.

## Feature-Implementierung (Ablauf)

**Delegierendes Modell:** Primäre Session (Orchestrator) nimmt Feature-Requests sequenziell an, delegiert die Umsetzung in Worktree-Sessions und bleibt für den nächsten Request frei. Worktree-Sessions arbeiten asynchron und melden sich erst bei "ready for review" zurück.

### Phase A — Orchestrator (primäre Session)

1. **Feasibility-Analyse** (Machbarkeit + Aufwand Komplex/Mittel/Trivial + Empfehlung) — AGENTS.md.
2. **Brainstorming** nur bei Komplex (`brainstorming`); **Grill-me** optional, wenn der Entwurf unscharf ist (`grill-me`).
3. **Plan schreiben + Plan-Gate** (`writing-plans`): Plan schreiben (komplex: Pflicht, mittel: optional), kurzen Plan präsentieren, Freigabe abwarten. Danach volle Autonomie.
4. **Worktree + HERDR-Pane spawnen** (`herdr-worktree-spawn`): Erwarteten Branch-Namen als Kontext mitgeben. Kein separates Plugin nötig — HERDR subsummiert das Spawnen.
5. Weiter mit dem nächsten Feature — nicht auf Fertigstellung warten.

### Phase B — Worktree-Session

1. **Worktree-Check** (`git-worktree-check`, Delegations-Modus): Branch == erwartet UND nicht main → still weiterarbeiten. Nur bei Mismatch melden (Fail-Fast).
2. **Bootstrap** (`worktree-session-bootstrap`): TODO-Liste anlegen (erste Einträge: `npm install`, `Dev-Server: <url>`), `npm install` ausführen, Dev-Server starten (`scripts/start-dev-server.ps1`), URL als TODO-Eintrag anlegen. Erst danach beginnt die Implementierung.
3. **SDD** (`subagent-driven-development`): Implementer pro Task → Task-Reviewer → Fix-Loop (max. 5 Runden). `dispatching-parallel-agents` nur bei unabhängigen Problemen.
4. **Finale Verifikation** (`verification-before-completion`): volle Suite, Build, Browser — frische Evidenz vor jedem "fertig"-Claim.
5. **Code-Review + "ready for review"** (Pflicht, skaliert): Trivial/Mittel → `requesting-code-review` (1 Subagent). Komplex → `code-review` (2 parallele Subagenten, Standards vs. Spec). Nie beide. Nach dem Review "ready for review" melden — NICHT mergen, NICHT pushen.
6. **Nutzer-Review-Gate + Abschluss** (`finishing-a-development-branch`): Nach dem Review MUSS der Agent aktiv das Optionsmenü als Frage präsentieren (Merge local / Push+PR / Behalten) und auf die Antwort warten — nicht einfach stoppen. Die Integrations-Entscheidung liegt beim Nutzer. Freigabe → Abschluss; Änderungen → Fix-Runde; Verwerfen → Worktree abreißen.
7. **Aufräumen nach lokalem Merge (vollautomatisch)** (`worktree-cleanup`): Nach dem Merge und der Bestätigung durch den Nutzer räumt der Agent selbstständig auf — in exakt dieser Reihenfolge: (1) Dev-Server/Preview-Prozesse beenden, (2) Git-Worktree entfernen (`git worktree remove --force` + `git worktree prune`), (3) Verzeichnis löschen, (4) **zuletzt** HERDR-Workspace schließen. Bei fehlgeschlagenem Cleanup: `cleanup-worktree.ps1` (parametrisiert) verwenden.
8. **Merge-Repair** (`merge-repair`) nur nach lokalem Merge, in der primären Session.

**Kern-Pflichtkette:** Feasibility → Plan+Gate → Worktree-Spawn → Worktree-Check → Bootstrap → SDD → Verifikation → Review+ready-for-review → Nutzer-Gate+Abschluss → Cleanup.

## Datei-Operationen

- **Datei-Tools statt Terminal:** Immer die integrierten Datei-Tools (read, edit, write, glob, grep) für Dateioperationen und Inhalts-Inspektion verwenden — Datei-Tools vor Terminal. Terminal (bash) nur wenn zwingend nötig (Existenz prüfen, Builds, Tests). Niemals Terminal für Erstellen, Löschen oder Massen-Textmanipulation.

## Tool-Autonomie

- **Volle Autonomie:** Volle Autonomie bei Tool-Nutzung, ohne für jeden Aufruf um Erlaubnis zu fragen.
- **Sorgfältige Aufrufe:** Vor jedem Tool-Aufruf: erforderliche Argumente und Typen prüfen, Aufruf korrekt formatieren, das passendste Tool wählen (Datei-Tools vor Terminal). Fehler sauber behandeln, ohne Nutzer-Eingriff bei Routineoperationen.

## Agenten-Regeln (aus Retrospektiven)

- **Unklare Anforderungen erfragen:** Bei Unklarheit, Unsicherheit oder obskuren Namen (z.B. UI-Platzierung, Konzept, Referenzrahmen) aktiv nachfragen bzw. die Nutzer-Intention klären, statt Annahmen zu treffen oder falsche Dinge zu bauen; Annahmen transparent als Frage zurückgeben. Bei komplexen Features zuerst das Konzept des Nutzers erfragen statt direkt Code-Struktur abzuleiten.
- **Edit vorher lesen:** Vor Edit den vollständigen Zielblock lesen, nicht nur Ausschnitt.
- **Gruppierte-Auswahl:** Bündele alle Entscheidungen in einem einzigen Frage-Aufruf mit Mehrfachauswahl (multiple=true) statt mehrerer Einzelnachfragen, und präsentiere zuvor eine kompakte nummerierte Übersicht.
- **Empirische-Verifikation:** Verifiziere Fixes/Änderungen am echten Zustand (Log, Prozess-Instanz, Datei) und melde Erfolg erst nach tatsächlich verifizierter Umsetzung statt versprochener Fixes.
- **Einheitliche-Referenzquelle:** Nutze für Regeln/Dateien eine einheitliche Referenzquelle bzw. ein wiederkehrendes Datei-Schema (Externe Regeldatei) statt Inhalte im Prompt oder in mehreren Dateien zu duplizieren.

## Skill-Zuordnung (aufgabenspezifisch)

- **Browser-Verifikation:** `browser-verification` ist der GoTo bei jeder sichtbaren Änderung (numerisch messen). `playwright-best-practices` ist der Fallback — erst wenn harte Bugs nach 2–3 Ansätzen persistieren, echte Tests schreiben. `agent-browser` nur bei expliziter Nutzung.
- **UI/UX-Review:** `ui-ux-pro-max` ist der Standard für Design-Entscheidungen und UX-Review. `web-design-guidelines` nur bei explizitem "Review gegen Guidelines". `impeccable` nur auf expliziten Befehl (user-invocable).
- **Debugging:** `systematic-debugging` ist der einzige Debug-Skill — inkl. Referenz-Techniken `debug-logging.md` (Fail-Fast) und `css-cascade.md` (CSS-Bugs).

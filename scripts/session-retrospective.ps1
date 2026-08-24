# session-retrospective.ps1
# Automatischer Review aller opencode-Sessions: exportiert neue Sessions,
# lässt sie von einer KI zu Retrospektiven destillieren und kompiliert
# daraus Vorschläge für neue/aktualisierte Agentenregeln (AGENTS.md).
#
# Ausführung: täglich per Windows Task Scheduler (siehe Register-Funktion).
# Konfiguration über die Variablen oben. Der State (letzter Verarbeitungsstand)
# wird in einer JSON-Datei gemerkt, damit nur NEUE Sessions analysiert werden.

param(
    # Model für die KI-Analyse (Standard: opencode-default-Modell = deepseek-v4-flash).
    [string]$Model = 'ollama-cloud/deepseek-v4-flash'
)

# Continue statt Stop: native opencode.cmd-Aufrufe schreiben auf stderr
# (z. B. "Exporting session: ...") und würden den Lauf bei 'Stop' abbrechen.
$ErrorActionPreference = 'Continue'

# ---- Konfiguration -------------------------------------------------------
$ProjectRoot   = Split-Path -Parent $PSScriptRoot
$ArchiveDir    = Join-Path $ProjectRoot 'docs/session-archiv'
$RetroDir      = Join-Path $ProjectRoot 'docs/retrospektiven'
$StateFile     = Join-Path $ProjectRoot 'scripts/.session-retro-state.json'
$ExportDir     = Join-Path $ArchiveDir 'export'

# opencode-Befehl zur Laufzeit auflösen (npm-Pfad variiert je NVM-Version).
$OpendcodeBin = (Get-Command 'opencode.cmd' -ErrorAction SilentlyContinue).Source
if (-not $OpendcodeBin) { $OpendcodeBin = (Get-Command 'opencode' -ErrorAction Stop).Source }

# Sicherstellen, dass die Verzeichnisse existieren.
New-Item -ItemType Directory -Force -Path $ExportDir | Out-Null
New-Item -ItemType Directory -Force -Path $RetroDir   | Out-Null

# Letzte verarbeitete Session-Zeit aus State laden (0 = alle neu).
$lastProcessed = 0
if (Test-Path $StateFile) {
    $state = Get-Content $StateFile -Raw | ConvertFrom-Json
    $lastProcessed = [long]$state.lastUpdated
}

# Session-Liste als JSON holen.
$sessionJson = & $OpendcodeBin session list --format json 2>$null
if (-not $sessionJson) {
    Write-Output 'opencode session list ergab keine Daten. Abbruch.'
    exit 0
}
$sessions = $sessionJson | ConvertFrom-Json

# Nur Sessions berücksichtigen, die NACH dem letzten Lauf aktualisiert wurden
# UND nicht von der Retrospektive selbst stammen (verhindert Endlosschleife,
# da jede `opencode run`-Analyse eine eigene Session erzeugt).
$selfPrefix = '[Session-Review]'
$selfRegex  = '^' + [regex]::Escape($selfPrefix)
$newSessions = @($sessions | Where-Object {
    [long]$_.updated -gt $lastProcessed -and
    $_.title -notmatch $selfRegex
})
if ($newSessions.Count -eq 0) {
    Write-Output 'Keine neuen Sessions seit dem letzten Lauf. Abbruch.'
    exit 0
}

Write-Output "Verarbeite $($newSessions.Count) neue Session(s)..."

$analyzed = @()
foreach ($s in $newSessions) {
    $id = $s.id
    $exportFile = Join-Path $ExportDir "$id.json"

    # Voller Export (ohne --sanitize): die KI braucht die echten Inhalte.
    # stderr (Fortschrittsmeldung) getrennt verwerfen, damit die JSON sauber bleibt.
    & $OpendcodeBin export $id 2>$null | Out-File -FilePath $exportFile -Encoding utf8
    if (-not (Test-Path $exportFile)) {
        Write-Warning "Export von $id fehlgeschlagen – übersprungen."
        continue
    }

    # KI-Analyse: `--format json` liefert zeilenweise JSON-Events; nur die
    # `text`-Parts sind die eigentliche Antwort.
    $date = (Get-Date -Date ([DateTimeOffset]::FromUnixTimeMilliseconds([long]$s.updated)).LocalDateTime -Format 'yyyy-MM-dd')
    $retroFile = Join-Path $RetroDir "$date-$id.md"
    # Titel-Prefix markiert die Analyse-Session als Selbst-Ausschluss-Kandidat.
    $prompt = @"
Analysiere die exportierte opencode-Session in '$exportFile'.
Ziel: Arbeitsweise des Nutzers mit opencode effizienter, robuster und zielführender machen.

Gib als Antwort NUR die fertige Markdown-Retrospektive aus (kein Kommentar davor/danach), in Deutsch:

# Retrospektive
## Was wurde erreicht
Kernaussage in 1–2 Sätzen.
## Was lief gut
Kurze Bulletpoints.
## Was lief nicht gut
Kurze Bulletpoints (Fehler, Umwege, wiederkehrende Probleme).
## Regel-Vorschläge für AGENTS.md
- Konkrete Regel mit Begründung (1–2 Sätze). Falls nichts wertvoll: 'Keine.'

Max. 250 Wörter insgesamt.
"@
    $rawLines = @(& $OpendcodeBin run --model $Model --format json --title "$selfPrefix $id" $prompt 2>$null)
    $textParts = foreach ($line in $rawLines) {
        $line = $line.Trim()
        if (-not $line) { continue }
        try {
            $evt = $line | ConvertFrom-Json
            if ($evt.type -eq 'text' -and $evt.part.text) { $evt.part.text }
        } catch { continue }
    }
    $retro = ($textParts -join "`n").Trim()
    if (-not $retro) {
        Write-Warning "Retrospektive für $id nicht erzeugt – übersprungen."
        continue
    }
    $retro | Set-Content -Path $retroFile -Encoding utf8
    $analyzed += $id
}

# State aktualisieren: neueste 'updated' aller verarbeiteten Sessions merken.
$newStateLast = 0
foreach ($s in $newSessions) {
    if ([long]$s.updated -gt $newStateLast) { $newStateLast = [long]$s.updated }
}
@{ lastUpdated = $newStateLast } | ConvertTo-Json | Set-Content $StateFile -Encoding utf8

Write-Output "Abgeschlossen: $($analyzed.Count) Session(s) analysiert. Archiv: $ExportDir, Retrospektiven: $RetroDir"

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

# opencode-Befehl zur Laufzeit auflösen (npm-Pfad variiert je NVM-Version;
# Task-Scheduler-Prozesse haben oft einen anderen PATH → absolute Fallbacks).
$OpendcodeBin = (Get-Command 'opencode.cmd' -ErrorAction SilentlyContinue).Source
if (-not $OpendcodeBin) { $OpendcodeBin = (Get-Command 'opencode' -ErrorAction SilentlyContinue).Source }
if (-not $OpendcodeBin) {
    foreach ($candidate in @(
        "$env:APPDATA\npm\opencode.cmd",
        "$env:USERPROFILE\.local\bin\opencode.cmd"
    )) {
        if (Test-Path $candidate) { $OpendcodeBin = $candidate; break }
    }
}
if (-not $OpendcodeBin) {
    Write-Error 'opencode konnte nicht gefunden werden. Bitte Pfad in scripts/session-retrospective.ps1 prüfen.'
    exit 1
}

# Kompaktes Transkript aus einem opencode-Export (JSON) ziehen: je Nachricht
# die Rolle und – falls vorhanden – Text- bzw. Tool-Parts. Ausgabe auf
# $MaxTranscriptChars begrenzt, damit der Prompt handhabbar bleibt.
function Get-TranscriptFromExport {
    param(
        [string]$ExportFile,
        [int]$MaxChars = 40000
    )
    if (-not (Test-Path $ExportFile)) { return '' }
    $raw = Get-Content $ExportFile -Raw -Encoding UTF8
    try { $doc = $raw | ConvertFrom-Json } catch { return '' }

    $lines = New-Object System.Collections.Generic.List[string]
    foreach ($m in @($doc.messages)) {
        $role = if ($m.info.role) { $m.info.role } else { 'unknown' }
        foreach ($p in @($m.parts)) {
            if ($p.type -eq 'text' -and $p.text) {
                $lines.Add("[$role] $($p.text)")
            }
            elseif ($p.type -eq 'tool' -and $p.tool) {
                $lines.Add("[$role TOOL] $($p.tool)")
            }
            elseif ($p.type -eq 'patch') {
                $lines.Add("[$role PATCH] <geänderte Dateien>")
            }
        }
    }
    $text = $lines -join "`n"
    if ($text.Length -gt $MaxChars) {
        $text = $text.Substring(0, $MaxChars) + "`n[Transkript gekürzt]"
    }
    return $text
}

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
    # Antwortvertrag: Die KI liefert ein EINZIGES JSON-Objekt (kein Markdown).
    # Das Markdown-Gerüst baut das Skript deterministisch daraus — robust gegen
    # Modell-Quirks (Format-Ausreißer, Rollenspiel, Tools).

    # Kompaktes Transkript aus dem Export extrahieren (Rolle + Text + Tool-Namen)
    # und in eine Hilfsdatei schreiben. Der Prompt bleibt dadurch kurz —
    # kritisch: `opencode.cmd` läuft über cmd.exe mit ~8191-Zeichen-Argumentlimit.
    $transcriptFile = Join-Path $ExportDir "$id.transcript.txt"
    Get-TranscriptFromExport -ExportFile $exportFile | Set-Content -Path $transcriptFile -Encoding utf8

    # Einzeiliger, kompakter Prompt: mehrzeilige Prompts verleiten dieses
    # Modell zu Tool-Erkundung statt Format-Befolgung. Pipe-Format vermeidet
    # cmd.exe-Quoting-Probleme mit verschachtelten Anführungszeichen.
    $prompt = "Analysiere die opencode-Sitzung in der beigefügten Datei '$transcriptFile'. FOKUS: WIE Mensch und KI interagiert haben, NICHT was gemacht wurde. Extrahiere konkrete Learnings fuer effizienteres, robusteres Arbeiten (Start/Stop/Continue, Glad/Sad/Mad, belegte AGENTS.md-Regeln mit Mehrfach-Beleg). Antworte NUR mit Pipe-Zeilen, kein anderer Text, keine Tools: START||[Nutzer/KI] Aktion | STOP||[Nutzer/KI] Verhalten | CONTINUE||[Nutzer/KI] Praktik | GLAD||kurz | SAD||kurz | MAD||kurz | LEARN||Name||Beobachtung||AGENTS-Regel||Nutzen||hoch/mittel/niedrig. Max 5 LEARN. Ohne Beleg keine LEARN-Zeile."
    $rawLines = @(& $OpendcodeBin run --format json --title "$selfPrefix $id" $prompt --file $transcriptFile 2>$null)
    $textParts = foreach ($line in $rawLines) {
        $line = $line.Trim()
        if (-not $line) { continue }
        try {
            $evt = $line | ConvertFrom-Json
            if ($evt.type -eq 'text' -and $evt.part.text) { $evt.part.text }
        } catch { continue }
    }
    $answerText = ($textParts -join "`n").Trim()
    if (-not $answerText) {
        Write-Warning "Retrospektive für $id nicht erzeugt – übersprungen."
        continue
    }

    # Tag-basierter Scanner: Das Modell bündelt Kategorien teils in EINE Zeile
    # (z. B. "START||Aktion||LEARN||Name||..."), daher NICHT zeilenweise parsen.
    # Stattdessen alle TAG-Positionen finden und Inhalte dazwischen zuordnen.
    # Die echten Pipe-Zeilen stehen IMMER am Anfang der Antwort; danach folgt
    # teils Modell-Selbstgespräch → Scan auf die ersten 2500 Zeichen begrenzen.
    if ($answerText.Length -gt 2500) { $answerText = $answerText.Substring(0, 2500) }
    $tagPattern = 'START\|\||STOP\|\||CONTINUE\|\||GLAD\|\||SAD\|\||MAD\|\||LEARN\|\|'
    $matches = [regex]::Matches($answerText, $tagPattern)
    $start = New-Object System.Collections.Generic.List[string]
    $stop  = New-Object System.Collections.Generic.List[string]
    $contin = New-Object System.Collections.Generic.List[string]
    $glad = ''; $sad = ''; $mad = ''
    $learnings = New-Object System.Collections.Generic.List[object]
    for ($i = 0; $i -lt $matches.Count; $i++) {
        $m = $matches[$i]
        $endPos = if ($i + 1 -lt $matches.Count) { $matches[$i + 1].Index } else { $answerText.Length }
        $value = $answerText.Substring($m.Index + $m.Length, $endPos - ($m.Index + $m.Length)).Trim()
        # Nachlaufende Einzel-Pipe (Trenner des Modells) entfernen.
        $value = $value -replace '\s*\|\s*$', ''
        if (-not $value) { continue }
        switch ($m.Value) {
            'START||'    { $start.Add($value) }
            'STOP||'     { $stop.Add($value) }
            'CONTINUE||' { $contin.Add($value) }
            'GLAD||'     { $glad = $value }
            'SAD||'      { $sad = $value }
            'MAD||'      { $mad = $value }
            'LEARN||' {
                $parts = [regex]::Split($value, '\|\|')
                if ($parts.Count -ge 5) {
                    $learnings.Add([PSCustomObject]@{
                        name = $parts[0].Trim()
                        beobachtung = $parts[1].Trim()
                        regel = $parts[2].Trim()
                        nutzen = $parts[3].Trim()
                        prioritaet = $parts[4].Trim()
                    })
                }
            }
        }
    }

    # Markdown-Gerüst deterministisch aus den Listen bauen.
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.AppendLine('# Retrospektive (Interaktion)')
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine('## Start')
    foreach ($t in $start) { [void]$sb.AppendLine("- $t") }
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine('## Stop')
    foreach ($t in $stop) { [void]$sb.AppendLine("- $t") }
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine('## Continue')
    foreach ($t in $contin) { [void]$sb.AppendLine("- $t") }
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine('## Glad · Sad · Mad')
    [void]$sb.AppendLine("- Glad: $glad")
    [void]$sb.AppendLine("- Sad: $sad")
    [void]$sb.AppendLine("- Mad: $mad")
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine('## Learnings → AGENTS.md')
    if ($learnings.Count -gt 0) {
        foreach ($l in $learnings) {
            [void]$sb.AppendLine("### $($l.name)")
            [void]$sb.AppendLine("- **Beobachtung:** $($l.beobachtung)")
            [void]$sb.AppendLine("- **Regel:** $($l.regel)")
            [void]$sb.AppendLine("- **Nutzen:** $($l.nutzen)")
            [void]$sb.AppendLine("- **Priorität:** $($l.prioritaet)")
            [void]$sb.AppendLine('')
        }
    } else {
        [void]$sb.AppendLine('Keine belegten Regeln.')
    }

    $retro = $sb.ToString().Trim()
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

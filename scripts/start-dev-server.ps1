# start-dev-server.ps1
# Startet den Astro-Dev-Server vollstaendig detached und kehrt sofort zurueck.
#
# Warum: `npm run dev` laeuft kontinuierlich. Ein synchroner Start blockiert die
# Agent-Session (wartet auf Exit-Code, der nie kommt). Redirect-Handles von
# Start-Process blockieren ebenfalls, solange der Kindprozess lebt.
#
# Loesung: `cmd /c "npm run dev > log 2>&1"` leitet den Output selbst in die
# Datei um - der Parent haelt keine Handles, Start-Process kehrt sofort zurueck.
# Das Skript pollt dann die Log-Datei auf die reale URL und gibt sie aus.

param(
  [string]$Worktree = (Get-Location).Path,
  [int]$TimeoutSec = 60
)

$logFile = Join-Path $env:TEMP "opencode\dev-server-$([System.IO.Path]::GetFileName($Worktree)).log"
$errFile = Join-Path $env:TEMP "opencode\dev-server-$([System.IO.Path]::GetFileName($Worktree))-err.log"

# Log-Verzeichnis sicherstellen
$logDir = Split-Path $logFile -Parent
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

# Alte Logs entfernen, damit wir nur frischen Output lesen
Remove-Item $logFile, $errFile -Force -ErrorAction SilentlyContinue

# Dev-Server detached starten: cmd /c leitet den Output selbst um,
# der Parent haelt keine Handles -> Start-Process kehrt sofort zurueck.
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run dev > `"$logFile`" 2> `"$errFile`"" -WorkingDirectory $Worktree -WindowStyle Hidden

# Auf die reale URL im Log warten (polling, nicht raten)
$url = $null
$deadline = (Get-Date).AddSeconds($TimeoutSec)
while ((Get-Date) -lt $deadline) {
  if (Test-Path $logFile) {
    $content = Get-Content $logFile -Raw -ErrorAction SilentlyContinue
    if ($content -match 'http://localhost:\d+') {
      $url = $matches[0]
      break
    }
  }
  Start-Sleep -Milliseconds 500
}

if ($url) {
  # Base /ep_website/ anhaengen (GitHub Pages, astro.config.mjs base: '/ep_website/')
  $fullUrl = "$url/ep_website/"
  Write-Output "Dev-Server: $fullUrl"
  Write-Output "Log: $logFile"
} else {
  Write-Output "ERROR: Dev-Server-URL nicht im Log gefunden (Timeout $TimeoutSec s)."
  if (Test-Path $errFile) { Get-Content $errFile -ErrorAction SilentlyContinue }
  exit 1
}

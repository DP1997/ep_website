' Whisper-Dictation Autostart - startet das Diktat-Skript versteckt beim Login.
' Entfernen: Datei aus dem Startup-Ordner loeschen.
Set shell = CreateObject("WScript.Shell")
shell.Run """C:\Users\donal\miniconda3\envs\whisper\python.exe"" ""C:\Users\donal\whisper_dictate.py""", 0, False

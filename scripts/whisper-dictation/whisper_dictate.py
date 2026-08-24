# Lokales Whisper-Diktat für Windows.
# Nutzt die bestehende openai-whisper-Umgebung (large-v3-turbo, CUDA).
# Aufnahme starten/stoppen per Hotkey Win+Alt+Space oder Tray-Icon-Klick.
# Gesprochener Text (Deutsch) wird in die aktive Anwendung (z. B. OpenCode) eingefügt.
# 100 % lokal - kein Audio verlässt den Rechner.
#
# Strikte Textfeld-Erkennung:
#   - Nur echte Eingabe-Controls gelten als Textfeld (Editoren, Konsolen, Edit-Controls).
#   - Browser-Fenster zaehlen NICHT (auch ohne Eingabefeld fokussierbar).
#   - Aufnahme startet nur, wenn ein Textfeld erkannt wurde.
#   - Verliert das Textfeld waehrend Aufnahme/Transkription den Fokus, wird abgebrochen.
#
# Status-Feedback:
#   - Tray-Icon: gruen = bereit + Textfeld, grau = bereit + kein Textfeld,
#                rot = Aufnahme, gelb = Transkribiere
#   - Terminal: ausfuehrliche Zustandsausgabe
#   - Windows-Toast bei Zustandswechseln (gedrosselt)

import argparse
import threading
import time
import sys
import os
import ctypes
from ctypes import wintypes

import numpy as np
import sounddevice as sd

# --- Zustand ---
STATE_IDLE = "idle"
STATE_RECORDING = "recording"
STATE_TRANSCRIBING = "transcribing"
_state = STATE_IDLE
_state_lock = threading.Lock()

# Textfeld-Erkennung (wird periodisch aktualisiert).
_text_field_active = False
_text_lock = threading.Lock()

# Toast-Throttling.
_last_toast_time = 0.0
_toast_lock = threading.Lock()

# Modell wird global einmalig geladen (large-v3-turbo ist bereits gecacht).
_model = None
_model_lock = threading.Lock()

# --- Tray-Icon (pystray) ---
_tray_icon = None
_tray_icon_lock = threading.Lock()


def set_state(new_state: str):
    global _state
    with _state_lock:
        _state = new_state
    _update_tray_icon()
    _notify_state(new_state)


def get_state() -> str:
    with _state_lock:
        return _state


# --- Strikte Textfeld-Erkennung (Windows) ---
# Nur Klassen, die garantiert Texteingabe erlauben. Browser-Fensterklassen
# sind bewusst NICHT enthalten, da sie auch ohne Eingabefeld fokussiert sein koennen.
TEXT_INPUT_CLASSES = {
    # Windows-Standard-Edit-Controls
    "Edit", "RichEdit20W", "RichEdit20A", "RichEdit50W", "RichEdit",
    # Konsolen (cmd/conhost, Windows Terminal) - hier ist das Fenster selbst das Eingabefeld
    "ConsoleWindowClass",
    "CASCADIA_HOSTING_WINDOW_CLASS",
    "WindowsTerminal", "OpenConsole", "VtPanel",
    # Editoren
    "Scintilla", "ScintillaDirect",     # Scintilla (Notepad++, viele Editoren)
    "Notepad", "Notepad++",
    # Java/SWT/Qt/Tk-Editoren
    "SWT_Window0", "SunAwtFrame",
    "Qt5QWindowIcon", "Qt5QWindowToolSaveBits", "Qt6QWindowIcon",
    "TkTopLevel", "TkChild",
    # Visual Studio
    "VisualStudioWindow", "CodeWindow",
    # Sonstige Editoren
    "AfxWnd", "HwndWrapper",
}


def _class_of(h):
    if not h:
        return None
    buf = ctypes.create_unicode_buffer(256)
    ctypes.windll.user32.GetClassNameW(h, buf, 256)
    return buf.value


def _get_focused_info():
    """Liefert (Fokus-Control-Klasse, Vordergrund-Fensterklasse, hwndCaret)."""
    try:
        hwnd = ctypes.windll.user32.GetForegroundWindow()
        if not hwnd:
            return None, None, 0
        tid = ctypes.windll.user32.GetWindowThreadProcessId(hwnd, None)

        class GUITHREADINFO(ctypes.Structure):
            _fields_ = [
                ("cbSize", wintypes.DWORD),
                ("flags", wintypes.DWORD),
                ("hwndActive", wintypes.HWND),
                ("hwndFocus", wintypes.HWND),
                ("hwndCapture", wintypes.HWND),
                ("hwndMenuOwner", wintypes.HWND),
                ("hwndMoveSize", wintypes.HWND),
                ("hwndCaret", wintypes.HWND),
                ("rcCaret", wintypes.RECT),
            ]

        gti = GUITHREADINFO()
        gti.cbSize = ctypes.sizeof(GUITHREADINFO)
        # Bei Konsolenfenstern (cmd/conhost) schlaegt GetGUIThreadInfo fehl -
        # dann die Fensterklasse des Vordergrundfensters pruefen.
        focus_cls = None
        caret = 0
        if ctypes.windll.user32.GetGUIThreadInfo(tid, ctypes.byref(gti)):
            focus_cls = _class_of(gti.hwndFocus)
            caret = gti.hwndCaret

        return focus_cls, _class_of(hwnd), caret
    except Exception:
        return None, None, 0


def _is_text_field_active():
    """Strikte Pruefung: Fokus-Control, Konsolen-Fensterklasse ODER aktiver Caret.

    Der Caret-Check deckt Browser ab: Ein konkretes Eingabefeld (z. B. Claude-Chat)
    setzt einen Textcursor (hwndCaret). Reines Browsen ohne Eingabefeld nicht.
    """
    focus_cls, win_cls, caret = _get_focused_info()
    if focus_cls and focus_cls in TEXT_INPUT_CLASSES:
        return True
    # Konsolen: GetGUIThreadInfo liefert kein Control, aber die Fensterklasse
    # selbst ist ein Eingabefeld.
    if win_cls in ("ConsoleWindowClass", "CASCADIA_HOSTING_WINDOW_CLASS",
                   "WindowsTerminal", "OpenConsole", "VtPanel"):
        return True
    # Browser/andere: aktiver Caret bedeutet fokussiertes Eingabefeld.
    if caret:
        return True
    return False


def _text_field_monitor():
    """Periodische Pruefung + Abbruch bei Fokusverlust waehrend Aufnahme/Transkription."""
    global _text_field_active
    while True:
        detected = _is_text_field_active()
        with _text_lock:
            changed = detected != _text_field_active
            _text_field_active = detected

        s = get_state()
        if s == STATE_RECORDING and not detected:
            print(">>> Fokus verloren waehrend Aufnahme - Abbruch", flush=True)
            _show_toast("Whisper-Dictation", "Textfeld verloren - Aufnahme abgebrochen")
            if _ctrl is not None:
                _ctrl.abort_recording()
        elif s == STATE_TRANSCRIBING and not detected:
            print(">>> Fokus verloren waehrend Transkription - Abbruch", flush=True)
            if _ctrl is not None:
                _ctrl.abort_transcribing()

        if changed:
            if detected:
                focus_cls, win_cls, caret = _get_focused_info()
                print(f">>> Textfeld erkannt (focus={focus_cls}, win={win_cls}, caret={bool(caret)})", flush=True)
            else:
                print(">>> Kein Textfeld aktiv", flush=True)
            _update_tray_icon()
        time.sleep(1.0)


# --- Tray-Icon ---
def _make_icon(color):
    from PIL import Image, ImageDraw
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse((4, 4, 60, 60), fill=color)
    return img


def _tray_color():
    s = get_state()
    if s == STATE_RECORDING:
        return (220, 30, 30, 255)      # rot
    if s == STATE_TRANSCRIBING:
        return (240, 180, 0, 255)      # gelb
    if _text_field_active:
        return (0, 200, 0, 255)       # gruen: bereit + Textfeld
    return (120, 120, 120, 255)       # grau: bereit, aber kein Textfeld


def _update_tray_icon():
    with _tray_icon_lock:
        if _tray_icon is None:
            return
        _tray_icon.icon = _make_icon(_tray_color())


def _show_toast(title: str, msg: str):
    # Gedrosselt: min. 2s Abstand zwischen Toasts, um Prozess-Churn zu vermeiden.
    global _last_toast_time
    now = time.time()
    with _toast_lock:
        if now - _last_toast_time < 2.0:
            return
        _last_toast_time = now
    try:
        import subprocess
        ps = (
            "[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null;"
            "$n = New-Object System.Windows.Forms.NotifyIcon;"
            "$n.Icon = [System.Drawing.SystemIcons]::Information;"
            f"$n.BalloonTipTitle = '{title}';"
            f"$n.BalloonTipText = '{msg}';"
            "$n.Visible = $true;"
            "$n.ShowBalloonTip(1500);"
            "Start-Sleep -Milliseconds 2000;"
            "$n.Dispose()"
        )
        subprocess.Popen(["powershell", "-NoProfile", "-Command", ps],
                         creationflags=subprocess.CREATE_NO_WINDOW)
    except Exception:
        pass


def _notify_state(new_state: str):
    texts = {
        STATE_IDLE: ("Whisper-Dictation", "Bereit - Hotkey oder Icon zum Aufnehmen"),
        STATE_RECORDING: ("Whisper-Dictation", "Aufnahme laeuft ..."),
        STATE_TRANSCRIBING: ("Whisper-Dictation", "Transkribiere ..."),
    }
    title, msg = texts.get(new_state, ("Whisper-Dictation", new_state))
    _show_toast(title, msg)


def _tray_on_click(icon, item):
    print(">>> Tray-Klick empfangen", flush=True)
    if item is None:
        _toggle()


def _tray_menu():
    import pystray
    return pystray.Menu(
        pystray.MenuItem("Aufnahme starten/stoppen", _tray_on_click, default=True),
        pystray.MenuItem("Beenden", lambda icon, item: _quit()),
    )


def _start_tray():
    global _tray_icon
    import pystray
    with _tray_icon_lock:
        _tray_icon = pystray.Icon(
            "whisper_dictation",
            _make_icon(_tray_color()),
            "Whisper-Dictation",
            _tray_menu(),
        )
        t = threading.Thread(target=_tray_icon.run, daemon=True)
        t.start()
        print(">>> Tray-Icon gestartet", flush=True)


def _quit():
    # Sauber beenden: laufenden Audio-Stream schliessen, dann Tray stoppen.
    global _tray_icon
    if _ctrl is not None and _ctrl.recording:
        try:
            _ctrl.stream.stop()
            _ctrl.stream.close()
        except Exception:
            pass
        _ctrl.recording = False
        _ctrl.stream = None
        _restore_audio()
    with _tray_icon_lock:
        if _tray_icon is not None:
            _tray_icon.stop()
            _tray_icon = None
    os._exit(0)


# --- Audio-Ducking: Musik leiser, damit man sich selbst hoert ---
# Beim Aufnahmestart werden alle Wiedergabe-Sessions (Musik, Browser, etc.)
# auf DUCK_LEVEL gesenkt. Beim Stopp/Abbruch werden die Originalwerte wiederhergestellt.
DUCK_LEVEL = 0.14
_ducked_sessions = []
_duck_lock = threading.Lock()


def _get_playback_sessions():
    """Liefert alle Sessions mit hoerbarem Wiedergabe-Volumen."""
    from pycaw.pycaw import AudioUtilities
    sessions = []
    for s in AudioUtilities.GetAllSessions():
        if s.Process and s.Process.name():
            v = s.SimpleAudioVolume.GetMasterVolume()
            if v > 0.01:  # nur aktive Wiedergabe ducken
                sessions.append(s)
    return sessions


def _duck_audio():
    """Alle Wiedergabe-Sessions leiser stellen, Originalwerte merken."""
    global _ducked_sessions
    with _duck_lock:
        if _ducked_sessions:
            return  # bereits geduckt
        try:
            sessions = _get_playback_sessions()
            for s in sessions:
                v = s.SimpleAudioVolume.GetMasterVolume()
                _ducked_sessions.append((s, v))
                s.SimpleAudioVolume.SetMasterVolume(DUCK_LEVEL, None)
            if _ducked_sessions:
                print(f">>> Musik geduckt auf {int(DUCK_LEVEL*100)}% "
                      f"({len(_ducked_sessions)} Session(s))", flush=True)
        except Exception as e:
            print(">>> Duck error:", e, flush=True)
            _ducked_sessions = []


def _restore_audio():
    """Original-Lautstaerke aller Sessions wiederherstellen."""
    global _ducked_sessions
    with _duck_lock:
        for s, orig in _ducked_sessions:
            try:
                s.SimpleAudioVolume.SetMasterVolume(orig, None)
            except Exception:
                pass
        if _ducked_sessions:
            print(">>> Musik-Volumen wiederhergestellt", flush=True)
        _ducked_sessions = []


# --- Diktat-Logik ---
def get_model(model_name: str):
    global _model
    with _model_lock:
        if _model is None:
            from whisper import load_model
            print("Loading model ...", flush=True)
            _model = load_model(model_name)
            print("Model loaded.", flush=True)
        return _model


class DictationController:
    def __init__(self, model_name: str, language: str, sample_rate: int):
        self.model_name = model_name
        self.language = language
        self.sample_rate = sample_rate
        self.recording = False
        self._transcribing = False
        self._abort_transcribe = False
        self.audio_chunks = []
        self._audio_lock = threading.Lock()
        self.stream = None

    def _on_audio(self, indata, frames, time_info, status):
        # Callback laeuft im Audio-Thread - Liste per Lock schuetzen.
        with self._audio_lock:
            self.audio_chunks.append(indata.copy())

    def start_recording(self):
        if self.recording:
            return
        # Strikte Pruefung: nur mit erkanntem Textfeld aufnehmen.
        if not _text_field_active:
            print(">>> Kein Textfeld aktiv - Aufnahme verweigert", flush=True)
            _show_toast("Whisper-Dictation", "Kein Textfeld aktiv - Aufnahme nicht gestartet")
            return
        self.recording = True
        self._abort_transcribe = False
        with self._audio_lock:
            self.audio_chunks = []
        set_state(STATE_RECORDING)
        _duck_audio()
        print(">>> Recording ...", flush=True)
        try:
            self.stream = sd.InputStream(
                samplerate=self.sample_rate, channels=1, dtype="float32",
                callback=self._on_audio,
            )
            self.stream.start()
            print(">>> Stream gestartet", flush=True)
        except Exception as e:
            # Mikro belegt/fehlerhaft: Zustand zuruecksetzen, nicht haengen bleiben.
            print(">>> Stream start error:", e, flush=True)
            self.recording = False
            self.stream = None
            set_state(STATE_IDLE)

    def abort_recording(self):
        """Abbruch durch Fokusverlust: Stream stoppen, NICHT transkribieren."""
        if not self.recording:
            return
        self.recording = False
        _restore_audio()
        try:
            self.stream.stop()
            self.stream.close()
        except Exception:
            pass
        self.stream = None
        with self._audio_lock:
            self.audio_chunks = []
        set_state(STATE_IDLE)

    def abort_transcribing(self):
        """Abbruch durch Fokusverlust waehrend Transkription: nicht einfuegen."""
        self._abort_transcribe = True

    def stop_recording(self):
        if not self.recording:
            return
        self.recording = False
        self._transcribing = True
        self._abort_transcribe = False
        _restore_audio()
        try:
            self.stream.stop()
            self.stream.close()
        except Exception as e:
            print(">>> Stream stop error:", e, flush=True)
        self.stream = None
        set_state(STATE_TRANSCRIBING)
        print(">>> Transcribing ...", flush=True)
        with self._audio_lock:
            chunks = self.audio_chunks
            self.audio_chunks = []
        if not chunks:
            print(">>> No audio captured", flush=True)
            self._transcribing = False
            set_state(STATE_IDLE)
            return
        audio = np.concatenate(chunks, axis=0).flatten()
        audio_secs = len(audio) / self.sample_rate
        print(f">>> Audio: {audio_secs:.1f}s", flush=True)
        t_start = time.time()
        try:
            model = get_model(self.model_name)
            result = model.transcribe(audio, language=self.language, fp16=True)
            text = result.get("text", "").strip()
        except Exception as e:
            print("Transcription error:", e, flush=True)
            self._transcribing = False
            set_state(STATE_IDLE)
            return
        t_elapsed = time.time() - t_start
        print(f">>> Transkription: {t_elapsed:.2f}s fuer {audio_secs:.1f}s Audio "
              f"({audio_secs/t_elapsed:.1f}x Echtzeit)", flush=True)
        # Fokus waehrend Transkription verloren? Dann nicht einfuegen.
        if self._abort_transcribe:
            print(">>> Fokus verloren - Text nicht eingefuegt", flush=True)
            self._transcribing = False
            set_state(STATE_IDLE)
            return
        if text:
            ok = self._insert_text(text)
            if ok:
                print(">>> Inserted:", text, flush=True)
            else:
                print(">>> Insert FAILED:", text, flush=True)
        else:
            print(">>> Nothing recognized", flush=True)
        self._transcribing = False
        set_state(STATE_IDLE)

    @staticmethod
    def _insert_text(text: str):
        try:
            import keyboard as kb
            kb.write(text, delay=0.001)
            return True
        except Exception as e:
            print(">>> Insert error:", e, flush=True)
            return False

    def toggle(self):
        # Waehrend Transkription nicht toggeln (model.transcribe ist nicht thread-sicher).
        if self._transcribing:
            print(">>> Busy transcribing, ignoring toggle", flush=True)
            return
        print(">>> Toggle aufgerufen", flush=True)
        if self.recording:
            self.stop_recording()
        else:
            self.start_recording()


_ctrl = None


def _toggle():
    if _ctrl is not None:
        _ctrl.toggle()


def main():
    global _ctrl
    parser = argparse.ArgumentParser(description="Lokales Whisper-Diktat (Deutsch) fuer Windows")
    parser.add_argument("-m", "--model", default="large-v3-turbo")
    parser.add_argument("-l", "--language", default="de")
    parser.add_argument("-r", "--sample-rate", type=int, default=16000)
    parser.add_argument("-k", "--key", default="<cmd>+<shift>+<space>")
    args = parser.parse_args()

    _ctrl = DictationController(args.model, args.language, args.sample_rate)

    # Hotkey via pynput (cmd = Win-Taste auf Windows).
    from pynput import keyboard as pynput_kb
    hotkeys = pynput_kb.GlobalHotKeys({args.key: _ctrl.toggle})
    hotkeys.start()
    print(f">>> Hotkey registriert: {args.key}", flush=True)

    _start_tray()

    # Textfeld-Erkennung im Hintergrund.
    threading.Thread(target=_text_field_monitor, daemon=True).start()

    print(f"Whisper-Dictation ready. Press {args.key} or click tray icon to start/stop.", flush=True)
    print("Status: gruen=bereit+Textfeld, grau=bereit+kein Textfeld, rot=Aufnahme, gelb=Transkribiere", flush=True)
    print("Strikt: Aufnahme nur mit Textfeld, Abbruch bei Fokusverlust", flush=True)
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        hotkeys.stop()


if __name__ == "__main__":
    main()

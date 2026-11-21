// Buendigkeits-Solver fuer die Copy-Zeile (Contract A2 + F1/F3).
//
// Ziel: Meta-Feld und Inhaltstextfeld stehen in ihren Spalten buendig an den
// Bildern darunter und haben die gleiche vertikale Glyphenausdehnung.
//
// 1. Das Meta-Feld fuellt die Zeilenhoehe, indem die Resthoehe nach F1 in die
//    Abstaende verteilt wird (Titel/Beschreibung, Beschreibung/Labels,
//    Labels untereinander) - nicht durch einen grossen Leerraum.
// 2. Das Textfeld fuellt die Zeile ueber die Abstaende zwischen seinen
//    Absaetzen (F1); bei nur einem Absatz hilft ein Leading-Ausgleich (F3).
// 3. Gemessen wird am gerenderten DOM (Range.getClientRects), nicht geschaetzt.

const SLACK_VARS = ['--slack-title', '--slack-desc', '--slack-label', '--shift-bottom'];

function glyphBox(el) {
  if (!el) return null;
  const range = document.createRange();
  range.selectNodeContents(el);
  const rects = [...range.getClientRects()].filter((r) => r.height > 0 && r.width > 0);
  if (!rects.length) return null;
  return {
    top: Math.min(...rects.map((r) => r.top)),
    bottom: Math.max(...rects.map((r) => r.bottom))
  };
}

function resetSlack(el) {
  SLACK_VARS.forEach((v) => el.style.setProperty(v, '0px'));
}

function solveCopy() {
  document.querySelectorAll('.wc-copy--split, .wc-copy--wide').forEach((copy) => {
    const meta = copy.querySelector('.wc-meta');
    const body = copy.querySelector('.wc-body');
    if (!meta || !body) return;

    const desc = meta.querySelector('.wc-desc');
    const labels = meta.querySelector('.wc-labels');
    const labelItems = labels ? [...labels.children] : [];
    const bodyParas = [...body.children].filter((el) => el.tagName === 'P');

    // Reset: Messung nicht vom letzten Lauf abhaengig machen.
    body.style.setProperty('--lh', '1');
    resetSlack(meta);

    // In gestapelten Copys (eine Spalte) gibt es nichts auszugleichen: Meta
    // und Text stehen untereinander, jede Zeile nimmt ihre eigene Hoehe.
    const stacked = getComputedStyle(copy).gridTemplateColumns.split(' ').length < 2;
    if (stacked) return;

    const rowH = copy.getBoundingClientRect().height;

    // Zielgroesse: das laengere Feld setzt die Zeilenhoehe, das kuerzere
    // wird auf diese Hoehe gestreckt.
    const metaBox = glyphBox(meta);
    const bodyBox = glyphBox(body);
    if (!metaBox || !bodyBox) return;
    const metaH = metaBox.bottom - metaBox.top;
    const bodyH = bodyBox.bottom - bodyBox.top;

    if (metaH >= bodyH) {
      // Meta ist laenger: es bestimmt die Zeilenhoehe, das Textfeld waechst
      // per Leading-Ausgleich (F3) auf dieselbe Hoehe.
      const targetH = metaH;
      for (let i = 0; i < 4; i += 1) {
        body.style.setProperty('--lh', '1');
        const base = glyphBox(body);
        if (!base) return;
        const baseH = base.bottom - base.top;
        if (baseH <= 0) return;
        const factor = 1 + (targetH - baseH) / baseH;
        const clamped = Math.min(1.6, Math.max(1, factor));
        body.style.setProperty('--lh', clamped.toFixed(3));
        const now = glyphBox(body);
        if (!now) return;
        if (Math.abs((now.bottom - now.top) - targetH) <= 3) break;
      }
    } else if (desc && labels) {
      // Text ist laenger: das Meta-Feld wird per F1 in die Zeilenhoehe
      // gestreckt (Abstaende Titel/Beschreibung/Labels), damit seine
      // Unterkante an der des Textfelds endet.
      for (let i = 0; i < 3; i += 1) {
        resetSlack(meta);
        const box = glyphBox(meta);
        if (!box) break;
        const need = bodyH - (box.bottom - box.top);
        if (need <= 2) break;
        // 1/4 Titel->Beschreibung, 1/4 Beschreibung->Labels, 1/2 auf die
        // Labelabstaende (Anzahl der Luecken = Labels - 1).
        meta.style.setProperty('--slack-title', `${(need / 4).toFixed(1)}px`);
        meta.style.setProperty('--slack-desc', `${(need / 4).toFixed(1)}px`);
        const gaps = Math.max(1, labelItems.length - 1);
        meta.style.setProperty('--slack-label', `${(need / 2 / gaps).toFixed(1)}px`);
      }
    }

    // 3. Unterkanten buendig: der Meta-Block wird so verschoben, dass seine
    //    letzte Glyphenzeile auf der des Textfelds endet. Der Titel (Serif)
    //    und der Text (Sans) haben unterschiedliche Half-Leading-Raender
    //    (A4) - die Oberkanten duerfen deshalb um wenige Pixel abweichen,
    //    die Unterkanten nicht.
    const mBox = glyphBox(meta);
    const bBox = glyphBox(body);
    if (!mBox || !bBox) return;
    const delta = bBox.bottom - mBox.bottom;
    if (Math.abs(delta) > 1) {
      meta.style.setProperty('--shift-bottom', `${delta.toFixed(1)}px`);
    } else {
      meta.style.setProperty('--shift-bottom', '0px');
    }
  });
}

const scheduleSolve = () => requestAnimationFrame(solveCopy);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scheduleSolve);
} else {
  scheduleSolve();
}
window.addEventListener('load', scheduleSolve);
window.addEventListener('resize', scheduleSolve);
if (document.fonts?.ready) document.fonts.ready.then(scheduleSolve);

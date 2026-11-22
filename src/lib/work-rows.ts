// Zeilenaufteilung und Blattbreiten-Constraint fuer die Werkseiten.
// EINE Quelle fuer WorkVariant (Rendering) und WorkLayout (hero_fit):
// beide muessen dieselben Bildzeilen sehen, sonst passt die berechnete
// Blattbreite nicht zum gerenderten Raster.

export interface GalleryEntry {
  img: { width: number; height: number };
  index: number;
}

export const aspect = (img: { width: number; height: number }) => img.width / img.height;

// Bilder in Zeilen: bis vier Bilder eine Zeile, ab fuenf gleich viele Bilder
// je Zeile; bei Rest 1 rueckt das letzte Bild in die Textzeile.
export function groupRows<T extends GalleryEntry>(
  ordered: T[],
  perRow: number
): { rows: T[][]; asideImg: T | null } {
  const rows: T[][] = [];
  let asideImg: T | null = null;

  if (ordered.length <= 4) {
    if (ordered.length) rows.push(ordered);
  } else {
    const rest = ordered.length % perRow;
    const keep = rest === 1 ? ordered.length - 1 : ordered.length;
    if (rest === 1) asideImg = ordered[ordered.length - 1];
    const usable = ordered.slice(0, keep);
    const rowSize = usable.length / Math.floor(usable.length / perRow);
    const rowCount = Math.round(usable.length / rowSize);
    for (let r = 0; r < rowCount; r += 1) {
      rows.push(usable.slice(r * rowSize, (r + 1) * rowSize));
    }
  }

  return { rows, asideImg };
}

// Kleinster Faktor F, sodass Blattbreite W <= viewportHoehe * F jedes Bild
// vollstaendig in den Viewport bringt.
//
// - Hero: volle Blattbreite -> Hoehe W / heroAR.
// - Bildzeile (Strip-Solver): alle Bilder sind hoehengleich; Zeilenhoehe ist
//   W / Summe der Aspekte der Zeile.
// - copy_image: das Bild ruckt in die Textzeile, seine Hoehe ist deklariert
//   als copy_image_h * W.
// - Restbild in der Textzeile: Hoehe = W / Summe der ersten Bildzeile,
//   also bereits durch diese Zeile abgedeckt.
export function fitFactor(opts: {
  heroAR: number;
  rows: { img: { width: number; height: number } }[][];
  copyImageH?: number | null;
  hasCopyImage?: boolean;
}): number {
  const factors = [opts.heroAR];

  if (opts.hasCopyImage && opts.copyImageH) {
    factors.push(1 / opts.copyImageH);
  }

  for (const row of opts.rows) {
    factors.push(row.reduce((sum, g) => sum + aspect(g.img), 0));
  }

  const positive = factors.filter((f) => Number.isFinite(f) && f > 0);
  return positive.length ? Math.min(...positive) : 1;
}

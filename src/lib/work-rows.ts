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

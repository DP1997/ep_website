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

// Hero-Seiten-Layout (Width first): hero links, Copy rechts, hochformatige
// Detailbilder als weitere Spalten. Die Spaltenbreiten werden fuer eine
// gemeinsame Oberkante h geloest; Copy erhaelt den festen Anteil copyFrac.
// Damit ist h = W * factor (W = Blattbreite), also W <= viewportH * 1/factor.
export function heroSidePlan<T extends GalleryEntry>(
  heroAR: number,
  gallery: T[],
  copyFrac: number,
  gapFrac: number
): {
  portraits: T[];
  landscapes: T[];
  factor: number;
  columns: number;
} {
  const portraits = gallery.filter((g) => aspect(g.img) < 1);
  const landscapes = gallery.filter((g) => aspect(g.img) >= 1);
  const images = 1 + portraits.length;
  const arSum =
    heroAR + portraits.reduce((sum, g) => sum + aspect(g.img), 0);
  const factor = (1 - copyFrac - images * gapFrac) / arSum;
  return { portraits, landscapes, factor, columns: images };
}

// Villa-Dim: Hero links, zwei gleich breite Spalten rechts. Die drei
// Detailbilder (eines davon in der Textspalte) sind die drei Zeilen; ihre
// Hoehensumme + Gaps = Hero-Hoehe. Loest die Spaltenanteile exakt.
export function villaDimFractions(
  heroAR: number,
  sumInv: number,
  gapFrac: number
): { heroFrac: number; sideFrac: number } {
  const inv = 1 / heroAR;
  const heroFrac =
    (1 - 2 * gapFrac + (4 * gapFrac) / sumInv) / (1 + (2 * inv) / sumInv);
  const sideFrac = (heroFrac * inv - 2 * gapFrac) / sumInv;
  return { heroFrac, sideFrac };
}



// Einheitliche Werksortierung (absteigend, "neueste zuerst").
// Ein explizites `sortOrder` (Frontmatter, optional) dient als Primaerschluessel:
// Werte werden als effektives Jahr interpretiert und steuern die Sortierposition,
// ohne das sichtbare `date`-Feld zu veraendern. Ohne `sortOrder` greift der
// Fallback auf das Jahr aus `date`. Warum: einzelne Werke koennen eine gewollte
// Anzeige-Reihenfolge erhalten (z. B. "Bubble" vor "Grosse Kosmonautin"),
// waehrend das Datum fachlich korrekt bleibt.

interface HasData {
  data: {
    sortOrder?: number;
    date: string;
  };
}

// Numerisches Jahr aus uneinheitlichem Datumsstring extrahieren
// (z. B. "1998", "2021-2022", "2007/2009", "1994/95", "t.b.d." -> 0).
export function yearNum(date: string): number {
  const m = date.match(/(\d{4})/);
  return m ? parseInt(m[1], 10) : 0;
}

// Effektive Sortierposition: sortOrder als Primaerschluessel, sonst date-Jahr.
function effectiveYear(w: HasData): number {
  return w.data.sortOrder ?? yearNum(w.data.date);
}

// Absteigend sortieren: hoeheres effektives Jahr steht weiter vorne.
export function compareWorks(a: HasData, b: HasData): number {
  return effectiveYear(b) - effectiveYear(a);
}

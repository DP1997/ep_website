import { readFileSync, writeFileSync } from 'fs';

const dir = 'src/pages/projektstudien/';

// Artist-Zeile durch einen Client-Eintrag ersetzen.
const edits = {
  'stadttor.astro': {
    from: '          <p class="ps-stadttor-artist">STEFAN KINDEL</p>\n',
    to: '',
    client: {
      name: 'Auftraggeber',
      value: 'Staatsbauamt Mainz<br />In Zusammenarbeit mit Stefan Kindel',
      insertAfter: '            <span class="ps-label__value">Staatsbauamt Mainz</span>\n',
    },
  },
  'entwicklung.astro': {
    from: '          <p class="ps-entwicklung-artist">STEFAN KINDEL</p>\n',
    to: '',
    client: {
      name: 'Auftraggeber',
      value: 'In Zusammenarbeit mit Stefan Kindel',
      insertAfter: null,
    },
  },
};

for (const [file, e] of Object.entries(edits)) {
  const p = dir + file;
  let c = readFileSync(p, 'utf8');

  if (e.from && c.includes(e.from)) {
    c = c.replace(e.from, e.to);
  } else {
    console.log('Artist-Zeile nicht gefunden: ' + file);
  }

  // Client-Block in die Labels einfuegen.
  if (e.client.insertAfter) {
    if (!c.includes(e.client.insertAfter)) {
      console.log('Einfuegepunkt nicht gefunden: ' + file);
    } else {
      c = c.replace(
        e.client.insertAfter,
        e.client.insertAfter +
          '          </div>\n' +
          '          <div class="ps-label">\n' +
          '            <span class="ps-label__key">' + e.client.name + '</span>\n' +
          '            <span class="ps-label__value">' + e.client.value + '</span>\n'
      );
      // die urspruengliche schliessende Klammer des ersten Labels entfernen
      c = c.replace(
        e.client.insertAfter.replace(/\n$/, '') + '          </div>\n' + '          <div class="ps-label">',
        e.client.insertAfter.replace(/\n$/, '')
      );
    }
  } else {
    // Client-Block ans Ende der Labels anhaengen
    const labelsEnd = /(<div class="ps-labels">[\s\S]*?)(\n\s*<\/div>)/;
    const m = c.match(labelsEnd);
    if (m) {
      const block =
        '          <div class="ps-label">\n' +
        '            <span class="ps-label__key">' + e.client.name + '</span>\n' +
        '            <span class="ps-label__value">' + e.client.value + '</span>\n' +
        '          </div>\n';
      c = c.replace(labelsEnd, (full, inner, rest) => inner + '\n' + block.replace(/\n$/, '') + rest);
    } else {
      console.log('Labels-Block nicht gefunden: ' + file);
    }
  }

  writeFileSync(p, c);
  console.log('ok: ' + file);
}

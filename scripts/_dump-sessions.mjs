import { DatabaseSync } from 'node:sqlite';
const db = new DatabaseSync('C:/Users/donal/.local/share/opencode/opencode.db');
const c1 = db.prepare("select count(*) c from part").get();
const c2 = db.prepare("select count(*) c from session").get();
console.log('parts', JSON.stringify(c1), 'sessions', JSON.stringify(c2));
const rows = db.prepare(`select p.session_id, s.title, p.time_created, substr(p.data,1,120) d
  from part p join session s on s.id=p.session_id
  where lower(p.data) like '%sportler%' order by p.time_created desc limit 10`).all();
for (const r of rows) console.log(new Date(r.time_created).toISOString(), r.session_id, r.title, '|', r.d);

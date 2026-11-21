// Turns OCR text from a prescription into { hospital, doctor, date, follow_up, medicines[] }.
// Works best on printed or clearly typed prescriptions. Dates are read day-first (17/11/2026).
const MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const iso = (y, m, d) => { if (y < 100) y += 2000; const t = new Date(Date.UTC(y, m - 1, d)); return (m < 1 || m > 12 || d < 1 || t.getUTCMonth() !== m - 1) ? null : t.toISOString().slice(0, 10); };
const mon = s => MON[s.slice(0, 3).toLowerCase()];
const DATE_RES = [
  [/\b(\d{4})[-\/.|](\d{1,2})[-\/.|](\d{1,2})\b/g, m => iso(+m[1], +m[2], +m[3])],
  [/\b(\d{1,2})[-\/.|](\d{1,2})[-\/.|](\d{2,4})\b/g, m => iso(+m[3], +m[2], +m[1])],
  [/\b(\d{1,2})(?:st|nd|rd|th)?[\s-]+([A-Za-z]{3,9})\.?,?[\s-]+(\d{2,4})\b/g, m => mon(m[2]) ? iso(+m[3], mon(m[2]), +m[1]) : null],
  [/\b([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/g, m => mon(m[1]) ? iso(+m[3], mon(m[1]), +m[2]) : null]
];
const datesIn = line => { const out = []; for (const [re, f] of DATE_RES) { re.lastIndex = 0; let m; while ((m = re.exec(line))) { const d = f(m); if (d) out.push(d); } } return out; };
const NUM = { a: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
function relative(line, base) {
  const U = '(day|week|wk|month|mth|mo)s?', N = '(\\d+|a|one|two|three|four|five|six)';
  const m = line.match(new RegExp('(?:after|in|within|next|post)\\s+' + N + '\\s*' + U, 'i'))
    || line.match(new RegExp('(?:r\\/a|review|f\\/u|follow[\\s-]?up)\\W{0,3}(?:after\\s*)?' + N + '\\s*' + U, 'i'))
    || line.match(new RegExp('(\\d+)\\s*' + U + '\\s*(?:later|follow)', 'i'));
  if (!m || !base) return null;
  const n = isNaN(m[1]) ? NUM[m[1].toLowerCase()] : +m[1], d = new Date(base + 'T00:00:00Z'), u = m[2].toLowerCase()[0];
  if (u === 'm') d.setUTCMonth(d.getUTCMonth() + n); else d.setUTCDate(d.getUTCDate() + n * (u === 'w' ? 7 : 1));
  return d.toISOString().slice(0, 10);
}
const FU = /follow[\s-]?up|r\/a\b|review|revisit|next\s+(?:visit|appointment|consult)|come\s+(?:back|again)|see\s+(?:me|doctor)|f\/u|\bfu\b/i;
const HOSP = /hospital|clinic|medical|health|nursing|polyclinic|diagnostic|institute|dispensary|surgery|centre|center/i;
const STOP = /^(mbbs|md|ms|dnb|dm|mch|frcs|mrcp|consultant|reg|regd|phone|ph|mob|tel|specialist|physician|surgeon|registration|no)$/i;
const FORM = /^(?:\d+\s*[.)]\s*|[-•*]\s*)?(?:(tab(?:let)?s?|cap(?:sule)?s?|syp|syr|syrup|susp(?:ension)?|inj(?:ection)?|oint(?:ment)?|cream|drops?|gel|lotion|inhaler|sachet|spray)\b\.?\s*)?/i;
const DOSE = /(\d+(?:\.\d+)?)\s*(mg|mcg|µg|g|ml|iu|%)(?![a-z])/i;
const PATTERN = /\b\d(?:\.\d)?\s*[-–—]\s*\d(?:\.\d)?\s*[-–—]\s*\d(?:\.\d)?(?:\s*[-–—]\s*\d)?\b/;
const ABBR = /\b(od|bd|bid|tds|tid|qds|qid|hs|sos|prn|once\s+(?:a\s+)?daily|twice\s+(?:a\s+)?daily|thrice\s+(?:a\s+)?daily|(?:one|two|three)\s+times\s+(?:a\s+)?day|daily|at\s+night|bedtime|in\s+the\s+morning|morning|evening)\b/gi;
const FOOD = /\b(after|before|with)\s+(?:food|meals?|breakfast|lunch|dinner)\b/gi;
const DUR = /(?:for|x)?\s*(\d+)\s*(day|week|month)s?\b/i;
const IGNORE = /\b(patient|age|sex|gender|phone|reg\.?\s*no|address|date|bp|weight|wt|temp|pulse|diagnosis|follow|review|signature|mbbs)\b/i;
const clean = s => s.replace(/[^\p{L}\p{N}&.,'()\- ]/gu, ' ').replace(/\s+/g, ' ').trim();
const cleanName = s => clean(s).replace(/^[A-Za-z]{1,3}[)\].:,]\s+/, '').replace(/^[^A-Za-z0-9]+/, '');

export function parsePrescription(text) {
  const lines = (text || '').split(/\r?\n/).map(l => l.trim().replace(/^T[.\-:'`]\s*(?=[A-Za-z])|^T\s+(?=[A-Z]{3})/, 'Tab. ')).filter(l => l.length > 1);
  const out = { hospital: '', doctor: '', date: '', follow_up: '', medicines: [] };
  out.hospital = cleanName(lines.slice(0, 10).find(l => HOSP.test(l) && !/\bdr\b/i.test(l) && /[A-Za-z]{4}/.test(l)) || '');
  for (const l of lines) {
    if (/patient|pt\.?\s*name/i.test(l)) continue;
    const m = l.match(/\b(?:dr|doctor)\b[.:]?\s*([A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*){0,3})/i);
    if (!m) continue;
    const words = []; for (const w of m[1].split(/\s+/)) { if (STOP.test(w.replace(/\./g, ''))) break; words.push(w); }
    if (words.length) { out.doctor = 'Dr. ' + words.join(' ').replace(/\.$/, ''); break; }
  }
  if (!out.doctor) for (const l of lines) { const m = l.match(/(?:doctor|consultant|physician)(?:'s)?\s*(?:name)?\s*[:\-]\s*([A-Za-z][A-Za-z.' ]{2,40})/i); if (m) { out.doctor = 'Dr. ' + clean(m[1]).replace(/^dr\.?\s*/i, ''); break; } }
  const fuIdx = new Set(); lines.forEach((l, i) => { if (FU.test(l)) fuIdx.add(i); });
  const dl = lines.findIndex((l, i) => !fuIdx.has(i) && /\bdate\b|dated/i.test(l) && datesIn(l).length);
  out.date = dl >= 0 ? datesIn(lines[dl])[0] : (lines.map((l, i) => fuIdx.has(i) ? [] : datesIn(l)).flat()[0] || '');
  for (const i of fuIdx) {
    const abs = [...datesIn(lines[i]), ...(datesIn(lines[i + 1] || '') )].filter(d => !out.date || d >= out.date)[0];
    const f = abs || relative(lines[i], out.date) || relative(lines[i + 1] || '', out.date);
    if (f) { out.follow_up = f; break; }
  }
  const seen = new Set();
  for (let li = 0; li < lines.length; li++) {
    const raw = lines[li];
    const fm = raw.match(FORM), hasForm = !!fm[1], numbered = /^\d+\s*[.)]/.test(raw), dose0 = raw.match(DOSE);
    const formAnywhere = /\b(tab|tablet|cap|capsule|syp|syrup|inj|drops|susp)\b/i.test(raw);
    if (!(hasForm || (numbered && (dose0 || formAnywhere)))) continue;
    if (IGNORE.test(raw) && !hasForm) continue;
    const rest = raw.slice(fm[0].length), dose = rest.match(DOSE);
    const cuts = [dose?.index, rest.search(PATTERN), rest.search(/\b(od|bd|bid|tds|tid|qds|qid|hs|sos|prn|once|twice|thrice|daily)\b/i), rest.search(/\bfor\b|\bx\s*\d/i), rest.search(/\b(at\s+night|bedtime|morning|evening|after|before|with)\b/i), rest.search(/\b(tab|tablet|cap|capsule|syp|syrup|inj|drops)\b/i), rest.search(/\s\d\s*[-–—]\s*\d/), rest.indexOf('(')].filter(n => n >= 0);
    const cut = cuts.length ? Math.min(...cuts) : rest.length;
    let name = clean(rest.slice(0, cut)).replace(/^[.\- ]+/, ''), strength = '';
    const sm = !dose && name.match(/^(.*?[A-Za-z])\s+(\d+(?:[./]\d+)*)$/); if (sm) { name = sm[1]; strength = sm[2]; }
    const nxt = lines[li + 1] || '', nextIsFreq = !FORM.exec(nxt)[1] && PATTERN.test(nxt) && !/[A-Za-z]{3}/.test(nxt.replace(/\b(after|before|with|food)\b/gi, ''));
    if (name.length < 3 || seen.has(name.toLowerCase())) continue; seen.add(name.toLowerCase());
    const dur = raw.match(DUR);
    const nm = nextIsFreq && !raw.match(PATTERN) ? nxt.match(PATTERN) : null; if (nm && !strength && !dose) { const pre = nxt.slice(0, nm.index).trim(); if (/^\d+(?:[./]\d+)*$/.test(pre)) strength = pre; }
    const freq = [(raw.match(PATTERN) || nm)?.[0].replace(/\s+/g, '').replace(/[–—]/g, '-'), ...(rest.match(ABBR) || []), ...(rest.match(FOOD) || [])].filter(Boolean).join(' ');
    out.medicines.push({ name, dose: dose ? `${dose[1]} ${dose[2].toLowerCase()}` : strength, frequency: freq.trim(), duration: dur ? `${dur[1]} ${dur[2].toLowerCase()}s`.replace(/^1 (\w+)s$/, '1 $1') : '' });
  }
  return out;
}

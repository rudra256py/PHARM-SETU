// Run: npm run build:data   (data/pmbjp.csv -> lib/data/pmbjp.json). Re-run whenever you download a newer PMBI list.
import { readFileSync, writeFileSync } from "node:fs";
import { formOf } from "../lib/saltkey";

function csv(t: string): string[][] {
  const r: string[][] = []; let row: string[] = [], c = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; }
    else if (ch === '"') q = true;
    else if (ch === ",") { row.push(c); c = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && t[i + 1] === "\n") i++; row.push(c); c = ""; if (row.length > 1) r.push(row); row = []; }
    else c += ch;
  }
  if (c || row.length) { row.push(c); r.push(row); }
  return r;
}

// Surgical items / dressings in the PMBJP list are not medicines - the prescription decoder should never match them.
const DEVICE = /bandage|absorbent|cotton|gauze|crepe|adhesive|plaster|sanitary|napkin|\bmask\b|glove|^syringe|needle|catheter|condom|dressing|thermometer|\btape\b|\bkit\b|surgical/i;

const [head, ...body] = csv(readFileSync("data/pmbjp.csv", "utf8"));
const ix = (k: string) => head.indexOf(k);
const out: { c: number; n: string; f: string; k: string; j: number; s: string }[] = [];
const dropped: string[] = [];
for (const r of body) {
  const raw = r[ix("product_name")].trim();
  const m = raw.match(/\(([^()]*?),?\s*Drug Code:\s*(\d+)\)\s*$/);
  const price = Number(r[ix("product_price")].replace(/[^0-9.]/g, ""));
  if (!m || !(price > 0)) { dropped.push("BAD ROW: " + raw.slice(0, 60)); continue; }
  const name = raw.slice(0, m.index).trim();
  if (DEVICE.test(name)) { dropped.push(name); continue; }
  out.push({ c: +m[2], n: name, f: formOf(name), k: m[1].replace(/^pack of\s*/i, "").trim(), j: price, s: r[ix("salt_composition")].trim() });
}
writeFileSync("lib/data/pmbjp.json", JSON.stringify(out));
console.log(`kept ${out.length} of ${body.length}; dropped ${dropped.length}`);
console.log(dropped.join("\n"));

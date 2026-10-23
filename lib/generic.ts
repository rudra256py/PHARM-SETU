// lib/generic.ts - Jan Aushadhi (PMBJP) matcher.
// Data: lib/data/pmbjp.json, generated from data/pmbjp.csv by `npm run build:data` (official PMBI list, ~1,900 medicines).
// Matching is by normalised composition + strength + release type (see lib/saltkey.ts), never by guessing.
import rows from "./data/pmbjp.json";
import { EXTRAS } from "./generic-extras";
import { parseSalt, type Parsed } from "./saltkey";
import type { Medicine } from "./types";

export type Form = Medicine["form"];
export type GenericEntry = {
  code: number; // Jan Aushadhi drug code (tell this at the Kendra)
  name: string; // official PMBI product name
  form: Form;
  pack: string;
  ja: number; // Jan Aushadhi MRP (Rs) for this pack
  brands: string[]; // known brand names (curated, for search)
  approx: number | null; // approximate brand price for the same pack (curated estimate, NOT exact)
  care?: boolean; // narrow-safety-margin medicine: do not switch brands without the doctor
};
type Row = GenericEntry & { p: Parsed };

// Starter list for review by a pharmacist: medicines where brand switching needs the doctor's OK.
const CARE = /levothyroxine|warfarin|acenocoumarol|digoxin|phenytoin|carbamazepine|valpro|lithium|tacrolimus|cyclosporin|clozapine|methotrexate|amiodarone|theophylline|insulin|phenobarbital/;

// The PMBI CSV drops "prolonged release" from these product names; confirmed from the official product list.
const REL_CODES = new Set([372]);

export const GENERICS: Row[] = rows.map((r) => {
  const p = parseSalt(r.s);
  p.rel = p.rel || parseSalt(r.n).rel || REL_CODES.has(r.c); // "Prolonged release" is often only in the product name
  const x = EXTRAS[r.c];
  return { code: r.c, name: r.n, form: r.f as Form, pack: r.k, ja: r.j, brands: x?.brands ?? [], approx: x?.approx ?? null, care: CARE.test(p.ing.join(" ")) || undefined, p };
});

const byPairs = new Map<string, Row[]>(), byIng = new Map<string, Row[]>();
const add = (m: Map<string, Row[]>, k: string, r: Row) => m.set(k, [...(m.get(k) ?? []), r]);
for (const r of GENERICS) { add(byPairs, r.p.pairs.join("|"), r); add(byIng, r.p.ing.join("|"), r); }

const clean = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hasWord = (text: string, w: string) => new RegExp("(^|[^a-z0-9])" + esc(w) + "($|[^a-z0-9])").test(text);
const formOk = (a: Form, b?: string) => !b || a === b || a === "other" || b === "other";
const curatedFirst = (a: Row, b: Row) => Number(!!b.approx) - Number(!!a.approx);

// Prescription medicine -> the Jan Aushadhi product with the SAME composition, strength and release type (else null).
export function findGeneric(m: Pick<Medicine, "brandName" | "genericSalt"> & { form?: string; strength?: string | null }): GenericEntry | null {
  const salt = m.genericSalt || "";
  let p = parseSalt(salt);
  if (p.ing.length === 1 && p.pairs[0].endsWith(":") && m.strength) p = parseSalt(`${salt} ${m.strength}`);
  p.rel = parseSalt(`${salt} ${m.brandName}`).rel;

  const exact = p.pairs.length > 0 && p.pairs.every((x) => !x.endsWith(":")); // every ingredient has a strength
  const pool = (exact ? byPairs.get(p.pairs.join("|")) : byIng.get(p.ing.join("|"))) ?? [];
  const c = pool.filter((r) => r.p.rel === p.rel && formOk(r.form, m.form));
  if (c.length && (exact || c.length === 1)) return [...c].sort(curatedFirst)[0]; // no strength + several options = ambiguous, so do not guess

  const brand = clean(m.brandName || "");
  return GENERICS.find((r) => r.brands.some((b) => hasWord(brand, b)) && formOk(r.form, m.form)) ?? null;
}

// Search box: brand name, salt name, or any words from the official product name.
export function searchGeneric(q: string): GenericEntry[] {
  const s = clean(q);
  if (s.length < 3) return [];
  const toks = s.split(" ").filter((t) => t.length > 1);
  return GENERICS.filter((e) => {
    const h = `${e.name.toLowerCase()} ${e.brands.join(" ")}`;
    return toks.every((t) => h.includes(t)) || e.brands.some((b) => hasWord(s, b));
  }).sort((a, b) => curatedFirst(a, b) || a.name.length - b.name.length).slice(0, 6);
}

export const saving = (brand: number, ja: number) => ({
  amt: Math.max(0, brand - ja),
  pct: brand > 0 ? Math.max(0, Math.round(((brand - ja) / brand) * 100)) : 0,
});

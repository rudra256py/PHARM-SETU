// Run: npm run test:data  - prints what each prescription medicine maps to. Eyeball it; wrong = bug.
import { GENERICS, findGeneric } from "../lib/generic";
const T: [string, string, string?, string?][] = [
  ["Azithral", "Azithromycin 500mg", "tablet"], ["Pan 40", "Pantoprazole 40mg", "tablet"], ["Digene", "Aluminium hydroxide + magnesium hydroxide + simethicone", "syrup"],
  ["Crocin", "Paracetamol 500mg", "tablet"], ["Dolo 650", "Paracetamol 650mg", "tablet"], ["Combiflam", "Ibuprofen 400mg + Paracetamol 325mg", "tablet"],
  ["Zerodol-P", "Aceclofenac 100mg + Paracetamol (Acetaminophen) 325mg", "tablet"], ["Voveran", "Diclofenac Sodium 50mg", "tablet"], ["Voveran gel", "Diclofenac 1.16% w/w", "ointment"],
  ["Glycomet", "Metformin Hydrochloride 500mg", "tablet"], ["Glycomet SR", "Metformin 500mg SR", "tablet"], ["Amlokind", "Amlodipine Besylate 5mg", "tablet"],
  ["Storvas", "Atorvastatin Calcium 10mg", "tablet"], ["Thyronorm", "Levothyroxine 100mcg", "tablet"], ["Thyronorm", "Levothyroxine Sodium", "tablet", "100 mcg"],
  ["Pantocid", "Pantoprazole", "tablet"], ["Bactrim", "Co-trimoxazole (Sulphamethoxazole 400mg + Trimethoprim 80mg)", "tablet"], ["Xyz", "Madeupine 10mg", "tablet"],
  ["Ecosprin", "Aspirin 75mg", "tablet"], ["Montair LC", "Montelukast 10mg + Levocetirizine 5mg", "tablet"], ["Metrogyl", "Metronidazole 400mg", "tablet"],
];
for (const [b, s, f, st] of T) {
  const e = findGeneric({ brandName: b, genericSalt: s, form: f, strength: st });
  console.log(`${b.padEnd(12)} ${s.slice(0, 48).padEnd(48)} -> ${e ? `#${e.code} Rs${e.ja} ${e.form} ${e.pack}${e.care ? " [CARE]" : ""} | ${e.name.slice(0, 60)}` : "no match"}`);
}
const dup = new Map<string, number[]>();
for (const r of GENERICS) { const k = [r.p.pairs.join("|"), r.p.rel, r.form].join("~"); dup.set(k, [...(dup.get(k) ?? []), r.code]); }
const d = [...dup.values()].filter((v) => v.length > 1);
console.log(`\n${GENERICS.length} rows | no ingredient parsed: ${GENERICS.filter((r) => !r.p.ing.length).length} | no strength: ${GENERICS.filter((r) => r.p.pairs.some((p) => p.endsWith(":"))).length} | same key shared by several codes: ${d.length} groups`);
console.log(d.slice(0, 6).map((v) => v.join("/")).join("  "));

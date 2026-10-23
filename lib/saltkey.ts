// lib/saltkey.ts - turns messy composition text into a comparable key.
// "Paracetamol (Acetaminophen) 325mg + Aceclofenac 100mg"  ==  "ACECLOFENAC 100 MG and PARACETAMOL 325 MG"
export type Parsed = { ing: string[]; pairs: string[]; rel: boolean };

const STR = /(\d+(?:\.\d+)?)\s*(mg|mcg|µg|ug|gram|gm|g|ml|iu|%|units?)(?![a-z])/g;
const W: Record<string, number> = { mg: 1e3, mcg: 1, "µg": 1, ug: 1, g: 1e6, gm: 1e6, gram: 1e6 };
const NOISE = new Set("ip bp usp tablet tablets tab tabs capsule capsules cap caps syrup suspension injection inj solution gel cream ointment drops oral film coated enteric gastro resistant gastro-resistant sr er xr cr mr dispersible chewable prolonged release extended sustained modified controlled soft gelatin per dried activated anhydrous precipitated eq equivalent to of the in ir pack drug code".split(" "));
const TRAIL = new Set("hydrochloride hcl hydrobromide sodium potassium besylate besilate maleate mesylate medoxomil calcium dihydrate trihydrate monohydrate hydrate".split(" "));
const SYN: Record<string, string> = { acetaminophen: "paracetamol", sulphamethoxazole: "sulfamethoxazole", amoxycillin: "amoxicillin", cetrizine: "cetirizine", levocetrizine: "levocetirizine", thyroxine: "levothyroxine", "levo-thyroxine": "levothyroxine", mefanamic: "mefenamic", aluminum: "aluminium", simethicone: "dimethicone", isapgol: "ispaghula", ispaghula: "ispaghula" };

const fmt = (v: number, u: string) => (W[u] ? `${+(v * W[u]).toFixed(3)}mcg` : `${v}${u.replace(/^units?$/, "unit")}`);

// Sustained/extended release is a different dosing from plain tablets, so it must match exactly.
export const isRel = (t: string) => /\b(sr|er|xr|cr|mr|prolonged|extended|sustained|modified)\b/i.test(t);

export function formOf(name: string): "tablet" | "capsule" | "syrup" | "injection" | "ointment" | "drops" | "other" {
  const n = name.toLowerCase();
  if (/injection|infusion|\bvial\b|ampoule|\binj\b/.test(n)) return "injection";
  if (/capsule/.test(n)) return "capsule";
  if (/tablet|\btab\b|caplet/.test(n)) return "tablet";
  if (/syrup|suspension|oral solution|liquid|elixir/.test(n)) return "syrup";
  if (/cream|ointment|\bgel\b|lotion/.test(n)) return "ointment";
  if (/drops|\beye\b|\bear\b|nasal/.test(n)) return "drops";
  return "other";
}

export function parseSalt(raw: string): Parsed {
  let s = raw.toLowerCase().replace(/co-?trimoxazole/g, "sulfamethoxazole + trimethoprim");
  // Brackets: keep them only if they list real ingredients with a strength; drop notes like (Enteric Coated), (Acetaminophen)
  for (let i = 0; i < 2; i++)
    s = s.replace(/\(([^()]*)\)/g, (_, c: string) =>
      /^\s*(equivalent|eq\b|containing|as\b|each)/.test(c) || !/\d\s*(mg|mcg|µg|ug|gm|g|ml|iu|%)/.test(c) ? " " : " + " + c);
  const ing: string[] = [], pairs: string[] = [];
  for (const piece of s.split(/\s*(?:\+|,|;|&|\band\b|\bwith\b)\s*/)) {
    const st = [...piece.matchAll(STR)].map((m) => fmt(+m[1], m[2]));
    const toks = piece.replace(STR, " ").replace(/[^a-z\- ]/g, " ").split(/\s+/)
      .filter((t) => /[a-z]/.test(t) && !NOISE.has(t)).map((t) => SYN[t] ?? t);
    while (toks.length > 1 && TRAIL.has(toks[toks.length - 1])) toks.pop();
    const name = toks.join(" ");
    if (name.length < 3) continue;
    ing.push(name);
    pairs.push(`${name}:${st.join("/")}`);
  }
  return { ing: [...new Set(ing)].sort(), pairs: [...new Set(pairs)].sort(), rel: isRel(raw) };
}

// Place at: lib/safety.ts
// Suraksha Chakra rule engine – API route aur offline demo dono yahi use karte hain.
import type { Alert, Lang, Medicine } from "./types";
 
type Sev = "high" | "medium";
type M = Record<Lang, string>;
 
/* ------------------- Suraksha Chakra: rule-based alerts ------------------- */
// Ye hamare apne verified rules hain – AI ke bharose nahi. Judges ke saamne yahi bharosa dilata hai.
 
const ANTACID = /antacid|aluminium|aluminum|magnesium|calcium carbonate|digene|gelusil|mucaine/;
const MINERAL = /antacid|aluminium|aluminum|magnesium|calcium|ferrous|iron|zinc|digene|gelusil|mucaine/;
const BINDERS = /floxacin|doxycycline|tetracycline|minocycline/;
const NSAID = /diclofenac|ibuprofen|aceclofenac|naproxen|nimesulide|etoricoxib|piroxicam|ketorolac/;
const THINNER = /warfarin|acenocoumarol|clopidogrel|aspirin|ticagrelor|apixaban|rivaroxaban/;
 
type RuleBase = { id: string; sev: Sev; icons: string[]; msg: M };
type Rule =
  | (RuleBase & { kind: "single"; a: RegExp })
  | (RuleBase & { kind: "dup"; a: RegExp })
  | (RuleBase & { kind: "pair"; a: RegExp; b: RegExp });
 
const RULES: Rule[] = [
  {
    id: "azithro_antacid", kind: "pair", a: /azithromycin/, b: ANTACID, sev: "medium", icons: ["⏱️"],
    msg: {
      en: "Do not take {A} and {B} together. Keep a 2-hour gap.",
      hi: "{A} और {B} एक साथ न लें। दोनों के बीच 2 घंटे का अंतर रखें।",
      bh: "{A} आ {B} एक साथे मत खाईं। दूनो के बीच 2 घंटा के अंतर राखीं।",
    },
  },
  {
    id: "mineral_binding", kind: "pair", a: BINDERS, b: MINERAL, sev: "medium", icons: ["⏱️"],
    msg: {
      en: "{B} weakens {A}. Keep at least a 2-3 hour gap (ask your pharmacist for exact timing).",
      hi: "{B} से {A} का असर कम हो जाता है। कम से कम 2-3 घंटे का अंतर रखें (सही समय फार्मासिस्ट से पूछें)।",
      bh: "{B} से {A} के असर कम हो जाला। कम से कम 2-3 घंटा के अंतर राखीं (सही समय फार्मासिस्ट से पूछीं)।",
    },
  },
  {
    id: "levo_mineral", kind: "pair", a: /levothyroxine|thyroxine|thyronorm|eltroxin/, b: MINERAL, sev: "medium", icons: ["⏱️"],
    msg: {
      en: "{B} reduces the effect of {A}. Keep at least a 4-hour gap.",
      hi: "{B} से {A} का असर घटता है। कम से कम 4 घंटे का अंतर रखें।",
      bh: "{B} से {A} के असर घट जाला। कम से कम 4 घंटा के अंतर राखीं।",
    },
  },
  {
    id: "nsaid_thinner", kind: "pair", a: NSAID, b: THINNER, sev: "high", icons: ["🩸"],
    msg: {
      en: "{A} with {B} raises the risk of bleeding. Do not take together without the doctor's advice.",
      hi: "{A} और {B} साथ लेने से खून बहने का खतरा बढ़ता है। डॉक्टर की सलाह के बिना साथ न लें।",
      bh: "{A} आ {B} साथे खइला से खून बहे के खतरा बढ़ जाला। डॉक्टर के सलाह बिना साथे मत खाईं।",
    },
  },
  {
    id: "nsaid_dup", kind: "dup", a: NSAID, sev: "high", icons: ["🛑"],
    msg: {
      en: "{A} and {B} are both pain-killers (NSAID). Together they raise the risk of stomach bleeding. Ask the doctor.",
      hi: "{A} और {B} दोनों दर्द की दवाई (NSAID) हैं। साथ लेने से पेट में घाव/खून का खतरा है। डॉक्टर से पूछें।",
      bh: "{A} आ {B} दूनो दर्द के दवाई (NSAID) बाड़ी सन। साथे खइला से पेट में घाव/खून के खतरा बा। डॉक्टर से पूछीं।",
    },
  },
  {
    id: "paracetamol_dup", kind: "dup", a: /paracetamol|acetaminophen/, sev: "high", icons: ["🛑"],
    msg: {
      en: "{A} and {B} both contain paracetamol. Together they can cross the safe daily limit and harm the liver.",
      hi: "{A} और {B} दोनों में पैरासिटामोल है। साथ लेने से सीमा से ज़्यादा हो सकती है और लिवर को नुकसान हो सकता है।",
      bh: "{A} आ {B} दूनो में पैरासिटामोल बा। साथे खइला से सीमा से जादे हो सकेला आ लिवर के नुकसान हो सकेला।",
    },
  },
  {
    id: "alcohol", kind: "single", a: /metronidazole|tinidazole|ornidazole|secnidazole/, sev: "high", icons: ["🍺❌"],
    msg: {
      en: "{A}: alcohol is strictly forbidden during the course and for 3 days after it (vomiting, palpitations).",
      hi: "{A}: दवा के दौरान और उसके 3 दिन बाद तक शराब बिल्कुल मना है (उल्टी, घबराहट हो सकती है)।",
      bh: "{A}: दवाई चलला के दौरान आ ओकरा 3 दिन बाद तक दारू बिल्कुल मना बा (उल्टी, घबराहट हो सकेला)।",
    },
  },
  {
    id: "milk", kind: "single", a: BINDERS, sev: "medium", icons: ["🥛❌"],
    msg: {
      en: "{A}: do not take with milk or curd; it weakens the medicine.",
      hi: "{A}: दूध या दही के साथ न लें, इससे दवा का असर कम होता है।",
      bh: "{A}: दूध भा दही के साथे मत खाईं, एसे दवाई के असर कम हो जाला।",
    },
  },
];
 
const SAME_SALT: M = {
  en: "{A} and {B} contain the same medicine. Taking both doubles the dose. Confirm with the doctor.",
  hi: "{A} और {B} में एक ही दवा है। दोनों लेने से डोज़ दोगुना हो जाएगा। डॉक्टर से पूछें।",
  bh: "{A} आ {B} में एके दवाई बा। दूनो खइला से डोज़ दुगुना हो जाई। डॉक्टर से पूछीं।",
};
 
export function runSafetyRules(meds: Medicine[], lang: Lang): Alert[] {
  const names = meds.map((m) => m.brandName || m.genericSalt);
  const txt = meds.map((m) => `${m.brandName} ${m.genericSalt}`.toLowerCase());
  const out: Alert[] = [];
  const seen = new Set<string>();
 
  const add = (id: string, sev: Sev, icons: string[], msg: M, idx: number[]) => {
    const key = `${id}:${idx.join("-")}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({
      id, severity: sev, icons,
      medicines: idx.map((i) => names[i]),
      message: msg[lang].replace(/\{A\}/g, names[idx[0]]).replace(/\{B\}/g, names[idx[1]] ?? ""),
    });
  };
 
  const pairsCovered = new Set<string>();
  for (const r of RULES) {
    const hit = txt.map((t, i) => (r.a.test(t) ? i : -1)).filter((i) => i >= 0);
    if (r.kind === "single") hit.forEach((i) => add(r.id, r.sev, r.icons, r.msg, [i]));
    else if (r.kind === "dup") {
      if (hit.length >= 2) {
        add(r.id, r.sev, r.icons, r.msg, hit.slice(0, 2));
        pairsCovered.add(hit.slice(0, 2).sort().join("-"));
      }
    } else {
      for (const i of hit) txt.forEach((t, j) => i !== j && r.b.test(t) && add(r.id, r.sev, r.icons, r.msg, [i, j]));
    }
  }
 
  // Ek hi salt do baar likha ho (alag brand naam se)
  const bySalt = new Map<string, number[]>();
  meds.forEach((m, i) => {
    const k = m.genericSalt.toLowerCase().replace(/[^a-z+]/g, "");
    if (k.length > 3) bySalt.set(k, [...(bySalt.get(k) ?? []), i]);
  });
  bySalt.forEach((idx) => {
    if (idx.length >= 2 && !pairsCovered.has(idx.slice(0, 2).sort().join("-")))
      add("same_salt", "high", ["🛑"], SAME_SALT, idx.slice(0, 2));
  });
 
  return out.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "high" ? -1 : 1));
}
 
 

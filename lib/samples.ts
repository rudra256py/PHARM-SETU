// Place at: lib/samples.ts
// Demo parchi browser me hi canvas par bante hain – repo me koi image upload nahi karni.
// Ye parchi AI ke asli pipeline se guzarti hai (Gemini Vision), sirf photo apne aap ban jati hai.
import { runSafetyRules } from "./safety";
import type { DecodeSuccess, Lang, Medicine } from "./types";

export type Sample = {
  id: string;
  title: Record<Lang, string>;
  patient: string;
  lines: string[];
};

export const SAMPLES: Sample[] = [
  {
    id: "s1",
    title: { hi: "डेमो 1: एंटीबायोटिक + गैस की दवा", bh: "डेमो 1: एंटीबायोटिक + गैस के दवाई", en: "Demo 1: Antibiotic + antacid" },
    patient: "Ram Kumar, 58 M",
    lines: [
      "1) Tab. Azithromycin 500 mg", "      1 OD x 3 days (PC)",
      "2) Tab. Pantoprazole 40 mg", "      1 OD x 5 days (AC, empty stomach)",
      "3) Syp. Digene (antacid) 10 ml", "      TDS x 5 days (PC)",
      "4) Tab. Paracetamol 500 mg", "      1 SOS for fever (max 3/day)",
    ],
  },
  {
    id: "s2",
    title: { hi: "डेमो 2: दर्द की दो दवा + पेट का इन्फेक्शन", bh: "डेमो 2: दर्द के दू दवाई + पेट के इन्फेक्शन", en: "Demo 2: Two painkillers + stomach infection" },
    patient: "Sunil Yadav, 34 M",
    lines: [
      "1) Tab. Diclofenac 50 mg", "      1 BD x 5 days (PC)",
      "2) Tab. Ibuprofen 400 + Paracetamol 325", "      1 TDS x 3 days (PC)",
      "3) Cap. Omeprazole 20 mg", "      1 OD x 5 days (AC)",
      "4) Tab. Metronidazole 400 mg", "      1 TDS x 5 days (PC)",
    ],
  },
  {
    id: "s3",
    title: { hi: "डेमो 3: बुज़ुर्ग – BP और शुगर", bh: "डेमो 3: बुजुर्ग – BP आ शुगर", en: "Demo 3: Elderly – BP & sugar" },
    patient: "Sita Devi, 62 F",
    lines: [
      "1) Tab. Amlodipine 5 mg", "      1 OD morning, continue",
      "2) Tab. Metformin 500 mg", "      1 BD (PC), continue",
      "3) Tab. Atorvastatin 10 mg", "      1 HS, continue",
      "4) Tab. Aspirin 75 mg", "      1 OD (PC), continue",
    ],
  },
];

export async function renderSample(s: Sample): Promise<File> {
  const W = 900, H = 1000;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  if (!g) throw new Error("Canvas available nahi hai");

  g.fillStyle = "#fffdf5"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#1e293b";
  g.font = "bold 34px Georgia, serif";
  g.fillText("Dr. R. K. Sinha, MBBS, MD (Medicine)", 40, 70);
  g.font = "20px Georgia, serif";
  g.fillText("SAMPLE PRESCRIPTION FOR DEMO - NOT REAL", 40, 104);
  g.fillText(`Patient: ${s.patient}        Date: 19/10/2026`, 40, 150);
  g.fillRect(40, 168, W - 80, 2);
  g.font = "bold 60px Georgia, serif";
  g.fillText("Rx", 40, 250);

  g.font = "30px 'Courier New', monospace";
  s.lines.forEach((line, i) => g.fillText(line, 60, 320 + i * 62 + Math.floor(i / 2) * 18));

  g.font = "italic 24px Georgia, serif";
  g.fillText("Dr. R. K. Sinha", W - 300, H - 70);

  const blob: Blob = await new Promise((res, rej) =>
    c.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/jpeg", 0.9)
  );
  return new File([blob], `${s.id}.jpg`, { type: "image/jpeg" });
}


/* ------------------------------------------------------------------------
   Offline demo: agar internet / AI limit dhoka de, tab bhi demo chalega.
   Natija screen pe "ऑफ़लाइन डेमो" ke badge ke saath dikhta hai (chhupaya nahi jata).
   Suraksha Chakra ke alerts yahan bhi wahi rule-engine banata hai.
------------------------------------------------------------------------- */

type L3 = Record<Lang, string>;
type FbMed = {
  brand: string; salt: string; strength: string | null; form: Medicine["form"];
  purpose: L3; sig: string; schedule: [number, number, number];
  timing: Medicine["timing"]; days: number | null; food?: Medicine["foodWarnings"];
};

const FB: Record<string, FbMed[]> = {
  s1: [
    { brand: "Azithromycin", salt: "Azithromycin 500mg", strength: "500 mg", form: "tablet", sig: "1 OD (PC)", schedule: [1, 0, 0], timing: "after_food", days: 3,
      purpose: { hi: "बैक्टीरिया के संक्रमण (इन्फेक्शन) के लिए एंटीबायोटिक", bh: "कीटाणु के संक्रमण (इन्फेक्शन) खातिर एंटीबायोटिक", en: "Antibiotic for bacterial infection" } },
    { brand: "Pantoprazole", salt: "Pantoprazole 40mg", strength: "40 mg", form: "tablet", sig: "1 OD (AC)", schedule: [1, 0, 0], timing: "empty_stomach", days: 5,
      purpose: { hi: "पेट की गैस और जलन कम करने के लिए", bh: "पेट के गैस आ जलन कम करे खातिर", en: "Reduces stomach acid and burning" } },
    { brand: "Digene", salt: "Aluminium Hydroxide + Magnesium Hydroxide + Simethicone", strength: "10 ml", form: "syrup", sig: "TDS (PC)", schedule: [1, 1, 1], timing: "after_food", days: 5,
      purpose: { hi: "खट्टी डकार और गैस में राहत के लिए", bh: "खट्टा डकार आ गैस में राहत खातिर", en: "Relief from acidity and gas" } },
    { brand: "Paracetamol", salt: "Paracetamol 500mg", strength: "500 mg", form: "tablet", sig: "1 SOS", schedule: [0, 0, 0], timing: "any", days: null,
      purpose: { hi: "बुखार और दर्द कम करने के लिए", bh: "बोखार आ दर्द कम करे खातिर", en: "Brings down fever and pain" } },
  ],
  s2: [
    { brand: "Diclofenac", salt: "Diclofenac 50mg", strength: "50 mg", form: "tablet", sig: "1 BD (PC)", schedule: [1, 0, 1], timing: "after_food", days: 5,
      purpose: { hi: "दर्द और सूजन कम करने के लिए", bh: "दर्द आ सूजन कम करे खातिर", en: "Reduces pain and swelling" } },
    { brand: "Ibuprofen + Paracetamol", salt: "Ibuprofen 400mg + Paracetamol 325mg", strength: "400 + 325 mg", form: "tablet", sig: "1 TDS (PC)", schedule: [1, 1, 1], timing: "after_food", days: 3,
      purpose: { hi: "दर्द और बुखार के लिए", bh: "दर्द आ बोखार खातिर", en: "For pain and fever" } },
    { brand: "Omeprazole", salt: "Omeprazole 20mg", strength: "20 mg", form: "capsule", sig: "1 OD (AC)", schedule: [1, 0, 0], timing: "before_food", days: 5,
      purpose: { hi: "पेट की गैस और जलन से बचाव के लिए", bh: "पेट के गैस आ जलन से बचाव खातिर", en: "Protects the stomach from acid" } },
    { brand: "Metronidazole", salt: "Metronidazole 400mg", strength: "400 mg", form: "tablet", sig: "1 TDS (PC)", schedule: [1, 1, 1], timing: "after_food", days: 5, food: ["no_alcohol"],
      purpose: { hi: "पेट और आँत के संक्रमण (कीटाणु) के लिए", bh: "पेट आ आँत के संक्रमण (कीटाणु) खातिर", en: "For stomach and intestinal infection" } },
  ],
  s3: [
    { brand: "Amlodipine", salt: "Amlodipine 5mg", strength: "5 mg", form: "tablet", sig: "1 OD", schedule: [1, 0, 0], timing: "any", days: null,
      purpose: { hi: "ब्लड प्रेशर (BP) कंट्रोल रखने के लिए", bh: "ब्लड प्रेशर (BP) कंट्रोल राखे खातिर", en: "Keeps blood pressure under control" } },
    { brand: "Metformin", salt: "Metformin 500mg", strength: "500 mg", form: "tablet", sig: "1 BD (PC)", schedule: [1, 0, 1], timing: "after_food", days: null,
      purpose: { hi: "शुगर (डायबिटीज़) कंट्रोल रखने के लिए", bh: "शुगर (डायबिटीज़) कंट्रोल राखे खातिर", en: "Keeps blood sugar under control" } },
    { brand: "Atorvastatin", salt: "Atorvastatin 10mg", strength: "10 mg", form: "tablet", sig: "1 HS", schedule: [0, 0, 1], timing: "any", days: null,
      purpose: { hi: "कोलेस्ट्रॉल कम करने के लिए", bh: "कोलेस्ट्रॉल कम करे खातिर", en: "Lowers cholesterol" } },
    { brand: "Aspirin", salt: "Aspirin 75mg", strength: "75 mg", form: "tablet", sig: "1 OD (PC)", schedule: [1, 0, 0], timing: "after_food", days: null,
      purpose: { hi: "दिल की सुरक्षा और खून के थक्के से बचाव के लिए", bh: "दिल के सुरक्षा आ खून के थक्का से बचाव खातिर", en: "Protects the heart and prevents blood clots" } },
  ],
};

const JARGON: Record<Lang, Record<string, string>> = {
  hi: { OD: "(दिन में एक बार)", BD: "(सुबह-शाम)", TDS: "(दिन में तीन बार)", SOS: "(ज़रूरत पड़ने पर)", HS: "(रात को सोते समय)", AC: "(खाने से पहले)", PC: "(खाने के बाद)" },
  bh: { OD: "(दिन में एक बेर)", BD: "(भोर-सांझ)", TDS: "(दिन में तीन बेर)", SOS: "(जरूरत पड़ला पर)", HS: "(रात के सुतत घरी)", AC: "(खाए से पहिले)", PC: "(खाए के बाद)" },
  en: { OD: "(once a day)", BD: "(morning & night)", TDS: "(three times a day)", SOS: "(only if needed)", HS: "(at bedtime)", AC: "(before food)", PC: "(after food)" },
};

const explainSig = (sig: string, lang: Lang) =>
  sig.replace(/[()]/g, "").replace(/\b(OD|BD|TDS|SOS|HS|AC|PC)\b/g, (t) => `${t} ${JARGON[lang][t]}`);

const SLOT: Record<Lang, string[]> = { hi: ["सुबह", "दोपहर", "रात"], bh: ["भोर", "दुपहरिया", "रात"], en: ["morning", "afternoon", "night"] };
const WHEN: Record<Lang, Record<Medicine["timing"], string>> = {
  hi: { empty_stomach: "खाली पेट", before_food: "खाने से पहले", with_food: "खाने के साथ", after_food: "खाने के बाद", any: "" },
  bh: { empty_stomach: "खाली पेट", before_food: "खाए से पहिले", with_food: "खाए के साथे", after_food: "खाए के बाद", any: "" },
  en: { empty_stomach: "on an empty stomach", before_food: "before food", with_food: "with food", after_food: "after food", any: "" },
};

function speechFor(m: FbMed, lang: Lang): string {
  const name = m.brand + (m.strength ? ` ${m.strength}` : "");
  const slots = m.schedule.map((n, i) => (n > 0 ? `${SLOT[lang][i]} ${n}` : "")).filter(Boolean).join(", ");
  const when = WHEN[lang][m.timing];
  if (lang === "en") return `${name}. ${m.purpose.en}. ${slots ? `Take ${slots}${when ? ", " + when : ""}.` : "Take only when needed."}`;
  const verb = lang === "hi" ? "लें" : "खाईं";
  const need = lang === "hi" ? "ज़रूरत पड़ने पर ही लें।" : "जरूरत पड़ला पर ही खाईं।";
  return `${name}. ${m.purpose[lang]}। ${slots ? `${slots} गोली ${when ? when + " " : ""}${verb}।` : need}`;
}

const SUMMARY: Record<Lang, (n: number) => string> = {
  hi: (n) => `इस पर्ची में ${n} दवाइयाँ हैं।`,
  bh: (n) => `ए पर्ची में ${n} दवाई बा।`,
  en: (n) => `This prescription has ${n} medicines.`,
};

export function buildFallback(id: string, lang: Lang): DecodeSuccess | null {
  const list = FB[id];
  if (!list) return null;
  const medicines: Medicine[] = list.map((m) => ({
    brandName: m.brand, genericSalt: m.salt, strength: m.strength, form: m.form,
    purpose: m.purpose[lang], sigOriginal: m.sig, sigExplained: explainSig(m.sig, lang),
    schedule: { morning: m.schedule[0], afternoon: m.schedule[1], night: m.schedule[2] },
    timing: m.timing, durationDays: m.days, foodWarnings: m.food ?? [],
    speech: speechFor(m, lang), needsCheck: false,
  }));
  return { ok: true, model: "offline-demo", lang, readable: true, summarySpeech: SUMMARY[lang](medicines.length), medicines, alerts: runSafetyRules(medicines, lang) };
}

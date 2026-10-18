// PHARM SETU – Core engine: parchi/strip photo -> structured medicines + Suraksha Chakra alerts
// Place at: app/api/decode/route.ts
import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel: Gemini vision ko time lag sakta hai

type Lang = "hi" | "en" | "bh";
type Sev = "high" | "medium";
type M = Record<Lang, string>;

type Med = {
  brandName: string;
  genericSalt: string;
  strength: string | null;
  form: string;
  purpose: string;
  sigOriginal: string | null;
  sigExplained: string;
  schedule: { morning: number; afternoon: number; night: number };
  timing: string;
  durationDays: number | null;
  foodWarnings: string[];
  speech: string;
  needsCheck: boolean;
};

type Alert = { id: string; severity: Sev; medicines: string[]; icons: string[]; message: string };

const LANG_NAME: Record<Lang, string> = {
  hi: "Hindi in Devanagari script, very simple everyday words",
  en: "simple English",
  bh: "Bhojpuri in Devanagari script, simple spoken village style",
};

/* ---------------------------- Gemini schema ---------------------------- */

const medicineSchema = {
  type: Type.OBJECT,
  properties: {
    brandName: { type: Type.STRING },
    genericSalt: { type: Type.STRING },
    strength: { type: Type.STRING, nullable: true },
    form: { type: Type.STRING, enum: ["tablet", "capsule", "syrup", "injection", "ointment", "drops", "other"] },
    purpose: { type: Type.STRING },
    sigOriginal: { type: Type.STRING, nullable: true },
    sigExplained: { type: Type.STRING },
    schedule: {
      type: Type.OBJECT,
      properties: { morning: { type: Type.NUMBER }, afternoon: { type: Type.NUMBER }, night: { type: Type.NUMBER } },
      required: ["morning", "afternoon", "night"],
    },
    timing: { type: Type.STRING, enum: ["empty_stomach", "before_food", "with_food", "after_food", "any"] },
    durationDays: { type: Type.NUMBER, nullable: true },
    foodWarnings: { type: Type.ARRAY, items: { type: Type.STRING, enum: ["no_milk", "no_alcohol", "avoid_driving"] } },
    speech: { type: Type.STRING },
    needsCheck: { type: Type.BOOLEAN },
  },
  required: ["brandName", "genericSalt", "form", "purpose", "sigExplained", "schedule", "timing", "foodWarnings", "speech", "needsCheck"],
};

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    isMedicalImage: { type: Type.BOOLEAN },
    readable: { type: Type.BOOLEAN },
    summarySpeech: { type: Type.STRING },
    medicines: { type: Type.ARRAY, items: medicineSchema },
  },
  required: ["isMedicalImage", "readable", "summarySpeech", "medicines"],
};

const buildSystem = (lang: Lang, mode: string) => `
You are a careful pharmacist assistant helping rural Indian patients understand a doctor's prescription or a medicine strip photo.
Write every patient-facing field (purpose, sigExplained, speech, summarySpeech) in ${LANG_NAME[lang]}. Keep brand names as printed.

STRICT RULES
- Never guess. If handwriting or print is unclear, still list what you can see but set needsCheck=true. Never invent a dose, name or duration.
- If the image has no medicine/prescription, set isMedicalImage=false, readable=false, medicines=[].
- genericSalt = generic composition with strength, in English (e.g. "Pantoprazole 40mg"). If a combination, join with " + ".
- Do NOT diagnose or suggest changing any dose.
- sigOriginal = dosage shorthand exactly as written (e.g. "1 BD PC", "1-0-1", "SOS").
- sigExplained MUST keep the medical jargon and put its plain meaning in brackets right after it,
  e.g. "BD (subah-shaam)", "PC (khane ke baad)", "SOS (zaroorat padne par)", "HS (raat ko sote waqt)", "AC (khane se pehle)" -
  translated into the target language.
- schedule = number of units per slot: OD=morning 1; BD=morning 1 + night 1; TDS=morning, afternoon, night 1 each; HS=night 1; "1-0-1" = morning-afternoon-night.
- timing: use empty_stomach for PPIs like pantoprazole/omeprazole/rabeprazole in the morning before breakfast, or whatever the prescription says.
- foodWarnings: no_milk (tetracyclines/fluoroquinolones), no_alcohol (metronidazole/tinidazole etc.), avoid_driving (sedating antihistamines, etc.). Only when truly applicable.
- purpose = one short line: what the medicine is for (e.g. "pet ki gas aur jalan kam karne ke liye"). No medical jargon.
- speech = 1-2 warm, short sentences to be read aloud: medicine name, when to take, with/without food. No abbreviations.
- summarySpeech = one sentence introducing how many medicines were found.
${mode === "strip"
  ? "- MODE strip: dose schedule is usually NOT printed. Set schedule all 0, timing 'any', needsCheck=true, and say in sigExplained that the dose must be confirmed with the doctor."
  : "- MODE prescription: read every medicine line on the prescription."}
`;

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

function runSafetyRules(meds: Med[], lang: Lang): Alert[] {
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

/* ------------------------------- Handlers ------------------------------- */

const fail = (status: number, code: string, message: string, fallback = false) =>
  NextResponse.json({ ok: false, code, message, fallback }, { status });

const clamp = (n: unknown) => Math.max(0, Math.min(10, Number(n) || 0));

// GET /api/decode -> sab theek chal raha hai ya nahi (key leak nahi hoti)
export async function GET() {
  return NextResponse.json({
    ok: true,
    keyLoaded: Boolean(process.env.GEMINI_API_KEY),
    model: process.env.GEMINI_MODEL ?? "gemini-3.5-flash",
  });
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fail(500, "NO_API_KEY", "Server par GEMINI_API_KEY set nahi hai.");

  let body: { imageBase64?: string; mimeType?: string; lang?: string; mode?: string };
  try {
    body = await req.json();
  } catch {
    return fail(400, "BAD_JSON", "Request galat format me hai.");
  }

  const lang: Lang = body.lang === "en" || body.lang === "bh" ? body.lang : "hi";
  const mode = body.mode === "strip" ? "strip" : "prescription";
  const mimeType = body.mimeType ?? "image/jpeg";
  const data = (body.imageBase64 ?? "").replace(/^data:.*?;base64,/, "");

  if (!data) return fail(400, "NO_IMAGE", "Photo nahi mili.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) return fail(400, "BAD_TYPE", "Sirf JPG, PNG ya WEBP photo chalegi.");
  if (data.length > 4_000_000) return fail(413, "TOO_BIG", "Photo bahut badi hai. Compress karke bhejein.");

  const ai = new GoogleGenAI({ apiKey });
  const models = [process.env.GEMINI_MODEL ?? "gemini-3.5-flash", process.env.GEMINI_FALLBACK_MODEL].filter(Boolean) as string[];

  let raw = "";
  let usedModel = "";
  for (const model of models) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ inlineData: { mimeType, data } }, { text: "Decode this image as instructed." }] }],
        config: {
          systemInstruction: buildSystem(lang, mode),
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.1,
        },
      });
      raw = res.text ?? "";
      usedModel = model;
      if (raw) break;
    } catch (e) {
      const status = (e as { status?: number })?.status ?? 0;
      console.error(`[decode] ${model} failed`, status, (e as Error)?.message);
      if (status === 429 || status >= 500 || status === 0) continue; // agla model try karo
      return fail(502, "AI_ERROR", "AI se jawab nahi mila. Dobara try karein.", true);
    }
  }
  if (!raw) return fail(503, "AI_UNAVAILABLE", "AI abhi busy hai. Sample parchi try karein.", true);

  let parsed: { isMedicalImage?: boolean; readable?: boolean; summarySpeech?: string; medicines?: Med[] };
  try {
    parsed = JSON.parse(raw.replace(/^```json|```$/g, "").trim());
  } catch {
    return fail(502, "BAD_AI_JSON", "Jawab samajh nahi aaya. Saaf photo ke saath dobara try karein.", true);
  }

  const medicines = (parsed.medicines ?? []).slice(0, 15).map((m) => ({
    ...m,
    schedule: { morning: clamp(m.schedule?.morning), afternoon: clamp(m.schedule?.afternoon), night: clamp(m.schedule?.night) },
    foodWarnings: m.foodWarnings ?? [],
    needsCheck: Boolean(m.needsCheck),
  }));

  if (!parsed.isMedicalImage || medicines.length === 0)
    return fail(422, "NOT_READABLE", "Photo me dawai ya parchi nahi dikhi. Saaf aur seedhi photo khinchein, ya dawai ke patte ke peeche ki photo lein.");

  return NextResponse.json({
    ok: true,
    model: usedModel,
    lang,
    readable: Boolean(parsed.readable),
    summarySpeech: parsed.summarySpeech ?? "",
    medicines,
    alerts: runSafetyRules(medicines, lang),
  });
}

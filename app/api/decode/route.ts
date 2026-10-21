// PHARM SETU – Core engine: parchi/strip photo -> structured medicines + Suraksha Chakra alerts
// Place at: app/api/decode/route.ts
import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { runSafetyRules } from "@/lib/safety";
import type { Lang, Medicine } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const VERSION = "0.4";
const DEFAULT_MODEL = "gemini-3.5-flash";

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

/* ------------------------------ AI plumbing ------------------------------ */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const short = (s: string) => s.replace(/\s+/g, " ").slice(0, 160);

type Mode = "gemini" | "vertex";

// AI Studio ab "AQ." wali (authorization) keys deta hai – ye Gemini API (generativelanguage) ke liye hi hain.
// Isliye pehle hamesha Gemini API try hota hai; "AQ." key par Vertex express sirf doosra rasta (backup) hai.
function makeClient(key: string, mode: Mode) {
  const httpOptions = { timeout: 20000 };
  return mode === "vertex"
    ? new GoogleGenAI({ vertexai: true, apiKey: key, httpOptions })
    : new GoogleGenAI({ apiKey: key, httpOptions });
}

let goodMode: Mode | null = null; // jo rasta chal gaya, use yaad rakho
const modesFor = (key: string): Mode[] => {
  const all: Mode[] = key.startsWith("AQ.") ? ["gemini", "vertex"] : ["gemini"];
  return goodMode && all.includes(goodMode) ? [goodMode, ...all.filter((m) => m !== goodMode)] : all;
};

const cache: Partial<Record<Mode, { at: number; models: string[] }>> = {};

// Jo models is key ko sach me dikhte hain unme se behtar wale khud chun leta hai
async function candidateModels(ai: GoogleGenAI, mode: Mode): Promise<string[]> {
  const out: string[] = [];
  for (const m of [process.env.GEMINI_MODEL, process.env.GEMINI_FALLBACK_MODEL, DEFAULT_MODEL]) if (m && !out.includes(m)) out.push(m);

  const hit = cache[mode];
  if (!hit || Date.now() - hit.at > 10 * 60_000) {
    const found: { name: string; score: number }[] = [];
    try {
      const pager = await ai.models.list({ config: { pageSize: 100 } });
      for await (const m of pager) {
        const name = (m.name ?? "").replace(/^models\//, "");
        if (!/^gemini-[\d.]+-flash/.test(name)) continue;
        if (/image|tts|live|audio|embedding|robotics|computer|native/.test(name)) continue;
        if (m.supportedActions && m.supportedActions.length && !m.supportedActions.includes("generateContent")) continue;
        const v = parseFloat(name.match(/^gemini-([\d.]+)-/)?.[1] ?? "0");
        const score = v * 10 - (/preview|exp/.test(name) ? 5 : 0) - (/lite/.test(name) ? 0.5 : 0);
        found.push({ name, score });
      }
    } catch (e) {
      console.error("[decode] model list failed", short((e as Error)?.message ?? ""));
    }
    found.sort((a, b) => b.score - a.score);
    cache[mode] = { at: Date.now(), models: found.slice(0, 4).map((f) => f.name) };
  }
  for (const m of cache[mode]?.models ?? []) if (!out.includes(m)) out.push(m);
  return out.slice(0, 5);
}

/* ------------------------------- Handlers ------------------------------- */

const fail = (status: number, code: string, message: string, fallback = false, detail = "") =>
  NextResponse.json({ ok: false, code, message, fallback, detail }, { status });

const clamp = (n: unknown) => Math.max(0, Math.min(10, Number(n) || 0));

// GET /api/decode            -> sab theek hai ya nahi
// GET /api/decode?diag=1     -> kaun sa rasta (mode) aur model chal raha hai, kaun sa nahi (error ke saath)
export async function GET(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY;
  const base = { ok: true, version: VERSION, keyLoaded: Boolean(key), keyType: key ? (key.startsWith("AQ.") ? "auth-key (AQ.)" : key.startsWith("AIza") ? "standard-key (AIza)" : "unknown") : null };
  if (req.nextUrl.searchParams.get("diag") !== "1" || !key) return NextResponse.json(base);

  const scrub = (s: string) => s.split(key).join("***");
  const results: Record<string, unknown>[] = [];
  for (const mode of modesFor(key)) {
    const ai = makeClient(key, mode);
    const models = (await candidateModels(ai, mode)).slice(0, 3);
    for (const model of models) {
      const t0 = Date.now();
      try {
        const r = await ai.models.generateContent({ model, contents: "Reply with the single word OK" });
        if (r.text) goodMode = mode;
        results.push({ mode, model, ok: Boolean(r.text), ms: Date.now() - t0, reply: (r.text ?? "").slice(0, 20) });
      } catch (e) {
        results.push({ mode, model, ok: false, ms: Date.now() - t0, status: (e as { status?: number })?.status ?? 0, error: scrub(short((e as Error)?.message ?? "")) });
      }
    }
  }
  return NextResponse.json({ ...base, results });
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fail(500, "NO_API_KEY", "Server par GEMINI_API_KEY set nahi hai.", true);
  const scrub = (s: string) => s.split(apiKey).join("***");

  let body: { imageBase64?: string; mimeType?: string; lang?: string; mode?: string };
  try {
    body = await req.json();
  } catch {
    return fail(400, "BAD_JSON", "Request galat format me hai.");
  }

  const lang: Lang = body.lang === "en" || body.lang === "bh" ? body.lang : "hi";
  const scanMode = body.mode === "strip" ? "strip" : "prescription";
  const mimeType = body.mimeType ?? "image/jpeg";
  const data = (body.imageBase64 ?? "").replace(/^data:.*?;base64,/, "");

  if (!data) return fail(400, "NO_IMAGE", "Photo nahi mili.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) return fail(400, "BAD_TYPE", "Sirf JPG, PNG ya WEBP photo chalegi.");
  if (data.length > 4_000_000) return fail(413, "TOO_BIG", "Photo bahut badi hai. Compress karke bhejein.");

  const deadline = Date.now() + 48_000;
  const attempts: string[] = [];
  let raw = "";
  let usedModel = "";
  let authFails = 0;
  const modes = modesFor(apiKey);

  modeLoop: for (const mode of modes) {
    const ai = makeClient(apiKey, mode);
    const models = await candidateModels(ai, mode);
    for (const model of models) {
      for (let k = 0; k < 2; k++) {
        if (Date.now() > deadline) break modeLoop;
        try {
          const res = await ai.models.generateContent({
            model,
            contents: [{ role: "user", parts: [{ inlineData: { mimeType, data } }, { text: "Decode this image as instructed." }] }],
            config: {
              systemInstruction: buildSystem(lang, scanMode),
              responseMimeType: "application/json",
              responseSchema: RESPONSE_SCHEMA,
              temperature: 0.1,
            },
          });
          const text = res.text ?? "";
          if (text) { raw = text; usedModel = model; goodMode = mode; break modeLoop; }
          attempts.push(`${mode}/${model}: empty reply (${res.candidates?.[0]?.finishReason ?? "no reason"})`);
          break; // khaali jawab pe dobara nahi, agla model
        } catch (e) {
          const status = (e as { status?: number })?.status ?? 0;
          attempts.push(`${mode}/${model}: ${status} ${scrub(short((e as Error)?.message ?? ""))}`);
          if (status === 401 || status === 403) { authFails++; continue modeLoop; } // is rasta pe key nahi chali, doosra rasta try karo
          if ((status === 429 || status === 503 || status === 500 || status === 0) && k === 0) { await sleep(1500); continue; }
          break; // 400/404 etc: agla model
        }
      }
    }
  }
  const keyDead = authFails >= modes.length;

  if (!raw) {
    const all = attempts.join(" | ");
    console.error("[decode] all attempts failed:", all);
    let code = "AI_UNAVAILABLE";
    let msg = "AI abhi jawab nahi de pa raha. Thodi der baad try karein, ya niche se Demo parchi dekhein.";
    if (keyDead || /API key|API_KEY|PERMISSION_DENIED/i.test(all)) { code = "BAD_KEY"; msg = "API key kaam nahi kar rahi (galat ya band). Naya key banakar Vercel me daalein."; }
    else if (/\b429\b|RESOURCE_EXHAUSTED|quota/i.test(all)) { code = "RATE_LIMIT"; msg = "AI ki muft limit abhi poori ho gayi hai. 1 minute baad try karein, ya niche se Demo parchi dekhein."; }
    else if (/\b404\b|not found/i.test(all) && !/\b(429|503)\b/.test(all)) { code = "NO_MODEL"; msg = "Ye AI model is key par available nahi hai. Technical details me dekhein."; }
    return fail(503, code, msg, true, all.slice(0, 700));
  }

  let parsed: { isMedicalImage?: boolean; readable?: boolean; summarySpeech?: string; medicines?: Medicine[] };
  try {
    parsed = JSON.parse(raw.replace(/^```json|```$/g, "").trim());
  } catch {
    return fail(502, "BAD_AI_JSON", "Jawab samajh nahi aaya. Saaf photo ke saath dobara try karein.", true, short(raw));
  }

  const medicines = (parsed.medicines ?? []).slice(0, 15).map((m) => ({
    ...m,
    schedule: { morning: clamp(m.schedule?.morning), afternoon: clamp(m.schedule?.afternoon), night: clamp(m.schedule?.night) },
    foodWarnings: m.foodWarnings ?? [],
    needsCheck: Boolean(m.needsCheck),
  })) as Medicine[];

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

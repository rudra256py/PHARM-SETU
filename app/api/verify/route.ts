// POST /api/verify  { imageBase64, mimeType }  ->  { ok:true, strips:[...] }
// The AI ONLY transcribes what is printed on the strips. It is never told what the prescription says (so it cannot "agree" by guessing);
// the actual match / mismatch decision is made by plain code in lib/verify.ts.
import { Type, type Schema } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { askGeminiJSON } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

const FORMS = ["tablet", "capsule", "syrup", "injection", "ointment", "drops", "other"];

const SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    looksLikeMedicine: { type: Type.BOOLEAN },
    strips: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          brandName: { type: Type.STRING, nullable: true },
          composition: { type: Type.STRING, nullable: true },
          form: { type: Type.STRING, enum: FORMS },
          extendedRelease: { type: Type.BOOLEAN },
          expiry: { type: Type.STRING, nullable: true },
          printedMrp: { type: Type.NUMBER, nullable: true },
          packCount: { type: Type.NUMBER, nullable: true },
          isJanAushadhi: { type: Type.BOOLEAN },
          clearlyReadable: { type: Type.BOOLEAN },
        },
        required: ["form", "extendedRelease", "isJanAushadhi", "clearlyReadable"],
      },
    },
  },
  required: ["looksLikeMedicine", "strips"],
};

const SYSTEM = `You read photos of medicine strips, blister packs, bottles and boxes bought at a pharmacy in India.
Transcribe ONLY what is physically printed. NEVER guess, complete or "fix" a composition from the brand name or from your own knowledge. If any text is not clearly legible, use null.
Return one entry per separate strip/box/bottle visible (max 8).
Fields:
- brandName: the printed brand name (null if unreadable).
- composition: the printed active ingredients WITH strengths, short form, e.g. "Pantoprazole 40 mg" or "Aceclofenac 100 mg + Paracetamol 325 mg". Never invent a strength.
- form: tablet, capsule, syrup, injection, ointment, drops or other.
- extendedRelease: true ONLY if SR / ER / XR / CR / prolonged-release / sustained-release is printed.
- expiry: the expiry date as "MM/YYYY" (look for EXP / Exp. / Expiry / Use before; month names are fine). null if not clearly readable. Do NOT confuse it with the manufacturing date (MFG).
- printedMrp: the printed MRP in rupees as a number, null if not printed.
- packCount: number of tablets/capsules in this pack if printed or clearly countable, else null.
- isJanAushadhi: true ONLY if "Jan Aushadhi", "PMBJP" or "PMBI" text/logo is visible.
- clearlyReadable: true ONLY if the composition AND the strength of every ingredient are clearly legible.
If the image does not show medicine packaging, set looksLikeMedicine=false and strips=[].`;

const str = (v: unknown, max = 200) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 && v < 100000 ? v : null);

export async function POST(req: NextRequest) {
  let body: { imageBase64?: string; mimeType?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, code: "BAD_JSON" }, { status: 400 }); }
  const mimeType = body.mimeType ?? "image/jpeg";
  const data = (body.imageBase64 ?? "").replace(/^data:.*?;base64,/, "");
  if (!data) return NextResponse.json({ ok: false, code: "NO_IMAGE" }, { status: 400 });
  if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) return NextResponse.json({ ok: false, code: "BAD_TYPE" }, { status: 400 });
  if (data.length > 4_000_000) return NextResponse.json({ ok: false, code: "TOO_BIG" }, { status: 413 });

  const r = await askGeminiJSON({ system: SYSTEM, prompt: "Transcribe the medicine strips in this photo as instructed.", imageBase64: data, mimeType, schema: SCHEMA });
  if (!r.ok) { console.error("[verify]", r.code, r.detail); return NextResponse.json({ ok: false, code: r.code }, { status: 503 }); }

  let parsed: { looksLikeMedicine?: boolean; strips?: Record<string, unknown>[] };
  try { parsed = JSON.parse(r.text); } catch { return NextResponse.json({ ok: false, code: "AI_UNAVAILABLE" }, { status: 502 }); }
  if (parsed.looksLikeMedicine === false || !Array.isArray(parsed.strips)) return NextResponse.json({ ok: true, model: r.model, strips: [] });

  const strips = parsed.strips.slice(0, 8).map((s) => ({
    brandName: str(s.brandName, 80),
    composition: str(s.composition, 220),
    form: FORMS.includes(String(s.form)) ? String(s.form) : "other",
    extendedRelease: s.extendedRelease === true,
    expiry: str(s.expiry, 20),
    printedMrp: num(s.printedMrp),
    packCount: num(s.packCount),
    isJanAushadhi: s.isJanAushadhi === true,
    clearlyReadable: s.clearlyReadable === true,
  }));
  return NextResponse.json({ ok: true, model: r.model, strips });
}

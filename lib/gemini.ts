// lib/gemini.ts - small shared "ask Gemini for JSON about an image" helper with the same model fallback chain as /api/decode.
// (Used by /api/verify. /api/decode keeps its own tested copy on purpose, so the scanner is not touched.)
import { GoogleGenAI, ThinkingLevel, type Schema } from "@google/genai";

const cool = new Map<string, number>(); // model -> "limit reached, skip until"
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type AiResult =
  | { ok: true; text: string; model: string }
  | { ok: false; code: "NO_API_KEY" | "BAD_KEY" | "RATE_LIMIT" | "AI_UNAVAILABLE"; detail: string };

export async function askGeminiJSON(o: { system: string; prompt: string; imageBase64: string; mimeType: string; schema: Schema; budgetMs?: number }): Promise<AiResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { ok: false, code: "NO_API_KEY", detail: "GEMINI_API_KEY missing" };
  const deadline = Date.now() + (o.budgetMs ?? 40_000);
  const models = [...new Set([process.env.GEMINI_MODEL, process.env.GEMINI_FALLBACK_MODEL, "gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.1-flash-lite"].filter(Boolean) as string[])]
    .sort((a, b) => Number((cool.get(a) ?? 0) > Date.now()) - Number((cool.get(b) ?? 0) > Date.now()));
  const modes: ("gemini" | "vertex")[] = key.startsWith("AQ.") ? ["gemini", "vertex"] : ["gemini"];
  const notes: string[] = [];
  let authFails = 0;

  modeLoop: for (const mode of modes) {
    const ai = new GoogleGenAI(mode === "vertex" ? { vertexai: true, apiKey: key } : { apiKey: key });
    for (const model of models) {
      for (let k = 0; k < 2; k++) {
        if (deadline - Date.now() < 4000) break modeLoop;
        try {
          const res = await ai.models.generateContent({
            model,
            contents: [{ role: "user", parts: [{ inlineData: { mimeType: o.mimeType, data: o.imageBase64 } }, { text: o.prompt }] }],
            config: {
              systemInstruction: o.system, responseMimeType: "application/json", responseSchema: o.schema, temperature: 0.1,
              httpOptions: { timeout: Math.max(4000, Math.min(20_000, deadline - Date.now() - 1500)) },
              ...(/^gemini-3/.test(model) ? { thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM } } : {}),
            },
          });
          const text = res.text ?? "";
          if (text) {
            try { JSON.parse(text.replace(/^```json|```$/g, "").trim()); } catch { notes.push(`${model}: bad JSON`); break; }
            return { ok: true, text: text.replace(/^```json|```$/g, "").trim(), model };
          }
          notes.push(`${model}: empty`); break;
        } catch (e) {
          const status = (e as { status?: number })?.status ?? 0;
          notes.push(`${model}: ${status}`);
          if (status === 401 || status === 403) { authFails++; continue modeLoop; }
          if (status === 429) { cool.set(model, Date.now() + 90_000); break; }
          if ((status === 503 || status === 500) && k === 0) { await sleep(600); continue; }
          break;
        }
      }
    }
  }
  const all = notes.join(" | ");
  if (authFails >= modes.length) return { ok: false, code: "BAD_KEY", detail: all };
  if (/429/.test(all)) return { ok: false, code: "RATE_LIMIT", detail: all };
  return { ok: false, code: "AI_UNAVAILABLE", detail: all };
}

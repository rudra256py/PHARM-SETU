// Place at: lib/job.ts
// Home -> Scan -> Result: teeno pages ke beech photo aur result yahin se jaate hain (sirf is tab me, sessionStorage).
import { SAMPLES, buildFallback } from "./samples";
import type { DecodeResponse, DecodeSuccess, Lang } from "./types";

export type Mode = "prescription" | "strip";
export type Job = { imageBase64: string; mimeType: string; lang: Lang; mode: Mode; sample: number | null };
export type StoredResult = DecodeSuccess & { offline?: boolean };
export type DecodeOutcome = { ok: true; data: StoredResult } | { ok: false; message: string; detail?: string };

const KJ = "ps_job";
const KR = "ps_result";

const NET_ERR: Record<Lang, string> = {
  hi: "इंटरनेट या सर्वर में दिक्कत है। दोबारा कोशिश करें।",
  bh: "इंटरनेट भा सर्वर में दिक्कत बा। फेर से कोशिश करीं।",
  en: "Internet or server problem. Please try again.",
};

export function saveJob(j: Job) {
  try { sessionStorage.setItem(KJ, JSON.stringify(j)); sessionStorage.removeItem(KR); } catch { /* storage band */ }
}

export function updateJobLang(lang: Lang) {
  try {
    const j = loadJob();
    if (j) sessionStorage.setItem(KJ, JSON.stringify({ ...j, lang }));
  } catch { /* ignore */ }
}

export function loadJob(): Job | null {
  try { const r = sessionStorage.getItem(KJ); return r ? (JSON.parse(r) as Job) : null; } catch { return null; }
}

export function saveResult(r: StoredResult) {
  try {
    sessionStorage.setItem(KR, JSON.stringify(r));
    // /generic (sasti dawai) page isi se parchi ki dawaiyan padhta hai
    localStorage.setItem("ps_last", JSON.stringify(r.medicines.map((m) => ({ b: m.brandName, s: m.genericSalt, f: m.form }))));
  } catch { /* ignore */ }
}

export function loadResult(): StoredResult | null {
  try { const r = sessionStorage.getItem(KR); return r ? (JSON.parse(r) as StoredResult) : null; } catch { return null; }
}

// Photo ko AI se padhwata hai. Demo parchi ke liye AI fail ho to offline jawab turant mil jata hai.
export async function decodeJob(job: Job): Promise<DecodeOutcome> {
  const fallback = (): DecodeOutcome | null => {
    const fb = job.sample !== null ? buildFallback(SAMPLES[job.sample].id, job.lang) : null;
    return fb ? { ok: true, data: { ...fb, offline: true } } : null;
  };
  try {
    const res = await fetch("/api/decode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: job.imageBase64, mimeType: job.mimeType, lang: job.lang, mode: job.mode }),
    });
    const json = (await res.json()) as DecodeResponse & { detail?: string };
    if (json.ok) return { ok: true, data: json };
    return fallback() ?? { ok: false, message: json.message, detail: json.detail };
  } catch {
    return fallback() ?? { ok: false, message: NET_ERR[job.lang] };
  }
}

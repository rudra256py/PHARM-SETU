// lib/verify.ts - decides whether a strip bought at the counter matches the prescription.
// Pure code (no AI): the AI only reads the strip; every verdict below is a deterministic comparison, so it can be tested.
// GREEN needs: same ingredients + same strength + same release type (SR/ER) + compatible form + readable, valid expiry + clear photo.
import { isRel, parseSalt, type Parsed } from "./saltkey";

export type Strip = {
  brandName: string | null; composition: string | null; form: string; extendedRelease: boolean;
  expiry: string | null; printedMrp: number | null; packCount: number | null; isJanAushadhi: boolean; clearlyReadable: boolean;
};
export type Rx = { brandName: string; genericSalt: string; strength: string | null; form: string };
export type CheckKey = "salt" | "strength" | "release" | "form" | "expiry";
export type State = "ok" | "warn" | "bad";
export type Verdict = "match" | "check" | "mismatch";
export type ReasonCode =
  | "not_in_rx" | "wrong_salt" | "wrong_strength" | "wrong_release_sr" | "wrong_release_plain" | "wrong_form" | "expired" | "over_mrp" // bad
  | "expiring_soon" | "strength_unread" | "rx_no_strength" | "expiry_unread" | "low_read" | "salt_unread"; // warn
export type Reason = { code: ReasonCode; level: "warn" | "bad"; a?: string; b?: string };
export type StripResult = { rxIndex: number | null; verdict: Verdict; checks: Partial<Record<CheckKey, State>>; reasons: Reason[] };

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const hasStrengths = (p: Parsed) => p.pairs.length > 0 && p.pairs.every((x) => !x.endsWith(":"));
const formOk = (a: string, b: string) => !a || !b || a === b || a === "other" || b === "other";

// "Each film coated tablet contains Pantoprazole Sodium IP eq. to Pantoprazole 40 mg" -> "Pantoprazole 40 mg"
export function tidyComposition(s: string): string {
  return s.replace(/^.*?\b(?:contains|containing)\b[:\s]*/i, "").split(/\s*(?:\+|;|&)\s*/)
    .map((p) => p.split(/\beq(?:uivalent|\.)?\s*to\b/i).pop()!.trim()).filter(Boolean).join(" + ");
}

// Expiry printed on packs is valid until the LAST day of that month.
export function expiryEnd(s: string | null): Date | null {
  if (!s) return null;
  const t = s.trim().toLowerCase();
  let mo = 0, yr = 0, m: RegExpMatchArray | null;
  if ((m = t.match(/^(\d{1,2})\s*[\/\-.\s]\s*(\d{4}|\d{2})$/))) { mo = +m[1]; yr = +m[2]; }
  else if ((m = t.match(/^(\d{4})\s*[\/\-.]\s*(\d{1,2})$/))) { yr = +m[1]; mo = +m[2]; }
  else if ((m = t.match(/^([a-z]{3})[a-z]*[\s\-.,\/]*(\d{4}|\d{2})$/))) { mo = MONTHS.indexOf(m[1]) + 1; yr = +m[2]; }
  else return null;
  if (yr < 100) yr += 2000;
  if (!(mo >= 1 && mo <= 12) || yr < 2000 || yr > 2100) return null;
  return new Date(yr, mo, 0, 23, 59, 59);
}
const fmtExp = (d: Date) => `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

function parseRx(r: Rx): Parsed {
  let p = parseSalt(r.genericSalt || "");
  if (p.ing.length === 1 && p.pairs[0].endsWith(":") && r.strength) p = parseSalt(`${r.genericSalt} ${r.strength}`);
  p.rel = isRel(`${r.genericSalt} ${r.brandName} ${r.strength ?? ""}`);
  return p;
}
export const rxLabel = (r: Rx) => (/\d/.test(r.genericSalt) ? r.genericSalt : `${r.genericSalt} ${r.strength ?? ""}`).trim();

export function matchStrip(strip: Strip, rx: Rx[], now: Date = new Date(), asked: number | null = null): StripResult {
  const reasons: Reason[] = [];
  const checks: StripResult["checks"] = {};
  const bad = (code: ReasonCode, a?: string, b?: string) => reasons.push({ code, level: "bad", a, b });
  const warn = (code: ReasonCode, a?: string, b?: string) => reasons.push({ code, level: "warn", a, b });
  const verdictOf = (): Verdict => (reasons.some((r) => r.level === "bad") ? "mismatch" : reasons.length ? "check" : "match");

  const sp = parseSalt(tidyComposition(strip.composition ?? ""));
  if (!strip.composition || !sp.ing.length) {
    const bi = rx.findIndex((r) => norm(r.brandName) && norm(r.brandName) === norm(strip.brandName ?? ""));
    checks.salt = "warn"; warn("salt_unread");
    return { rxIndex: bi >= 0 ? bi : null, verdict: "check", checks, reasons };
  }
  sp.rel = sp.rel || strip.extendedRelease || isRel(strip.brandName ?? "");

  const rps = rx.map(parseRx);
  const same = rps.map((_, i) => i).filter((i) => rps[i].ing.join("|") === sp.ing.join("|"));
  if (!same.length) { // different salt: is it a look-alike of something prescribed, or not on the prescription at all?
    let best = -1, bestScore = 0;
    rps.forEach((p, i) => {
      const inter = p.ing.filter((x) => sp.ing.includes(x)).length;
      const score = inter / new Set([...p.ing, ...sp.ing]).size;
      if (inter > 0 && score > bestScore) { best = i; bestScore = score; }
    });
    checks.salt = "bad";
    if (best >= 0) bad("wrong_salt", sp.ing.join(" + "), rps[best].ing.join(" + ")); else bad("not_in_rx", sp.ing.join(" + "));
    return { rxIndex: best >= 0 ? best : null, verdict: "mismatch", checks, reasons };
  }
  const idx = same.find((i) => rps[i].pairs.join("|") === sp.pairs.join("|")) ?? same[0];
  const rp = rps[idx], r = rx[idx];
  checks.salt = "ok";

  if (!hasStrengths(sp)) { checks.strength = "warn"; warn("strength_unread"); }
  else if (!hasStrengths(rp)) { checks.strength = "warn"; warn("rx_no_strength"); }
  else if (sp.pairs.join("|") === rp.pairs.join("|")) checks.strength = "ok";
  else { checks.strength = "bad"; bad("wrong_strength", strip.composition, rxLabel(r)); }

  if (sp.rel !== rp.rel) { checks.release = "bad"; bad(sp.rel ? "wrong_release_sr" : "wrong_release_plain"); } else checks.release = "ok";
  if (!formOk(strip.form, r.form)) { checks.form = "bad"; bad("wrong_form", strip.form, r.form); } else checks.form = "ok";

  const end = expiryEnd(strip.expiry);
  if (!end) { checks.expiry = "warn"; warn("expiry_unread"); }
  else if (end < now) { checks.expiry = "bad"; bad("expired", fmtExp(end)); }
  else if (end.getTime() < now.getTime() + 90 * 86_400_000) { checks.expiry = "warn"; warn("expiring_soon", fmtExp(end)); }
  else checks.expiry = "ok";

  if (!strip.clearlyReadable) warn("low_read");
  if (asked != null && strip.printedMrp != null && asked > strip.printedMrp + 0.01) bad("over_mrp", String(asked), String(strip.printedMrp));
  return { rxIndex: idx, verdict: verdictOf(), checks, reasons };
}

export function summarize(rx: Rx[], results: StripResult[]) {
  const perRx = rx.map((_, i) => {
    const rs = results.filter((r) => r.rxIndex === i);
    if (!rs.length) return "pending" as const;
    if (rs.some((r) => r.verdict === "match")) return "match" as const;
    if (rs.some((r) => r.verdict === "check")) return "check" as const;
    return "mismatch" as const;
  });
  const overall: "none" | Verdict = !results.length ? "none" : results.some((r) => r.verdict === "mismatch") ? "mismatch" : results.some((r) => r.verdict === "check") ? "check" : "match";
  return { perRx, missing: perRx.filter((x) => x === "pending").length, overall };
}

export const parseAsk = (s?: string): number | null => { const n = Number((s ?? "").replace(/[^0-9.]/g, "")); return n > 0 && n < 100000 ? n : null; };
export const packUnits = (pack: string): number | null => { const m = pack.match(/^(\d+)\s*(?:tablets?|capsules?|['’]s)/i); return m ? +m[1] : null; };

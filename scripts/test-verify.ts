// Run: npm run test:verify  - checks the strip-vs-prescription verdicts. Every line must say PASS.
import { waNumber } from "../lib/phone";
import { matchStrip, summarize, tidyComposition, type Rx, type Strip } from "../lib/verify";
const NOW = new Date(2026, 9, 25); // 25 Oct 2026, fixed so the test never ages
const S = (o: Partial<Strip>): Strip => ({ brandName: null, composition: "Pantoprazole 40 mg", form: "tablet", extendedRelease: false, expiry: "08/2028", printedMrp: 12.47, packCount: 10, isJanAushadhi: true, clearlyReadable: true, ...o });
const RX: Rx[] = [
  { brandName: "Pan 40", genericSalt: "Pantoprazole", strength: "40mg", form: "tablet" },
  { brandName: "Glycomet", genericSalt: "Metformin Hydrochloride 500mg", strength: null, form: "tablet" },
  { brandName: "Zerodol-P", genericSalt: "Aceclofenac 100mg + Paracetamol 325mg", strength: null, form: "tablet" },
  { brandName: "Digene", genericSalt: "Aluminium hydroxide + magnesium hydroxide + simethicone", strength: null, form: "syrup" },
];
let fails = 0;
function t(name: string, strip: Partial<Strip>, want: string, asked: number | null = null, wantCode?: string) {
  const r = matchStrip(S(strip), RX, NOW, asked);
  const codes = r.reasons.map((x) => x.code).join(",");
  const ok = r.verdict === want && (!wantCode || codes.includes(wantCode));
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name.padEnd(44)} -> ${r.verdict.padEnd(8)} rx#${r.rxIndex} [${codes}]`);
}
t("exact match", {}, "match");
t("strength 20 mg vs 40 mg", { composition: "Pantoprazole 20 mg" }, "mismatch", null, "wrong_strength");
t("extra salt (Pantoprazole + Domperidone)", { composition: "Pantoprazole 40 mg + Domperidone 30 mg" }, "mismatch", null, "wrong_salt");
t("plain Paracetamol given instead of the combo", { composition: "Paracetamol 500 mg" }, "mismatch", null, "wrong_salt");
t("not on prescription at all (Cetirizine)", { composition: "Cetirizine 10 mg" }, "mismatch", null, "not_in_rx");
t("SR strip, plain prescribed", { composition: "Metformin 500 mg", extendedRelease: true }, "mismatch", null, "wrong_release_sr");
t("plain strip, plain prescribed (metformin)", { composition: "Metformin Hydrochloride IP 500 mg" }, "match");
t("combo, different order", { composition: "Paracetamol 325 mg + Aceclofenac 100 mg" }, "match");
t("combo, one strength wrong", { composition: "Aceclofenac 100 mg + Paracetamol 650 mg" }, "mismatch", null, "wrong_strength");
t("expired (01/2024)", { expiry: "01/2024" }, "mismatch", null, "expired");
t("expires this month (10/2026) is still valid", { expiry: "10/2026" }, "check", null, "expiring_soon");
t("expires in 2 months", { expiry: "12/2026" }, "check", null, "expiring_soon");
t("expiry month name 'AUG 2028'", { expiry: "AUG 2028" }, "match");
t("expiry 2-digit year '08/28'", { expiry: "08/28" }, "match");
t("expiry unreadable", { expiry: null }, "check", null, "expiry_unread");
t("strength unreadable on strip", { composition: "Pantoprazole" }, "check", null, "strength_unread");
t("blurry photo (not clearly readable)", { clearlyReadable: false }, "check", null, "low_read");
t("no composition read", { composition: null }, "check", null, "salt_unread");
t("wrong form (syrup vs tablet)", { form: "syrup" }, "mismatch", null, "wrong_form");
t("verbose composition text", { composition: "Each film coated tablet contains Pantoprazole Sodium IP eq. to Pantoprazole 40 mg" }, "match");
t("shopkeeper asks 20 > MRP 12.47", {}, "mismatch", 20, "over_mrp");
t("shopkeeper asks exactly MRP", {}, "match", 12.47);
t("antacid, no strengths on either side", { composition: "Aluminium Hydroxide + Magnesium Hydroxide + Simethicone", form: "syrup" }, "check", null, "strength_unread");
const rs = [matchStrip(S({}), RX, NOW), matchStrip(S({ composition: "Cetirizine 10 mg" }), RX, NOW)];
const sm = summarize(RX, rs);
const okSum = sm.overall === "mismatch" && sm.missing === 3 && sm.perRx[0] === "match";
if (!okSum) fails++;
console.log(`${okSum ? "PASS" : "FAIL"}  summary: ${JSON.stringify(sm)}`);
const PH: [string | null, string | null][] = [
  ["+91 98765 43210", "919876543210"], ["098765 43210", "919876543210"], ["9876543210", "919876543210"], ["+91 70123 45678", "917012345678"],
  ["+91 612 222 3344", null], ["0612 222 3344", null], ["0612 222", null], ["+91 6224 123456", null], ["1800-180-8080", null], [null, null],
];
for (const [inp, want] of PH) { const got = waNumber(inp); const ok = got === want; if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"}  whatsapp number ${String(inp).padEnd(18)} -> ${got}`); }
console.log(tidyComposition("Each tablet contains: Pantoprazole Sodium IP eq. to Pantoprazole 40 mg"));
console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);

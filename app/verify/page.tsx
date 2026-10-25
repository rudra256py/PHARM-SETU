"use client";
// Place at: app/verify/page.tsx  ->  website pe  /verify
// Step 2 of "Counter Safety": photograph the strips the chemist handed over, and compare them with the prescription.
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppHeader, Icon, LangBar } from "@/components/ui";
import { compressImage } from "@/lib/compress";
import { LANGS } from "@/lib/config";
import { findGeneric } from "@/lib/generic";
import { loadResult } from "@/lib/job";
import type { Lang } from "@/lib/types";
import { matchStrip, packUnits, parseAsk, rxLabel, summarize, type CheckKey, type Reason, type ReasonCode, type Rx, type Strip, type StripResult, type Verdict } from "@/lib/verify";

const T = {
  hi: {
    tag: "दुकान पर जाँचें", back: "नतीजे पर वापस", h1: "पट्टी जाँचें (काउंटर पर)",
    sub: "दुकान से मिली दवाई की पट्टी की फोटो लें। हम पर्ची से मिलाकर बताएँगे कि दवा (salt), मात्रा (mg) और एक्सपायरी सही है या नहीं।",
    rxTitle: "आपकी पर्ची की दवाइयाँ", pending: "जाँचना बाकी", take: "पट्टी की फोटो लें", pick: "गैलरी से चुनें", reading: "पट्टी पढ़ रहे हैं… (10-20 सेकंड)", addMore: "और पट्टी जोड़ें",
    noRx: "पहले पर्ची स्कैन करें, फिर पट्टी मिलाई जा सकेगी।", noRxBtn: "पर्ची स्कैन करें", strip: "पट्टी", matchedWith: "पर्ची की दवा:", listen: "सुनें", listenAll: "नतीजा सुनें",
    verdict: { match: "मिलान सही", check: "खुद जाँच लें", mismatch: "मेल नहीं खाता — सावधान" },
    status: { pending: "जाँचना बाकी", match: "सही", check: "ध्यान दें", mismatch: "गलत" },
    checks: { salt: "दवा (salt)", strength: "मात्रा (mg)", release: "SR/ER प्रकार", form: "रूप (गोली/सिरप)", expiry: "एक्सपायरी" },
    reason: {
      not_in_rx: "यह दवा ({a}) आपकी पर्ची में नहीं है।", wrong_salt: "पट्टी पर {a} है, पर्ची में {b} है। दवा (salt) अलग है।", wrong_strength: "पट्टी पर {a} है, पर्ची में {b} है। मात्रा अलग है।",
      wrong_release_sr: "पट्टी SR/ER (धीरे असर वाली) है, पर्ची में सामान्य दवा है।", wrong_release_plain: "पट्टी सामान्य है, पर्ची में SR/ER (धीरे असर वाली) दवा है।",
      wrong_form: "पट्टी का रूप ({a}) पर्ची ({b}) से अलग है।", expired: "यह दवा एक्सपायर हो चुकी है ({a})। इसे न लें।", over_mrp: "दुकानदार ने ₹{a} माँगा, पर पट्टी पर छपा MRP ₹{b} है। MRP से ज़्यादा लेना मना है।",
      expiring_soon: "जल्द एक्सपायर होगी ({a})। दूसरी पट्टी माँगें।", strength_unread: "पट्टी पर मात्रा साफ़ नहीं पढ़ी गई। खुद देखें।", rx_no_strength: "पर्ची में मात्रा लिखी नहीं है। डॉक्टर या दुकानदार से पूछें।",
      expiry_unread: "एक्सपायरी तारीख नहीं पढ़ी गई। खुद देखें।", low_read: "फोटो साफ़ नहीं है — नतीजा पक्का नहीं। साफ़ फोटो लें।", salt_unread: "पट्टी पर दवा का नाम/salt नहीं पढ़ा गया।",
    } as Record<ReasonCode, string>,
    allGood: "सभी पट्टियाँ आपकी पर्ची से मिलती हैं।", someCheck: "कुछ पट्टियाँ आपको खुद जाँचनी होंगी।", someBad: "सावधान! कम से कम एक पट्टी पर्ची से मेल नहीं खाती। पैसे देने से पहले दुकानदार से पूछें।",
    missing: "{n} दवा की पट्टी अभी जाँचनी बाकी है।", jaStrip: "जन औषधि की पट्टी", mrp: "छपा MRP: ₹{a}", perUnit: "₹{a} प्रति गोली; जन औषधि में ₹{b} प्रति गोली", jaPrice: "जन औषधि में इसी दवा का दाम ₹{a} ({b})",
    asked: "दुकानदार ने कितने रुपये माँगे? (वैकल्पिक)", disclaimer: "फोटो से AI पढ़ने में गलती कर सकता है। हरा निशान तभी आता है जब सब कुछ साफ़ पढ़ा गया और पर्ची से मिल गया। शक हो तो दवा लेने से पहले डॉक्टर या फार्मासिस्ट से पूछें।",
    errNotMed: "यह दवा की पट्टी की फोटो नहीं लगती। पट्टी को पास से, साफ़ रोशनी में खींचें।", errAI: "अभी पट्टी नहीं पढ़ पाए। थोड़ी देर बाद फिर कोशिश करें।", errLimit: "AI की सीमा पूरी हो गई। 1 मिनट बाद कोशिश करें।", errNet: "इंटरनेट की दिक्कत है। फिर कोशिश करें।",
  },
  bh: {
    tag: "दोकान पर जाँचीं", back: "नतीजा पर लौटीं", h1: "पट्टी जाँचीं (काउंटर पर)",
    sub: "दोकान से मिलल दवाई के पट्टी के फोटो लीं। हम पर्ची से मिलाके बताइब कि दवाई (salt), मात्रा (mg) आ एक्सपायरी ठीक बा कि ना।",
    rxTitle: "रउरा पर्ची के दवाई", pending: "जाँचल बाकी", take: "पट्टी के फोटो लीं", pick: "गैलरी से चुनीं", reading: "पट्टी पढ़त बानी… (10-20 सेकंड)", addMore: "आउर पट्टी जोड़ीं",
    noRx: "पहिले पर्ची स्कैन करीं, तब पट्टी मिलावल जाई।", noRxBtn: "पर्ची स्कैन करीं", strip: "पट्टी", matchedWith: "पर्ची के दवाई:", listen: "सुनीं", listenAll: "नतीजा सुनीं",
    verdict: { match: "मिलान ठीक बा", check: "अपने जाँच लीं", mismatch: "मेल नइखे खात — सावधान" },
    status: { pending: "जाँचल बाकी", match: "ठीक", check: "ध्यान दीं", mismatch: "गलत" },
    checks: { salt: "दवाई (salt)", strength: "मात्रा (mg)", release: "SR/ER किसिम", form: "रूप (गोली/सिरप)", expiry: "एक्सपायरी" },
    reason: {
      not_in_rx: "ई दवाई ({a}) रउरा पर्ची में नइखे।", wrong_salt: "पट्टी पर {a} बा, पर्ची में {b} बा। दवाई (salt) अलग बा।", wrong_strength: "पट्टी पर {a} बा, पर्ची में {b} बा। मात्रा अलग बा।",
      wrong_release_sr: "पट्टी SR/ER (धीरे असर वाला) बा, पर्ची में सामान्य दवाई बा।", wrong_release_plain: "पट्टी सामान्य बा, पर्ची में SR/ER (धीरे असर वाला) दवाई बा।",
      wrong_form: "पट्टी के रूप ({a}) पर्ची ({b}) से अलग बा।", expired: "ई दवाई एक्सपायर हो गइल बा ({a})। मत खाईं।", over_mrp: "दोकानदार ₹{a} माँगले, बाकिर पट्टी पर छपल MRP ₹{b} बा। MRP से ज़्यादा लेवल मना बा।",
      expiring_soon: "जल्दिए एक्सपायर होई ({a})। दोसर पट्टी माँगीं।", strength_unread: "पट्टी पर मात्रा साफ ना पढ़ाइल। अपने देखीं।", rx_no_strength: "पर्ची में मात्रा लिखल नइखे। डॉक्टर भा दोकानदार से पूछीं।",
      expiry_unread: "एक्सपायरी तारीख ना पढ़ाइल। अपने देखीं।", low_read: "फोटो साफ नइखे — नतीजा पक्का नइखे। साफ फोटो लीं।", salt_unread: "पट्टी पर दवाई के नाम/salt ना पढ़ाइल।",
    } as Record<ReasonCode, string>,
    allGood: "सब पट्टी रउरा पर्ची से मिलत बा।", someCheck: "कुछ पट्टी रउरा अपने जाँचे के पड़ी।", someBad: "सावधान! कम से कम एक पट्टी पर्ची से मेल नइखे खात। पइसा देवे से पहिले दोकानदार से पूछीं।",
    missing: "{n} दवाई के पट्टी अभी जाँचल बाकी बा।", jaStrip: "जन औषधि के पट्टी", mrp: "छपल MRP: ₹{a}", perUnit: "₹{a} प्रति गोली; जन औषधि में ₹{b} प्रति गोली", jaPrice: "जन औषधि में इहे दवाई के दाम ₹{a} ({b})",
    asked: "दोकानदार केतना रुपया माँगलस? (जरूरी नइखे)", disclaimer: "फोटो से AI पढ़े में गलती कर सकेला। हरा निशान तबे आवेला जब सब कुछ साफ पढ़ाइल आ पर्ची से मिलल। शक होखे त दवाई लेवे से पहिले डॉक्टर भा फार्मासिस्ट से पूछीं।",
    errNotMed: "ई दवाई के पट्टी के फोटो नइखे लागत। पट्टी के नजदीक से, साफ रोशनी में खींचीं।", errAI: "अभी पट्टी ना पढ़ पाइल। तनी देर बाद फेर कोशिश करीं।", errLimit: "AI के सीमा पूरा हो गइल। 1 मिनट बाद कोशिश करीं।", errNet: "इंटरनेट के दिक्कत बा। फेर कोशिश करीं।",
  },
  en: {
    tag: "Check at the counter", back: "Back to result", h1: "Verify strips (at the counter)",
    sub: "Take a photo of the strips the chemist gave you. We compare them with your prescription: salt, strength (mg) and expiry.",
    rxTitle: "Medicines in your prescription", pending: "Not checked yet", take: "Photo of the strips", pick: "Choose from gallery", reading: "Reading the strips… (10-20 seconds)", addMore: "Add another photo",
    noRx: "Scan your prescription first, then strips can be matched.", noRxBtn: "Scan prescription", strip: "Strip", matchedWith: "Prescribed:", listen: "Listen", listenAll: "Listen to result",
    verdict: { match: "Match", check: "Check yourself", mismatch: "Does NOT match — careful" },
    status: { pending: "Not checked", match: "OK", check: "Check", mismatch: "Wrong" },
    checks: { salt: "Medicine (salt)", strength: "Strength (mg)", release: "SR/ER type", form: "Form", expiry: "Expiry" },
    reason: {
      not_in_rx: "This medicine ({a}) is not in your prescription.", wrong_salt: "The strip has {a}; your prescription has {b}. Different salt.", wrong_strength: "The strip says {a}; your prescription says {b}. Different strength.",
      wrong_release_sr: "The strip is SR/ER (slow release); your prescription is for the normal version.", wrong_release_plain: "The strip is the normal version; your prescription is for SR/ER (slow release).",
      wrong_form: "The strip form ({a}) differs from the prescription ({b}).", expired: "This medicine has expired ({a}). Do not take it.", over_mrp: "The shop asked ₹{a} but the MRP printed on the strip is ₹{b}. Charging above MRP is not allowed.",
      expiring_soon: "Expires soon ({a}). Ask for a fresher strip.", strength_unread: "The strength on the strip could not be read. Check it yourself.", rx_no_strength: "The prescription does not state a strength. Ask the doctor or pharmacist.",
      expiry_unread: "The expiry date could not be read. Check it yourself.", low_read: "The photo is not clear, so this result is not certain. Take a clearer photo.", salt_unread: "The medicine name/salt on the strip could not be read.",
    } as Record<ReasonCode, string>,
    allGood: "All strips match your prescription.", someCheck: "Some strips need a manual check.", someBad: "Careful! At least one strip does not match your prescription. Ask the shopkeeper before you pay.",
    missing: "{n} prescribed medicine(s) not checked yet.", jaStrip: "Jan Aushadhi strip", mrp: "Printed MRP: ₹{a}", perUnit: "₹{a} per tablet; Jan Aushadhi price ₹{b} per tablet", jaPrice: "Jan Aushadhi price for this medicine: ₹{a} ({b})",
    asked: "How much did the shop ask? (optional)", disclaimer: "AI can misread a photo. Green appears only when everything was read clearly and matches the prescription. If in doubt, ask your doctor or pharmacist before taking the medicine.",
    errNotMed: "This does not look like a medicine strip. Take it closer, in good light.", errAI: "Could not read the strips right now. Please try again shortly.", errLimit: "AI limit reached. Try again in a minute.", errNet: "Network problem. Please try again.",
  },
};

type Stored = { b: string; s: string; f: string; t: string | null };
const fill = (s: string, a?: string, b?: string) => s.replace("{a}", a ?? "").replace("{b}", b ?? "");
const CHECKS: CheckKey[] = ["salt", "strength", "release", "form", "expiry"];

export default function VerifyPage() {
  const [lang, setLang] = useState<Lang>("hi");
  const [rx, setRx] = useState<Rx[]>([]);
  const [strips, setStrips] = useState<Strip[]>([]);
  const [asked, setAsked] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);
  const t = T[lang];

  useEffect(() => {
    try { const l = localStorage.getItem("ps_lang"); if (l === "hi" || l === "bh" || l === "en") setLang(l); } catch { /* ignore */ }
    try {
      const r = loadResult();
      if (r?.medicines?.length) setRx(r.medicines.map((m) => ({ brandName: m.brandName, genericSalt: m.genericSalt, strength: m.strength, form: m.form })));
      else {
        const raw = localStorage.getItem("ps_last");
        if (raw) setRx((JSON.parse(raw) as Stored[]).map((x) => ({ brandName: x.b, genericSalt: x.s, strength: x.t, form: x.f })));
      }
    } catch { /* page still works without a prescription (shows the "scan first" message) */ }
  }, []);
  useEffect(() => { try { localStorage.setItem("ps_lang", lang); } catch { /* ignore */ } }, [lang]);

  async function onFile(file?: File | null) {
    if (!file) return;
    setBusy(true); setErr("");
    try {
      const img = await compressImage(file, 1600, 500_000);
      const res = await fetch("/api/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64: img.base64, mimeType: img.mimeType }) });
      const j = await res.json();
      if (j.ok && Array.isArray(j.strips)) {
        if (!j.strips.length) setErr(t.errNotMed);
        else setStrips((s) => [...s, ...(j.strips as Strip[])]);
      } else setErr(j.code === "RATE_LIMIT" ? t.errLimit : t.errAI);
    } catch { setErr(t.errNet); }
    setBusy(false);
  }

  const results: StripResult[] = useMemo(() => strips.map((s, i) => matchStrip(s, rx, new Date(), parseAsk(asked[i]))), [strips, rx, asked]);
  const sum = useMemo(() => summarize(rx, results), [rx, results]);

  const bannerClass: Verdict = sum.overall === "mismatch" ? "mismatch" : sum.overall === "match" && sum.missing === 0 ? "match" : "check";
  const missingText = fill(t.missing, String(sum.missing));
  const overallText =
    sum.overall === "none" ? "" :
    sum.overall === "mismatch" ? t.someBad :
    sum.overall === "check" ? t.someCheck + (sum.missing ? " " + missingText : "") :
    sum.missing ? missingText : t.allGood;

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANGS.find((x) => x.code === lang)?.speechLang ?? "hi-IN";
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }
  const reasonLine = (r: Reason) => fill(t.reason[r.code] ?? "", r.a, r.b);

  function priceLines(s: Strip, r: StripResult): string[] {
    const out: string[] = [];
    if (s.isJanAushadhi) out.push(t.jaStrip);
    if (s.printedMrp != null) out.push(fill(t.mrp, String(s.printedMrp)));
    if (!s.isJanAushadhi && s.printedMrp != null && r.rxIndex !== null) {
      const m = rx[r.rxIndex];
      const ja = findGeneric({ brandName: m.brandName, genericSalt: m.genericSalt, form: m.form, strength: m.strength });
      if (ja) {
        const units = packUnits(ja.pack);
        if (units && s.packCount && s.packCount > 0 && (ja.form === "tablet" || ja.form === "capsule")) {
          const mine = s.printedMrp / s.packCount, theirs = ja.ja / units;
          if (mine > theirs + 0.005) out.push(fill(t.perUnit, mine.toFixed(2), theirs.toFixed(2)));
        } else out.push(fill(t.jaPrice, String(ja.ja), ja.pack));
      }
    }
    return out;
  }

  return (
    <>
      <AppHeader tag={t.tag} />
      <LangBar lang={lang} onChange={setLang} disabled={busy} />
      <main>
        <Link href="/result" className="backlink"><Icon name="back" size={20} /> {t.back}</Link>
        <h1>{t.h1}</h1>
        <p className="sub">{t.sub}</p>

        {rx.length === 0 ? (
          <div className="vcard check">
            <p className="vreason warn">{t.noRx}</p>
            <Link href="/" className="btn"><Icon name="camera" size={24} /> {t.noRxBtn}</Link>
          </div>
        ) : (
          <>
            <section className="vrx" aria-label={t.rxTitle}>
              <h2>{t.rxTitle}</h2>
              {rx.map((m, i) => (
                <div className="vrxrow" key={i}>
                  <span><Icon name="pill" size={18} /> {m.brandName ? `${m.brandName} · ` : ""}{rxLabel(m)}</span>
                  <em className={"vbadge " + sum.perRx[i]}>{t.status[sum.perRx[i]]}</em>
                </div>
              ))}
            </section>

            <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
            <input ref={galRef} type="file" accept="image/*" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
            <button className="btn" disabled={busy} onClick={() => camRef.current?.click()}><Icon name="camera" size={26} /> {strips.length ? t.addMore : t.take}</button>
            <button className="btn ghost" disabled={busy} onClick={() => galRef.current?.click()}><Icon name="image" size={24} /> {t.pick}</button>
            {busy && <p className="kbusy" aria-live="polite">{t.reading}</p>}
            {err && <p className="vreason bad" role="alert">{err}</p>}

            {sum.overall !== "none" && (
              <div className={"vbanner " + bannerClass} role="status">
                <Icon name="shield" size={34} />
                <p>{overallText}</p>
                <button className="vlisten" onClick={() => speak(overallText)}><Icon name="speaker" size={20} /> {t.listenAll}</button>
              </div>
            )}

            {strips.map((s, i) => {
              const r = results[i];
              if (!r) return null;
              const spoken = [t.verdict[r.verdict], ...r.reasons.map(reasonLine)].join(". ");
              return (
                <article key={i} className={"vcard " + r.verdict}>
                  <div className="vhead">
                    <span className="vshield"><Icon name={r.verdict === "match" ? "check" : r.verdict === "check" ? "alert" : "x"} size={26} /></span>
                    <div><b>{s.brandName || `${t.strip} ${i + 1}`}</b><small>{s.composition || "—"}{s.expiry ? ` · EXP ${s.expiry}` : ""}</small></div>
                    <span className="vtag">{t.verdict[r.verdict]}</span>
                  </div>
                  {r.rxIndex !== null && <p className="vwith">{t.matchedWith} <b>{rxLabel(rx[r.rxIndex])}</b></p>}
                  {r.rxIndex !== null && (
                    <ul className="vchecks">
                      {CHECKS.map((k) => (
                        <li key={k} className={r.checks[k] ?? "na"}>
                          <Icon name={r.checks[k] === "ok" ? "check" : r.checks[k] === "bad" ? "x" : "alert"} size={16} /> {t.checks[k]}
                        </li>
                      ))}
                    </ul>
                  )}
                  {r.reasons.map((x, j) => <p key={j} className={"vreason " + x.level}>{reasonLine(x)}</p>)}
                  {priceLines(s, r).map((x, j) => <p key={"p" + j} className="vprice">{x}</p>)}
                  <label className="gmrp">
                    <span>{t.asked}</span>
                    <input inputMode="decimal" placeholder="₹" value={asked[i] ?? ""} onChange={(e) => setAsked((a) => ({ ...a, [i]: e.target.value }))} />
                  </label>
                  <button className="vlisten" onClick={() => speak(spoken)}><Icon name="speaker" size={20} /> {t.listen}</button>
                </article>
              );
            })}
          </>
        )}
        <p className="knote">{t.disclaimer}</p>
      </main>
    </>
  );
}

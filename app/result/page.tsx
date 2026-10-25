"use client";
// Place at: app/result/page.tsx  ->  website pe /result
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppHeader, FormIcon, Icon, LangBar, PillBox } from "@/components/ui";
import { DEFAULT_LOCATION, LANGS, janAushadhiMapsUrl } from "@/lib/config";
import CallKendra, { type KendraItem } from "@/components/CallKendra";
import { findGeneric, type GenericEntry } from "@/lib/generic";
import { decodeJob, loadJob, loadResult, saveResult, updateJobLang, type StoredResult } from "@/lib/job";
import type { Lang, Medicine } from "@/lib/types";

const T = {
  hi: {
    tag: "आपकी पर्ची का नतीजा", found: "दवाइयाँ मिलीं", offline: "ऑफ़लाइन डेमो", listen: "सुनिए", listenAll: "सब सुनिए", wa: "WhatsApp पर भेजें",
    map: "पास का जन-औषधि केंद्र खोजें", written: "डॉक्टर ने लिखा", alerts: "सुरक्षा चक्र", safe: "हमारी जाँच में कोई ख़तरनाक मेल नहीं मिला",
    check: "साफ़ नहीं दिखा, डॉक्टर या फार्मासिस्ट से पूछें", note: "यह जानकारी समझने के लिए है, डॉक्टर की सलाह का विकल्प नहीं।",
    slots: ["सुबह", "दोपहर", "रात"], days: "दिन", food: { no_milk: "दूध के साथ नहीं", no_alcohol: "शराब बिल्कुल नहीं", avoid_driving: "गाड़ी न चलाएँ" },
    again: "नई पर्ची स्कैन करें", saveT: "इस पर्ची पर लगभग ₹{x} बचत हो सकती है", saveS: "अनुमानित · जन औषधि पर सस्ते विकल्प देखें",
    genT: "सस्ती (जेनरिक) दवाई खोजें", genS: "ब्रांड की जगह जन औषधि: वही salt, आम तौर पर 50-80% सस्ती", busy: "भाषा बदली जा रही है…", fail: "भाषा बदल नहीं पाई। दोबारा कोशिश करें।",
    forms: { tablet: "टैबलेट", capsule: "कैप्सूल", syrup: "सिरप", injection: "इंजेक्शन", ointment: "मरहम / क्रीम", drops: "ड्रॉप्स", other: "दवाई" },
  },
  bh: {
    tag: "रउवा पर्ची के नतीजा", found: "दवाई मिलल", offline: "ऑफ़लाइन डेमो", listen: "सुनीं", listenAll: "सब सुनीं", wa: "WhatsApp पर भेजीं",
    map: "नजदीक के जन-औषधि केंद्र खोजीं", written: "डॉक्टर लिखले बाड़न", alerts: "सुरक्षा चक्र", safe: "हमार जाँच में कौनो खतरनाक मेल ना मिलल",
    check: "साफ ना लउकल, डॉक्टर भा फार्मासिस्ट से पूछीं", note: "ई जानकारी समझे खातिर बा, डॉक्टर के सलाह के जगह ना ह।",
    slots: ["भोर", "दुपहरिया", "रात"], days: "दिन", food: { no_milk: "दूध के साथे ना", no_alcohol: "दारू बिल्कुल ना", avoid_driving: "गाड़ी मत चलाईं" },
    again: "नया पर्ची स्कैन करीं", saveT: "एह पर्ची पर लगभग ₹{x} बचत हो सकेला", saveS: "अनुमानित · जन औषधि पर सस्ता विकल्प देखीं",
    genT: "सस्ता (जेनरिक) दवाई खोजीं", genS: "ब्रांड के जगह जन औषधि: उहे salt, आमतौर पर 50-80% सस्ता", busy: "भाषा बदलल जा रहल बा…", fail: "भाषा ना बदलल। फेर से कोशिश करीं।",
    forms: { tablet: "टैबलेट", capsule: "कैप्सूल", syrup: "सिरप", injection: "सूई (इंजेक्शन)", ointment: "मलहम / क्रीम", drops: "ड्रॉप", other: "दवाई" },
  },
  en: {
    tag: "Your prescription result", found: "medicines found", offline: "Offline demo", listen: "Listen", listenAll: "Listen to all", wa: "Send on WhatsApp",
    map: "Find nearest Jan Aushadhi Kendra", written: "Doctor wrote", alerts: "Suraksha Chakra", safe: "No risky combination found in our checks",
    check: "Unclear, please confirm with a doctor or pharmacist", note: "This is for understanding only, not a substitute for medical advice.",
    slots: ["Morning", "Afternoon", "Night"], days: "days", food: { no_milk: "No milk", no_alcohol: "No alcohol", avoid_driving: "Do not drive" },
    again: "Scan a new prescription", saveT: "You could save about ₹{x} on this prescription", saveS: "Estimated · see cheaper Jan Aushadhi options",
    genT: "Find cheaper generic medicines", genS: "Jan Aushadhi instead of the brand: same salt, usually 50-80% cheaper", busy: "Changing language…", fail: "Could not change language. Please try again.",
    forms: { tablet: "Tablet", capsule: "Capsule", syrup: "Syrup", injection: "Injection", ointment: "Ointment / cream", drops: "Drops", other: "Medicine" },
  },
};

const GENBTN: Record<Lang, string> = { hi: "जेनेरिक दवा", bh: "जेनेरिक दवाई", en: "Generic medicine" };

const SUBST: Record<Lang, { title: string; save: string; none: string; code: string }> = {
  hi: { title: "जन औषधि में सस्ता विकल्प", save: "बचत", none: "इसका जन औषधि विकल्प नहीं मिला — केंद्र पर पूछें", code: "कोड" },
  bh: { title: "जन औषधि में सस्ता विकल्प", save: "बचत", none: "एकर जन औषधि विकल्प ना मिलल — केंद्र पर पूछीं", code: "कोड" },
  en: { title: "Cheaper Jan Aushadhi substitute", save: "You save", none: "No Jan Aushadhi match found — ask at the Kendra", code: "code" },
};

// Same salt + same strength at Jan Aushadhi, shown automatically for every prescribed medicine.
function Subst({ e, lang }: { e: GenericEntry | null; lang: Lang }) {
  const s = SUBST[lang];
  if (!e) return <p className="subst none">{s.none}</p>;
  const amt = e.approx ? Math.max(0, e.approx - e.ja) : 0;
  const pct = e.approx ? Math.round((amt / e.approx) * 100) : 0;
  return (
    <div className="subst">
      <small>{s.title}</small>
      <b>{e.name}</b>
      <div className="srow">
        <strong>₹{e.ja}</strong>
        <span>{e.pack} · {s.code} #{e.code}</span>
        {e.approx ? <em>{s.save} ≈ ₹{amt} ({pct}%)</em> : null}
      </div>
    </div>
  );
}

const TIMING: Record<Lang, Record<Medicine["timing"], string>> = {
  hi: { empty_stomach: "खाली पेट", before_food: "खाने से पहले", with_food: "खाने के साथ", after_food: "खाने के बाद", any: "कभी भी" },
  bh: { empty_stomach: "खाली पेट", before_food: "खाए से पहिले", with_food: "खाए के साथे", after_food: "खाए के बाद", any: "कबो" },
  en: { empty_stomach: "Empty stomach", before_food: "Before food", with_food: "With food", after_food: "After food", any: "Anytime" },
};

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<StoredResult | null>(null);
  const [lang, setLang] = useState<Lang>("hi");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const topRef = useRef<HTMLElement | null>(null);
  const t = T[lang];

  useEffect(() => {
    const r = loadResult();
    if (!r) { router.replace("/"); return; }
    setResult(r);
    setLang(r.lang);
  }, [router]);

  const saving = useMemo(() => {
    if (!result) return null;
    let brand = 0, ja = 0, n = 0;
    for (const m of result.medicines) {
      const e = findGeneric({ brandName: m.brandName, genericSalt: m.genericSalt, form: m.form, strength: m.strength });
      if (e && e.approx && e.approx > e.ja) { brand += e.approx; ja += e.ja; n++; }
    }
    return n ? { amt: Math.round(brand - ja), n } : null;
  }, [result]);

  // Jan Aushadhi substitute for each prescribed medicine (same salt + strength), and what to tell the Kendra on the phone
  const gens = useMemo(() => (result ? result.medicines.map((m) => findGeneric({ brandName: m.brandName, genericSalt: m.genericSalt, form: m.form, strength: m.strength })) : []), [result]);
  const kendraItems: KendraItem[] = useMemo(
    () => (result ? result.medicines.map((m, i) => (gens[i] ? { name: gens[i]!.name, code: gens[i]!.code } : { name: m.genericSalt || m.brandName })) : []),
    [result, gens]
  );

  // Bhasha badalne par wahi photo dobara usi bhasha me padhi jati hai (offline demo me turant)
  async function changeLang(l: Lang) {
    if (l === lang || busy) return;
    const job = loadJob();
    if (!job) { setLang(l); return; }
    setBusy(true); setNotice("");
    updateJobLang(l);
    const r = await decodeJob({ ...job, lang: l });
    if (r.ok) {
      saveResult(r.data); setResult(r.data); setLang(l);
      try { localStorage.setItem("ps_lang", l); } catch { /* ignore */ }
    } else {
      updateJobLang(lang);
      setNotice(T[l].fail);
    }
    setBusy(false);
  }

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANGS.find((x) => x.code === lang)?.speechLang ?? "hi-IN";
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }

  function listenAll() {
    if (!result) return;
    speak([result.summarySpeech, ...result.alerts.map((a) => a.message), ...result.medicines.map((m) => m.speech)].filter(Boolean).join(" ... "));
  }

  function shareWA() {
    if (!result) return;
    const pad = (n: number) => (n > 0 ? String(n) : "❌");
    const meds = result.medicines
      .map((m, i) => `${i + 1}. *${m.brandName}* ${m.strength ?? ""}\n🌅 ${pad(m.schedule.morning)}   ☀️ ${pad(m.schedule.afternoon)}   🌙 ${pad(m.schedule.night)}  — ${TIMING[lang][m.timing]}\n${m.purpose}`)
      .join("\n\n");
    const al = result.alerts.length ? `\n\n⚠️ *${t.alerts}*\n` + result.alerts.map((a) => `• ${a.message}`).join("\n") : "";
    window.open("https://wa.me/?text=" + encodeURIComponent(`💊 *PHARM SETU*\n\n${meds}${al}\n\n_${t.note}_`), "_blank");
  }

  function openMap() {
    const go = (lat: number, lng: number) => window.open(janAushadhiMapsUrl(lat, lng), "_blank");
    if (!navigator.geolocation) return go(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng);
    navigator.geolocation.getCurrentPosition(
      (p) => go(p.coords.latitude, p.coords.longitude),
      () => go(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng),
      { timeout: 6000 }
    );
  }

  if (!result) return <AppHeader tag="PHARM SETU" />;

  return (
    <>
      <AppHeader tag={t.tag} />
      <LangBar lang={lang} onChange={changeLang} disabled={busy} />

      <main style={{ paddingBottom: 110 }}>
        <section className="res" ref={topRef} aria-busy={busy}>
          <div className="reshead">
            <h2>{result.medicines.length} {t.found}</h2>
            {result.offline && <span className="badge">{t.offline}</span>}
          </div>
          {busy && <p className="langbusy" role="status">{t.busy}</p>}
          {notice && <p className="check" role="alert">{notice}</p>}

          {result.alerts.length > 0 ? (
            <div className="alerts" role="alert">
              <div className="ahead"><Icon name="shield" size={28} /><h3>{t.alerts}</h3></div>
              {result.alerts.map((a, i) => (
                <div key={i} className="alert"><Icon name="alert" size={22} /><p>{a.message}</p></div>
              ))}
            </div>
          ) : (
            <div className="safe"><Icon name="shield" size={26} /><p>{t.safe}</p></div>
          )}

          <Link href="/generic" className="gencta">
            <Icon name="rupee" size={28} />
            <div>
              <b>{saving ? t.saveT.replace("{x}", String(saving.amt)) : t.genT}</b>
              <small>{saving ? t.saveS : t.genS}</small>
            </div>
            <Icon name="chev" size={22} />
          </Link>

          {result.medicines.map((m, i) => (
            <article className="med" key={i}>
              <div className="medhead">
                <FormIcon form={m.form} size={64} />
                <div className="mt">
                  <h3>{m.brandName}{m.strength && <span className="str"> {m.strength}</span>}</h3>
                  <p className="salt">{m.genericSalt}</p>
                  <span className="formchip">{t.forms[m.form] ?? t.forms.other}</span>
                </div>
                <button className="listen" onClick={() => speak(m.speech)} aria-label={t.listen}>
                  <Icon name="speaker" size={24} /><span>{t.listen}</span>
                </button>
              </div>
              <p className="purpose">{m.purpose}</p>
              <PillBox schedule={m.schedule} labels={t.slots} />
              <div className="meta">
                <span className="tag"><Icon name="clock" size={16} />{TIMING[lang][m.timing]}</span>
                {m.durationDays ? <span className="tag">{m.durationDays} {t.days}</span> : null}
                {m.foodWarnings.map((f) => <span className="tag warn" key={f}>{t.food[f]}</span>)}
              </div>
              <p className="sig"><b>{t.written}:</b> {m.sigExplained}</p>
              {m.needsCheck && <p className="check">{t.check}</p>}
              <Subst e={gens[i] ?? null} lang={lang} />
              <Link href={`/generic?m=${i}`} className="gmed">
                <Icon name="rupee" size={22} />
                <b>{GENBTN[lang]}</b>
                {gens[i] && <small>₹{gens[i]!.ja}</small>}
                <Icon name="chev" size={20} />
              </Link>
            </article>
          ))}

          <CallKendra lang={lang} items={kendraItems} />
          <button className="btn map" onClick={openMap}><Icon name="pin" size={24} /><span>{t.map}</span></button>
          <Link href="/" className="btn ghost"><Icon name="camera" size={24} /><span>{t.again}</span></Link>
        </section>
      </main>

      <footer>
        <p>{t.note}</p>
        <p>PHARM SETU</p>
      </footer>

      <div className="bar">
        <button className="l" onClick={listenAll}><Icon name="speaker" size={24} />{t.listenAll}</button>
        <button className="w" onClick={shareWA}><Icon name="chat" size={24} />{t.wa}</button>
      </div>
    </>
  );
}

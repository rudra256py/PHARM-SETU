"use client";
// Place at: app/generic/page.tsx   ->  website pe  /generic
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FormIcon, Icon, Logo } from "@/components/ui";
import { DEFAULT_LOCATION, LANGS, janAushadhiMapsUrl } from "@/lib/config";
import { findGeneric, saving, searchGeneric, type GenericEntry } from "@/lib/generic";
import type { Lang } from "@/lib/types";

const T = {
  hi: {
    tag: "सस्ती दवाई, वही असर", back: "पर्ची पढ़ें", h1: "सस्ती (जेनरिक) दवाई खोजें",
    sub: "ब्रांड की जगह जन औषधि: वही salt, वही मात्रा, कम दाम।", ph: "दवाई का नाम लिखें या बोलें (जैसे Pantocid)", mic: "बोलकर खोजें", listening: "सुन रहे हैं…",
    yours: "आपकी पर्ची की दवाइयाँ", total: "कुल अनुमानित बचत", of: "ब्रांड भाव लगभग", pays: "जन औषधि पर", cheaper: "सस्ती",
    brand: "ब्रांड भाव (अनुमानित)", ja: "जन औषधि भाव", save: "बचत", enter: "अपने पत्ते का असली MRP डालें", same: "वही salt", code: "केंद्र पर यह नाम/कोड बताएँ",
    none: "इसका जन औषधि विकल्प हमारी सूची में अभी नहीं मिला। अपने फार्मासिस्ट से पूछें।", nores: "कोई मेल नहीं मिला। दूसरा नाम आज़माएँ।", care: "यह दवाई संवेदनशील है: बिना डॉक्टर से पूछे ब्रांड न बदलें।",
    trustH: "इस पर भरोसा क्यों?", map: "सबसे पास जन औषधि केंद्र", official: "आधिकारिक जानकारी: janaushadhi.gov.in", askDoc: "दवाई बदलने से पहले अपने डॉक्टर या फार्मासिस्ट से ज़रूर पूछें।",
    disc: "जन औषधि भाव PMBI की सूची (अगस्त 2026) से हैं और बदल सकते हैं। ब्रांड भाव अनुमानित हैं।", pack: "पैक", empty: "अपनी पर्ची पहले पढ़वाएँ, या ऊपर दवाई का नाम खोजें।",
    trust: [
      "सरकारी योजना: प्रधानमंत्री भारतीय जनऔषधि परियोजना (PMBJP), फार्मास्युटिकल्स विभाग, भारत सरकार।",
      "वही salt, वही मात्रा: ब्रांड और जेनरिक में असली दवा एक ही होती है। फ़र्क़ कंपनी के नाम, पैकिंग और विज्ञापन के खर्च का है।",
      "WHO-GMP प्रमाणित निर्माताओं से ख़रीद।",
      "हर बैच NABL-मान्यता प्राप्त प्रयोगशाला की जाँच के बाद ही केंद्रों तक पहुँचता है।",
      "भारतीय फार्माकोपिया (IP) मानक, और भारत के औषधि नियामक (CDSCO) के नियमों के तहत लाइसेंस-प्राप्त निर्माण।",
    ],
  },
  bh: {
    tag: "सस्ता दवाई, उहे असर", back: "पर्ची पढ़ीं", h1: "सस्ता (जेनरिक) दवाई खोजीं",
    sub: "ब्रांड के जगह जन औषधि: उहे salt, उहे मात्रा, कम दाम।", ph: "दवाई के नाम लिखीं भा बोलीं (जइसे Pantocid)", mic: "बोल के खोजीं", listening: "सुनत बानी…",
    yours: "रउवा पर्ची के दवाई", total: "कुल अनुमानित बचत", of: "ब्रांड भाव लगभग", pays: "जन औषधि पर", cheaper: "सस्ता",
    brand: "ब्रांड भाव (अनुमानित)", ja: "जन औषधि भाव", save: "बचत", enter: "आपन पत्ता के असली MRP डालीं", same: "उहे salt", code: "केंद्र पर ई नाम/कोड बताईं",
    none: "एकर जन औषधि विकल्प हमनी के सूची में अबहीं ना मिलल। फार्मासिस्ट से पूछीं।", nores: "कुछ ना मिलल। दोसर नाम आजमाईं।", care: "ई दवाई संवेदनशील बा: डॉक्टर से पूछले बिना ब्रांड मत बदलीं।",
    trustH: "एह पर भरोसा काहे?", map: "सबसे नजदीक जन औषधि केंद्र", official: "आधिकारिक जानकारी: janaushadhi.gov.in", askDoc: "दवाई बदले से पहिले आपन डॉक्टर भा फार्मासिस्ट से जरूर पूछीं।",
    disc: "जन औषधि भाव PMBI के सूची (अगस्त 2026) के बा आ बदल सकेला। ब्रांड भाव अनुमानित बा।", pack: "पैक", empty: "पहिले आपन पर्ची पढ़वाईं, भा ऊपर दवाई के नाम खोजीं।",
    trust: [
      "सरकारी योजना: प्रधानमंत्री भारतीय जनऔषधि परियोजना (PMBJP), फार्मास्युटिकल्स विभाग, भारत सरकार।",
      "उहे salt, उहे मात्रा: ब्रांड आ जेनरिक में असली दवाई एके होला। फरक कंपनी के नाम, पैकिंग आ विज्ञापन के खरचा के बा।",
      "WHO-GMP प्रमाणित निर्माता से खरीद।",
      "हर बैच NABL-मान्यता प्राप्त प्रयोगशाला के जाँच के बाद ही केंद्र तक पहुँचेला।",
      "भारतीय फार्माकोपिया (IP) मानक, आ भारत के औषधि नियामक (CDSCO) के नियम के तहत लाइसेंस-प्राप्त निर्माण।",
    ],
  },
  en: {
    tag: "Cheaper medicine, same effect", back: "Read prescription", h1: "Find cheaper generic medicines",
    sub: "Jan Aushadhi instead of the brand: same salt, same strength, lower price.", ph: "Type or say a medicine name (e.g. Pantocid)", mic: "Search by voice", listening: "Listening…",
    yours: "Medicines from your prescription", total: "Estimated total saving", of: "Brand price about", pays: "At Jan Aushadhi", cheaper: "cheaper",
    brand: "Brand price (approx.)", ja: "Jan Aushadhi price", save: "Saving", enter: "Enter the real MRP from your strip", same: "Same salt", code: "Tell this name/code at the Kendra",
    none: "No Jan Aushadhi equivalent in our list yet. Please ask your pharmacist.", nores: "No match found. Try another name.", care: "Sensitive medicine: do not switch brands without asking your doctor.",
    trustH: "Why can you trust it?", map: "Nearest Jan Aushadhi Kendra", official: "Official information: janaushadhi.gov.in", askDoc: "Always ask your doctor or pharmacist before switching a medicine.",
    disc: "Jan Aushadhi prices are from the PMBI list (Aug 2026) and can change. Brand prices are approximate.", pack: "Pack", empty: "Scan your prescription first, or search a medicine name above.",
    trust: [
      "Government scheme: Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP), Department of Pharmaceuticals, Govt. of India.",
      "Same salt, same strength: the active medicine in brand and generic is the same. The difference is the company name, packaging and marketing cost.",
      "Procured from WHO-GMP certified manufacturers.",
      "Every batch is tested at an NABL-accredited laboratory before it reaches the Kendras.",
      "Indian Pharmacopoeia (IP) standards, made by licensed manufacturers under India's drug regulator (CDSCO) rules.",
    ],
  },
};

type Row = { key: string; label: string; entry: GenericEntry | null };
type Rec = {
  lang: string; interimResults: boolean; onend: () => void; onerror: () => void; start: () => void;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
};

const rupee = (n: number) => "₹" + (Math.round(n * 100) / 100).toFixed(n % 1 === 0 ? 0 : 2);

function GenCard({ e, label, t, mrp, setMrp }: { e: GenericEntry; label: string; t: (typeof T)["hi"]; mrp: string; setMrp: (v: string) => void }) {
  const entered = parseFloat(mrp);
  const brand = entered > 0 ? entered : e.approx;
  const s = brand ? saving(brand, e.ja) : null;
  return (
    <article className="gcard">
      <div className="gtop">
        <div className="gleft"><FormIcon form={e.form} size={52} /><span className="gbrand">{label}</span></div>
        <span className="gsame"><Icon name="check" size={16} /> {t.same}</span>
      </div>
      <div className="gcmp">
        <div className="gold">
          <small>{t.brand}</small>
          <b>{brand ? rupee(brand) : "—"}</b>
        </div>
        <Icon name="chev" size={22} />
        <div className="gnew">
          <small>{t.ja}</small>
          <b>{rupee(e.ja)}</b>
          <em>{t.pack}: {e.pack}</em>
        </div>
      </div>
      {s && s.amt > 0 && (
        <div className="gsave"><Icon name="rupee" size={22} /> {t.save}: <b>{rupee(s.amt)}</b> <span>({s.pct}% {t.cheaper})</span></div>
      )}
      <label className="gmrp">
        <span>{t.enter}</span>
        <input inputMode="decimal" placeholder="₹" value={mrp} onChange={(ev) => setMrp(ev.target.value.replace(/[^0-9.]/g, ""))} />
      </label>
      <p className="gname"><Icon name="pill" size={16} /> {e.name} <i>· {t.code}: #{e.code}</i></p>
      {e.care && <p className="gcare"><Icon name="alert" size={18} /> {t.care}</p>}
    </article>
  );
}

export default function GenericPage() {
  const [lang, setLang] = useState<Lang>("hi");
  const [q, setQ] = useState("");
  const [meds, setMeds] = useState<{ b: string; s: string; f?: string }[]>([]);
  const [mrps, setMrps] = useState<Record<string, string>>({});
  const [listening, setListening] = useState(false);
  const [canVoice, setCanVoice] = useState(false);
  const t = T[lang];

  useEffect(() => {
    try {
      const l = localStorage.getItem("ps_lang");
      if (l === "hi" || l === "bh" || l === "en") setLang(l);
      const raw = localStorage.getItem("ps_last");
      if (raw) setMeds(JSON.parse(raw));
    } catch { /* storage band ho to bhi page chalega */ }
    const w = window as unknown as { webkitSpeechRecognition?: unknown; SpeechRecognition?: unknown };
    setCanVoice(Boolean(w.webkitSpeechRecognition || w.SpeechRecognition));
  }, []);
  useEffect(() => { try { localStorage.setItem("ps_lang", lang); } catch { /* ignore */ } }, [lang]);

  const rx: Row[] = useMemo(
    () => meds.map((m, i) => ({ key: `rx${i}`, label: m.b || m.s, entry: findGeneric({ brandName: m.b, genericSalt: m.s, form: m.f }) })),
    [meds]
  );
  const found = useMemo(() => searchGeneric(q), [q]);

  const totals = useMemo(() => {
    let brand = 0, ja = 0, n = 0;
    for (const r of rx) {
      if (!r.entry) continue;
      const entered = parseFloat(mrps[r.key] ?? "");
      const b = entered > 0 ? entered : r.entry.approx;
      if (b && b > r.entry.ja) { brand += b; ja += r.entry.ja; n++; }
    }
    return { brand, ja, n, amt: brand - ja, pct: brand ? Math.round(((brand - ja) / brand) * 100) : 0 };
  }, [rx, mrps]);

  function voice() {
    const w = window as unknown as { webkitSpeechRecognition?: new () => Rec; SpeechRecognition?: new () => Rec };
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = "en-IN"; // brand naam (Pantocid, Dolo...) English me behtar pakde jaate hain
    r.interimResults = false;
    r.onresult = (e) => setQ(e.results[0][0].transcript);
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    setListening(true);
    r.start();
  }

  function openMap() {
    const go = (lat: number, lng: number) => window.open(janAushadhiMapsUrl(lat, lng), "_blank");
    if (!navigator.geolocation) return go(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng);
    navigator.geolocation.getCurrentPosition((p) => go(p.coords.latitude, p.coords.longitude), () => go(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng), { timeout: 6000 });
  }

  const unmatched = rx.filter((r) => !r.entry);

  return (
    <>
      <header className="top">
        <div className="brand">
          <Logo size={44} />
          <div className="wm"><b>PHARM <i>SETU</i></b><small>{t.tag}</small></div>
        </div>
      </header>

      <div className="segwrap">
        <div className="seg" role="tablist" aria-label="Language">
          {LANGS.map((l) => (
            <button key={l.code} role="tab" aria-selected={lang === l.code} className={lang === l.code ? "on" : ""} onClick={() => setLang(l.code)}>{l.label}</button>
          ))}
        </div>
      </div>

      <main>
        <Link href="/" className="backlink"><Icon name="back" size={20} /> {t.back}</Link>
        <h1>{t.h1}</h1>
        <p className="sub">{t.sub}</p>

        <div className="gsearch">
          <Icon name="search" size={22} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.ph} aria-label={t.ph} />
          {canVoice && (
            <button className={"gmic" + (listening ? " live" : "")} onClick={voice} aria-label={t.mic} title={listening ? t.listening : t.mic}>
              <Icon name="mic" size={22} />
            </button>
          )}
        </div>

        {q.trim().length >= 3 && (
          <section>
            {found.length === 0 && <p className="gnone">{t.nores}</p>}
            {found.map((e) => (
              <GenCard key={e.code} e={e} label={e.brands[0] ? e.brands[0].replace(/\b\w/g, (c) => c.toUpperCase()) : e.name} t={t} mrp={mrps["s" + e.code] ?? ""} setMrp={(v) => setMrps((p) => ({ ...p, ["s" + e.code]: v }))} />
            ))}
          </section>
        )}

        {rx.length > 0 ? (
          <section>
            <h2 className="miniH">{t.yours}</h2>
            {totals.n > 0 && (
              <div className="gtotal">
                <small>{t.total}</small>
                <b>{rupee(totals.amt)}</b>
                <span>{t.of} {rupee(totals.brand)} → {t.pays} {rupee(totals.ja)} ({totals.pct}% {t.cheaper})</span>
              </div>
            )}
            {rx.map((r) =>
              r.entry ? (
                <GenCard key={r.key} e={r.entry} label={r.label} t={t} mrp={mrps[r.key] ?? ""} setMrp={(v) => setMrps((p) => ({ ...p, [r.key]: v }))} />
              ) : null
            )}
            {unmatched.map((r) => (
              <p key={r.key} className="gunm"><Icon name="alert" size={18} /> <b>{r.label}</b>: {t.none}</p>
            ))}
          </section>
        ) : (
          q.trim().length < 3 && <p className="gempty">{t.empty}</p>
        )}

        <section className="gtrust">
          <h2 className="miniH"><Icon name="shield" size={22} /> {t.trustH}</h2>
          <ul>
            {t.trust.map((x, i) => (
              <li key={i}><Icon name="check" size={20} /><span>{x}</span></li>
            ))}
          </ul>
          <a className="glink" href="https://janaushadhi.gov.in" target="_blank" rel="noopener noreferrer">{t.official}</a>
        </section>

        <button className="btn map" onClick={openMap}><Icon name="pin" size={26} /><span>{t.map}</span></button>
        <p className="gwarn"><Icon name="alert" size={18} /> {t.askDoc}</p>
        <p className="note">{t.disc}</p>
      </main>
    </>
  );
}

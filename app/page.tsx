"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon, Logo, PillBox, ScanArt } from "@/components/ui";
import { compressImage } from "@/lib/compress";
import { DEFAULT_LOCATION, LANGS, janAushadhiMapsUrl } from "@/lib/config";
import { SAMPLES, buildFallback, renderSample } from "@/lib/samples";
import type { DecodeResponse, DecodeSuccess, Lang, Medicine } from "@/lib/types";

type Mode = "prescription" | "strip";

const T = {
  hi: {
    tag: "पर्ची समझिए, पैसा बचाइए", h1: "पर्ची की फोटो खींचिए, दवाई समझिए", sub: "अपनी भाषा में पढ़िए, बोलकर सुनिए, सस्ती दवाई खोजिए।",
    tip: "पर्ची सीधी रखें और रोशनी में साफ़ फोटो लें।", rx: "डॉक्टर की पर्ची", strip: "दवाई का पत्ता", cam: "पर्ची की फोटो खींचें", gal: "गैलरी से चुनें",
    demoTitle: "फोटो नहीं है? डेमो पर्ची आज़माइए", trust: ["बिना लॉगिन", "बोलकर सुनाए", "WhatsApp पर भेजें"],
    loading: "पर्ची पढ़ी जा रही है…", errTitle: "पर्ची नहीं पढ़ पाए", tech: "तकनीकी जानकारी", offline: "ऑफ़लाइन डेमो", found: "दवाइयाँ मिलीं",
    listen: "सुनिए", listenAll: "सब सुनिए", wa: "WhatsApp पर भेजें", map: "पास का जन-औषधि केंद्र खोजें", written: "डॉक्टर ने लिखा",
    alerts: "सुरक्षा चक्र", safe: "हमारी जाँच में कोई ख़तरनाक मेल नहीं मिला", check: "साफ़ नहीं दिखा, डॉक्टर या फार्मासिस्ट से पूछें",
    note: "यह जानकारी समझने के लिए है, डॉक्टर की सलाह का विकल्प नहीं।", slots: ["सुबह", "दोपहर", "रात"], days: "दिन",
    food: { no_milk: "दूध के साथ नहीं", no_alcohol: "शराब बिल्कुल नहीं", avoid_driving: "गाड़ी न चलाएँ" },
    netErr: "इंटरनेट या सर्वर में दिक्कत है। दोबारा कोशिश करें।",
  },
  bh: {
    tag: "पर्ची समझीं, पइसा बचाईं", h1: "पर्ची के फोटो खींचीं, दवाई समझीं", sub: "अपना भाषा में पढ़ीं, बोलके सुनीं, सस्ता दवाई खोजीं।",
    tip: "पर्ची सीधा राखीं आ अँजोर में साफ फोटो लीं।", rx: "डॉक्टर के पर्ची", strip: "दवाई के पत्ता", cam: "पर्ची के फोटो खींचीं", gal: "गैलरी से चुनीं",
    demoTitle: "फोटो नइखे? डेमो पर्ची आजमाईं", trust: ["बिना लॉगिन", "बोलके सुनावे", "WhatsApp पर भेजीं"],
    loading: "पर्ची पढ़ल जा रहल बा…", errTitle: "पर्ची पढ़ ना पइनी", tech: "तकनीकी जानकारी", offline: "ऑफ़लाइन डेमो", found: "दवाई मिलल",
    listen: "सुनीं", listenAll: "सब सुनीं", wa: "WhatsApp पर भेजीं", map: "नजदीक के जन-औषधि केंद्र खोजीं", written: "डॉक्टर लिखले बाड़न",
    alerts: "सुरक्षा चक्र", safe: "हमार जाँच में कौनो खतरनाक मेल ना मिलल", check: "साफ ना लउकल, डॉक्टर भा फार्मासिस्ट से पूछीं",
    note: "ई जानकारी समझे खातिर बा, डॉक्टर के सलाह के जगह ना ह।", slots: ["भोर", "दुपहरिया", "रात"], days: "दिन",
    food: { no_milk: "दूध के साथे ना", no_alcohol: "दारू बिल्कुल ना", avoid_driving: "गाड़ी मत चलाईं" },
    netErr: "इंटरनेट भा सर्वर में दिक्कत बा। फेर से कोशिश करीं।",
  },
  en: {
    tag: "Understand your prescription, save money", h1: "Photograph your prescription, understand your medicines", sub: "Read it in your language, listen to it, find cheaper alternatives.",
    tip: "Keep the paper flat and take a clear photo in good light.", rx: "Prescription", strip: "Medicine strip", cam: "Take a photo", gal: "Choose from gallery",
    demoTitle: "No photo handy? Try a demo prescription", trust: ["No login", "Reads aloud", "Share on WhatsApp"],
    loading: "Reading your prescription…", errTitle: "Could not read it", tech: "Technical details", offline: "Offline demo", found: "medicines found",
    listen: "Listen", listenAll: "Listen to all", wa: "Send on WhatsApp", map: "Find nearest Jan Aushadhi Kendra", written: "Doctor wrote",
    alerts: "Suraksha Chakra", safe: "No risky combination found in our checks", check: "Unclear, please confirm with a doctor or pharmacist",
    note: "This is for understanding only, not a substitute for medical advice.", slots: ["Morning", "Afternoon", "Night"], days: "days",
    food: { no_milk: "No milk", no_alcohol: "No alcohol", avoid_driving: "Do not drive" },
    netErr: "Internet or server problem. Please try again.",
  },
};

const TIMING: Record<Lang, Record<Medicine["timing"], string>> = {
  hi: { empty_stomach: "खाली पेट", before_food: "खाने से पहले", with_food: "खाने के साथ", after_food: "खाने के बाद", any: "कभी भी" },
  bh: { empty_stomach: "खाली पेट", before_food: "खाए से पहिले", with_food: "खाए के साथे", after_food: "खाए के बाद", any: "कबो" },
  en: { empty_stomach: "Empty stomach", before_food: "Before food", with_food: "With food", after_food: "After food", any: "Anytime" },
};

const VERSION = "0.3";

const GENCTA: Record<Lang, { t: string; s: string }> = {
  hi: { t: "सस्ती (जेनरिक) दवाई खोजें", s: "ब्रांड की जगह जन औषधि: वही salt, आम तौर पर 50-80% सस्ती" },
  bh: { t: "सस्ता (जेनरिक) दवाई खोजीं", s: "ब्रांड के जगह जन औषधि: उहे salt, आमतौर पर 50-80% सस्ता" },
  en: { t: "Find cheaper generic medicines", s: "Jan Aushadhi instead of the brand: same salt, usually 50-80% cheaper" },
};

export default function Home() {
  const [lang, setLang] = useState<Lang>("hi");
  const [mode, setMode] = useState<Mode>("prescription");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DecodeSuccess | null>(null);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState("");
  const lastFile = useRef<File | null>(null);
  const lastSample = useRef<number | null>(null);
  const resRef = useRef<HTMLElement | null>(null);
  const t = T[lang];

  useEffect(() => {
    if (result) resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);

  useEffect(() => {
    try {
      const l = localStorage.getItem("ps_lang");
      if (l === "hi" || l === "bh" || l === "en") setLang(l);
    } catch { /* ignore */ }
  }, []);
  useEffect(() => { try { localStorage.setItem("ps_lang", lang); } catch { /* ignore */ } }, [lang]);
  useEffect(() => {
    if (!result) return;
    try { localStorage.setItem("ps_last", JSON.stringify(result.medicines.map((m) => ({ b: m.brandName, s: m.genericSalt, f: m.form })))); } catch { /* ignore */ }
  }, [result]);

  async function run(file: File, l: Lang, m: Mode, sample: number | null) {
    setLoading(true); setError(""); setDetail(""); setResult(null); setOffline(false);
    const useFallback = () => {
      const fb = sample !== null ? buildFallback(SAMPLES[sample].id, l) : null;
      if (fb) { setResult(fb); setOffline(true); return true; }
      return false;
    };
    try {
      const { base64, mimeType } = await compressImage(file);
      const res = await fetch("/api/decode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType, lang: l, mode: m }),
      });
      const json = (await res.json()) as DecodeResponse & { detail?: string };
      if (json.ok) setResult(json);
      else if (!useFallback()) { setError(json.message); setDetail(json.detail ?? ""); }
    } catch {
      if (!useFallback()) setError(T[l].netErr);
    } finally {
      setLoading(false);
    }
  }

  function onFile(f?: File | null) {
    if (!f) return;
    lastFile.current = f; lastSample.current = null;
    run(f, lang, mode, null);
  }

  async function runDemo(i: number) {
    try {
      const f = await renderSample(SAMPLES[i]);
      lastFile.current = f; lastSample.current = i;
      run(f, lang, "prescription", i);
    } catch {
      setError(t.netErr);
    }
  }

  function changeLang(l: Lang) {
    setLang(l);
    if (!lastFile.current) return;
    const s = lastSample.current;
    if (offline && s !== null) { const fb = buildFallback(SAMPLES[s].id, l); if (fb) setResult(fb); return; } // offline demo: turant, bina AI
    run(lastFile.current, l, mode, s);
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
      () => go(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng), // location na mile to CUSB
      { timeout: 6000 }
    );
  }

  const demoChips = (
    <div className="chips">
      {SAMPLES.map((sm, i) => (
        <button key={sm.id} className="chip" onClick={() => runDemo(i)} disabled={loading}>
          <Icon name="doc" size={24} />
          <span>{sm.title[lang]}</span>
        </button>
      ))}
    </div>
  );

  return (
    <>
      <header className="top">
        <div className="brand">
          <Logo size={44} />
          <div className="wm">
            <b>PHARM <i>SETU</i></b>
            <small>{t.tag}</small>
          </div>
        </div>
      </header>

      <div className="segwrap">
        <div className="seg" role="tablist" aria-label="Language">
          {LANGS.map((l) => (
            <button key={l.code} role="tab" aria-selected={lang === l.code} className={lang === l.code ? "on" : ""} onClick={() => changeLang(l.code)}>{l.label}</button>
          ))}
        </div>
      </div>

      <main style={{ paddingBottom: result ? 110 : 32 }}>
        <section>
          <h1>{t.h1}</h1>
          <p className="sub">{t.sub}</p>
          <Link href="/generic" className="gencta">
            <Icon name="rupee" size={28} />
            <div><b>{GENCTA[lang].t}</b><small>{GENCTA[lang].s}</small></div>
            <Icon name="chev" size={22} />
          </Link>

          <div className="scan">
            <div className="scanTop">
              <ScanArt />
              <p className="tip">{t.tip}</p>
            </div>
            <div className="modes">
              <button className={mode === "prescription" ? "on" : ""} onClick={() => setMode("prescription")}>{t.rx}</button>
              <button className={mode === "strip" ? "on" : ""} onClick={() => setMode("strip")}>{t.strip}</button>
            </div>
            <label className="btn primary">
              <Icon name="camera" size={28} /><span>{t.cam}</span>
              <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
            </label>
            <label className="btn ghost">
              <Icon name="image" size={26} /><span>{t.gal}</span>
              <input type="file" accept="image/*" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
            </label>
          </div>
        </section>

        {!result && (
          <>
            <section className="demo">
              <h2>{t.demoTitle}</h2>
              {demoChips}
            </section>
            <section className="trust">
              <div><Icon name="shield" size={26} />{t.trust[0]}</div>
              <div><Icon name="speaker" size={26} />{t.trust[1]}</div>
              <div><Icon name="chat" size={26} />{t.trust[2]}</div>
            </section>
          </>
        )}

        {loading && (
          <div className="loadcard" role="status">
            <ScanArt loop />
            <span>{t.loading}</span>
          </div>
        )}

        {error && (
          <div className="errcard" role="alert">
            <Icon name="alert" size={28} />
            <div>
              <h3>{t.errTitle}</h3>
              <p>{error}</p>
              {detail && <details><summary>{t.tech}</summary><code>{detail}</code></details>}
              <h2 className="miniH">{t.demoTitle}</h2>
              {demoChips}
            </div>
          </div>
        )}

        {result && (
          <section className="res" ref={resRef}>
            <div className="reshead">
              <h2>{result.medicines.length} {t.found}</h2>
              {offline && <span className="badge">{t.offline}</span>}
            </div>

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

            {result.medicines.map((m, i) => (
              <article className="med" key={i}>
                <div className="medhead">
                  <div>
                    <h3>{m.brandName}{m.strength && <span className="str"> {m.strength}</span>}</h3>
                    <p className="salt">{m.genericSalt}</p>
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
              </article>
            ))}

            <button className="btn map" onClick={openMap}><Icon name="pin" size={24} /><span>{t.map}</span></button>
          </section>
        )}
      </main>

      <footer>
        <p>{t.note}</p>
        <p>PHARM SETU, version {VERSION}</p>
      </footer>

      {result && (
        <div className="bar">
          <button className="l" onClick={listenAll}><Icon name="speaker" size={24} />{t.listenAll}</button>
          <button className="w" onClick={shareWA}><Icon name="chat" size={24} />{t.wa}</button>
        </div>
      )}
    </>
  );
}

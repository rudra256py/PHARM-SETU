"use client";
// Place at: app/page.tsx  (Home: sirf photo lena. Scan alag page /scan, result alag page /result)
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader, Icon, LangBar, ScanArt } from "@/components/ui";
import { compressImage } from "@/lib/compress";
import { saveJob, type Mode } from "@/lib/job";
import { SAMPLES, renderSample } from "@/lib/samples";
import type { Lang } from "@/lib/types";

const T = {
  hi: {
    tag: "पर्ची समझिए, पैसा बचाइए", h1: "पर्ची की फोटो खींचिए, दवाई समझिए", sub: "अपनी भाषा में पढ़िए, बोलकर सुनिए, सस्ती दवाई खोजिए।",
    tip: "पर्ची सीधी रखें और रोशनी में साफ़ फोटो लें।", rx: "डॉक्टर की पर्ची", strip: "दवाई का पत्ता", cam: "पर्ची की फोटो खींचें", gal: "गैलरी से चुनें",
    demoTitle: "फोटो नहीं है? डेमो पर्ची आज़माइए", trust: ["बिना लॉगिन", "बोलकर सुनाए", "WhatsApp पर भेजें"],
    note: "यह जानकारी समझने के लिए है, डॉक्टर की सलाह का विकल्प नहीं।", err: "फोटो तैयार नहीं हो पाई। दोबारा कोशिश करें।", busy: "फोटो तैयार हो रही है…",
  },
  bh: {
    tag: "पर्ची समझीं, पइसा बचाईं", h1: "पर्ची के फोटो खींचीं, दवाई समझीं", sub: "अपना भाषा में पढ़ीं, बोलके सुनीं, सस्ता दवाई खोजीं।",
    tip: "पर्ची सीधा राखीं आ अँजोर में साफ फोटो लीं।", rx: "डॉक्टर के पर्ची", strip: "दवाई के पत्ता", cam: "पर्ची के फोटो खींचीं", gal: "गैलरी से चुनीं",
    demoTitle: "फोटो नइखे? डेमो पर्ची आजमाईं", trust: ["बिना लॉगिन", "बोलके सुनावे", "WhatsApp पर भेजीं"],
    note: "ई जानकारी समझे खातिर बा, डॉक्टर के सलाह के जगह ना ह।", err: "फोटो तैयार ना हो पाइल। फेर से कोशिश करीं।", busy: "फोटो तैयार होता…",
  },
  en: {
    tag: "Understand your prescription, save money", h1: "Photograph your prescription, understand your medicines", sub: "Read it in your language, listen to it, find cheaper alternatives.",
    tip: "Keep the paper flat and take a clear photo in good light.", rx: "Prescription", strip: "Medicine strip", cam: "Take a photo", gal: "Choose from gallery",
    demoTitle: "No photo handy? Try a demo prescription", trust: ["No login", "Reads aloud", "Share on WhatsApp"],
    note: "This is for understanding only, not a substitute for medical advice.", err: "Could not prepare the photo. Please try again.", busy: "Preparing photo…",
  },
};

const GENCTA: Record<Lang, { t: string; s: string }> = {
  hi: { t: "सस्ती (जेनरिक) दवाई खोजें", s: "ब्रांड की जगह जन औषधि: वही salt, आम तौर पर 50-80% सस्ती" },
  bh: { t: "सस्ता (जेनरिक) दवाई खोजीं", s: "ब्रांड के जगह जन औषधि: उहे salt, आमतौर पर 50-80% सस्ता" },
  en: { t: "Find cheaper generic medicines", s: "Jan Aushadhi instead of the brand: same salt, usually 50-80% cheaper" },
};

export default function Home() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("hi");
  const [mode, setMode] = useState<Mode>("prescription");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const t = T[lang];

  useEffect(() => {
    try {
      const l = localStorage.getItem("ps_lang");
      if (l === "hi" || l === "bh" || l === "en") setLang(l);
    } catch { /* ignore */ }
  }, []);
  useEffect(() => { try { localStorage.setItem("ps_lang", lang); } catch { /* ignore */ } }, [lang]);

  // Photo chhoti karke job banata hai, phir /scan page par bhej deta hai
  async function start(file: File, m: Mode, sample: number | null) {
    setBusy(true); setError("");
    try {
      const { base64, mimeType } = await compressImage(file);
      saveJob({ imageBase64: base64, mimeType, lang, mode: m, sample });
      router.push("/scan");
    } catch {
      setError(t.err);
      setBusy(false);
    }
  }

  async function runDemo(i: number) {
    try {
      await start(await renderSample(SAMPLES[i]), "prescription", i);
    } catch {
      setError(t.err);
    }
  }

  const onPick = (f?: File | null) => { if (f) start(f, mode, null); };

  return (
    <>
      <AppHeader tag={t.tag} />
      <LangBar lang={lang} onChange={setLang} />

      <main>
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
              <Icon name="camera" size={28} /><span>{busy ? t.busy : t.cam}</span>
              <input type="file" accept="image/*" capture="environment" hidden disabled={busy} onChange={(e) => { onPick(e.target.files?.[0]); e.target.value = ""; }} />
            </label>
            <label className="btn ghost">
              <Icon name="image" size={26} /><span>{t.gal}</span>
              <input type="file" accept="image/*" hidden disabled={busy} onChange={(e) => { onPick(e.target.files?.[0]); e.target.value = ""; }} />
            </label>
            {error && <p className="check" role="alert">{error}</p>}
          </div>
        </section>

        <section className="demo">
          <h2>{t.demoTitle}</h2>
          <div className="chips">
            {SAMPLES.map((sm, i) => (
              <button key={sm.id} className="chip" onClick={() => runDemo(i)} disabled={busy}>
                <Icon name="doc" size={24} />
                <span>{sm.title[lang]}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="trust">
          <div><Icon name="shield" size={26} />{t.trust[0]}</div>
          <div><Icon name="speaker" size={26} />{t.trust[1]}</div>
          <div><Icon name="chat" size={26} />{t.trust[2]}</div>
        </section>
      </main>

      <footer>
        <p>{t.note}</p>
        <p>PHARM SETU</p>
      </footer>
    </>
  );
}

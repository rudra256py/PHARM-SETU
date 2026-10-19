"use client";
import { useRef, useState } from "react";
import { compressImage } from "@/lib/compress";
import { DEFAULT_LOCATION, LANGS, janAushadhiMapsUrl } from "@/lib/config";
import type { DecodeResponse, DecodeSuccess, Lang, Medicine } from "@/lib/types";

const T = {
  hi: { camera: "📸 पर्ची / दवाई की फोटो खींचें", gallery: "🖼️ गैलरी से चुनें", rx: "डॉक्टर की पर्ची", strip: "दवाई का पत्ता", loading: "पढ़ रहे हैं… कृपया रुकें", listen: "🔊 सुनिए", map: "📍 सबसे पास जन-औषधि केंद्र देखें", alerts: "सुरक्षा चक्र", check: "साफ़ नहीं दिखा — डॉक्टर/फार्मासिस्ट से पुष्टि करें", note: "यह जानकारी समझने के लिए है, डॉक्टर की सलाह का विकल्प नहीं।", slots: ["🌅 सुबह", "☀️ दोपहर", "🌙 रात"], days: "दिन", found: "दवाइयाँ मिलीं" },
  bh: { camera: "📸 पर्ची / दवाई के फोटो खींचीं", gallery: "🖼️ गैलरी से चुनीं", rx: "डॉक्टर के पर्ची", strip: "दवाई के पत्ता", loading: "पढ़त बानी… तनी रुकीं", listen: "🔊 सुनीं", map: "📍 सबसे नजदीक जन-औषधि केंद्र देखीं", alerts: "सुरक्षा चक्र", check: "साफ ना लउकल — डॉक्टर/फार्मासिस्ट से पूछीं", note: "ई जानकारी समझे खातिर बा, डॉक्टर के सलाह के जगह ना ह।", slots: ["🌅 भोर", "☀️ दुपहरिया", "🌙 रात"], days: "दिन", found: "दवाई मिलल" },
  en: { camera: "📸 Take photo of prescription / medicine", gallery: "🖼️ Choose from gallery", rx: "Prescription", strip: "Medicine strip", loading: "Reading… please wait", listen: "🔊 Listen", map: "📍 Find nearest Jan Aushadhi Kendra", alerts: "Suraksha Chakra", check: "Unclear — confirm with doctor/pharmacist", note: "This is for understanding only, not a substitute for medical advice.", slots: ["🌅 Morning", "☀️ Afternoon", "🌙 Night"], days: "days", found: "medicines found" },
};

const TIMING: Record<Lang, Record<Medicine["timing"], string>> = {
  hi: { empty_stomach: "खाली पेट", before_food: "खाने से पहले", with_food: "खाने के साथ", after_food: "खाने के बाद", any: "कभी भी" },
  bh: { empty_stomach: "खाली पेट", before_food: "खाए से पहिले", with_food: "खाए के साथे", after_food: "खाए के बाद", any: "कबो" },
  en: { empty_stomach: "Empty stomach", before_food: "Before food", with_food: "With food", after_food: "After food", any: "Anytime" },
};

const FOOD: Record<string, string> = { no_milk: "🥛❌", no_alcohol: "🍺❌", avoid_driving: "🚗❌" };

export default function Home() {
  const [lang, setLang] = useState<Lang>("hi");
  const [mode, setMode] = useState<"prescription" | "strip">("prescription");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DecodeSuccess | null>(null);
  const [error, setError] = useState("");
  const lastFile = useRef<File | null>(null);
  const t = T[lang];

  async function run(file: File, l: Lang, m: "prescription" | "strip") {
    setLoading(true); setError(""); setResult(null);
    try {
      const { base64, mimeType } = await compressImage(file);
      const res = await fetch("/api/decode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType, lang: l, mode: m }),
      });
      const json: DecodeResponse = await res.json();
      if (json.ok) setResult(json); else setError(json.message);
    } catch {
      setError("Internet ya server me dikkat hai. Dobara try karein.");
    } finally {
      setLoading(false);
    }
  }

  function onFile(f?: File | null) {
    if (!f) return;
    lastFile.current = f;
    run(f, lang, mode);
  }

  function changeLang(l: Lang) {
    setLang(l);
    if (lastFile.current) run(lastFile.current, l, mode); // nayi bhasha me dobara samjhao
  }

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANGS.find((x) => x.code === lang)?.speechLang ?? "hi-IN";
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
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

  return (
    <main>
      <header className="top">
        <b>🌉 PHARM SETU</b>
        <div className="pills">
          {LANGS.map((l) => (
            <button key={l.code} className={lang === l.code ? "on" : ""} onClick={() => changeLang(l.code)}>{l.label}</button>
          ))}
        </div>
      </header>

      <section className="hero">
        <div className="pills">
          <button className={mode === "prescription" ? "on" : ""} onClick={() => setMode("prescription")}>{t.rx}</button>
          <button className={mode === "strip" ? "on" : ""} onClick={() => setMode("strip")}>{t.strip}</button>
        </div>
        <label className="big green">{t.camera}
          <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        <label className="big teal">{t.gallery}
          <input type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
      </section>

      {loading && <p className="msg">⏳ {t.loading}</p>}
      {error && <p className="msg err">{error}</p>}

      {result && (
        <section>
          <p className="msg">{result.medicines.length} {t.found}</p>
          {result.alerts.length > 0 && (
            <div className="card red">
              <h3>⚠️ {t.alerts}</h3>
              {result.alerts.map((a, i) => (
                <p key={i}>{a.severity === "high" ? "🛑" : "⚠️"} {a.message} {a.icons.join(" ")}</p>
              ))}
            </div>
          )}
          {result.medicines.map((m, i) => (
            <div className="card" key={i}>
              <h3>{m.brandName} <small>{m.strength ?? ""}</small></h3>
              <p className="salt">{m.genericSalt}</p>
              <p>{m.purpose}</p>
              <div className="slots">
                {[m.schedule.morning, m.schedule.afternoon, m.schedule.night].map((n, k) => (
                  <span key={k}>{t.slots[k]}<b>{n > 0 ? ` ${n}` : " ❌"}</b></span>
                ))}
              </div>
              <p><b>{TIMING[lang][m.timing]}</b>{m.durationDays ? ` • ${m.durationDays} ${t.days}` : ""} {m.foodWarnings.map((f) => FOOD[f]).join(" ")}</p>
              <p className="sig">{m.sigOriginal ? `${m.sigOriginal} → ` : ""}{m.sigExplained}</p>
              {m.needsCheck && <p className="warn">⚠️ {t.check}</p>}
              <button className="voice" onClick={() => speak(m.speech)}>{t.listen}</button>
            </div>
          ))}
          <button className="big teal" onClick={openMap}>{t.map}</button>
          <p className="note">{t.note}</p>
        </section>
      )}
    </main>
  );
}

"use client";
// Place at: app/scan/page.tsx  ->  website pe /scan
// Is page par sirf scanning animation dikhti hai. AI ka kaam khatam hote hi apne aap /result khul jata hai.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppHeader, Icon } from "@/components/ui";
import { decodeJob, loadJob, saveResult, type Job } from "@/lib/job";

const T = {
  hi: {
    tag: "पर्ची पढ़ी जा रही है", title: "आपकी पर्ची स्कैन हो रही है",
    steps: ["फोटो साफ़ की जा रही है", "दवाइयों के नाम पढ़े जा रहे हैं", "खुराक और समय समझा जा रहा है", "सुरक्षा चक्र: दवाइयों का मेल जाँचा जा रहा है", "आपके लिए नतीजा तैयार हो रहा है"],
    tips: ["जन औषधि की दवाइयाँ आम तौर पर 50-80% तक सस्ती होती हैं।", "दवाई हमेशा डॉक्टर के बताए समय और मात्रा में ही लें।", "ब्रांड और जेनरिक दवाई में असली दवा (salt) एक ही होती है।"],
    errTitle: "पर्ची नहीं पढ़ पाए", tech: "तकनीकी जानकारी", retry: "फिर से कोशिश करें", back: "वापस जाएँ और डेमो आज़माएँ", wait: "कृपया रुकें…",
  },
  bh: {
    tag: "पर्ची पढ़ल जा रहल बा", title: "रउवा पर्ची स्कैन हो रहल बा",
    steps: ["फोटो साफ कइल जा रहल बा", "दवाई के नाम पढ़ल जा रहल बा", "खुराक आ समय समझल जा रहल बा", "सुरक्षा चक्र: दवाई के मेल जाँचल जा रहल बा", "रउवा खातिर नतीजा तैयार होता"],
    tips: ["जन औषधि के दवाई आमतौर पर 50-80% तक सस्ता होला।", "दवाई हमेशा डॉक्टर के बतावल समय आ मात्रा में खाईं।", "ब्रांड आ जेनरिक में असली दवाई (salt) एके होला।"],
    errTitle: "पर्ची पढ़ ना पइनी", tech: "तकनीकी जानकारी", retry: "फेर से कोशिश करीं", back: "पीछे जाईं आ डेमो आजमाईं", wait: "तनी रुकीं…",
  },
  en: {
    tag: "Reading your prescription", title: "Scanning your prescription",
    steps: ["Cleaning up the photo", "Reading medicine names", "Understanding dose and timing", "Suraksha Chakra: checking medicine combinations", "Preparing your result"],
    tips: ["Jan Aushadhi medicines are usually 50-80% cheaper.", "Always take medicines at the time and dose your doctor advised.", "Brand and generic medicines contain the same active salt."],
    errTitle: "Could not read it", tech: "Technical details", retry: "Try again", back: "Go back and try a demo", wait: "Please wait…",
  },
};

const MIN_SHOW_MS = 1400; // animation itni der zaroor dikhe, chahe AI jaldi de de

export default function ScanPage() {
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [step, setStep] = useState(0);
  const [tip, setTip] = useState(0);
  const [err, setErr] = useState<{ message: string; detail?: string } | null>(null);
  const started = useRef(false);
  const lang = job?.lang ?? "hi";
  const t = T[lang];

  const run = useCallback((j: Job) => {
    setErr(null); setStep(0);
    const t0 = Date.now();
    const tick = setInterval(() => setStep((s) => Math.min(s + 1, 2)), 850);
    decodeJob(j).then(async (r) => {
      const wait = Math.max(0, MIN_SHOW_MS - (Date.now() - t0));
      await new Promise((res) => setTimeout(res, wait));
      clearInterval(tick);
      if (r.ok) {
        setStep(3); // Suraksha Chakra step: shown only now, when the AI has really finished (the rule check itself takes <1 ms)
        await new Promise((res) => setTimeout(res, 600));
        saveResult(r.data);
        setStep(5);
        setTimeout(() => router.replace("/result"), 600);
      } else {
        setErr({ message: r.message, detail: r.detail });
      }
    });
  }, [router]);

  useEffect(() => {
    const j = loadJob();
    if (!j) { router.replace("/"); return; }
    setJob(j);
    if (started.current) return;
    started.current = true;
    run(j);
  }, [router, run]);

  useEffect(() => {
    const id = setInterval(() => setTip((x) => (x + 1) % 3), 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <AppHeader tag={t.tag} />
      <main className="scanpage">
        <h1>{t.title}</h1>

        <div className={"rxframe" + (err ? " stopped" : "")}>
          {job && /* eslint-disable-next-line @next/next/no-img-element */ <img src={`data:${job.mimeType};base64,${job.imageBase64}`} alt="" />}
          <div className="rxbeam" />
          <i className="c tl" /><i className="c tr" /><i className="c bl" /><i className="c br" />
        </div>

        {!err && (
          <>
            <ol className="steps" aria-live="polite">
              {t.steps.map((s, i) => (
                <li key={i} className={i < step ? "done" : i === step ? "now" : ""}>
                  <span className="dot">{i < step ? <Icon name="check" size={16} /> : null}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            <p className="tipbox">{t.tips[tip]}</p>
          </>
        )}

        {err && (
          <div className="errcard" role="alert">
            <Icon name="alert" size={28} />
            <div>
              <h3>{t.errTitle}</h3>
              <p>{err.message}</p>
              {err.detail && <details><summary>{t.tech}</summary><code>{err.detail}</code></details>}
              <div className="erract">
                <button className="btn primary" onClick={() => job && run(job)}><span>{t.retry}</span></button>
                <Link href="/" className="btn ghost"><span>{t.back}</span></Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

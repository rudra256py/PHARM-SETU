// Place at: lib/samples.ts
// Demo parchi browser me hi canvas par bante hain – repo me koi image upload nahi karni.
// Ye parchi AI ke asli pipeline se guzarti hai (Gemini Vision), sirf photo apne aap ban jati hai.
import type { Lang } from "./types";
 
export type Sample = {
  id: string;
  title: Record<Lang, string>;
  patient: string;
  lines: string[];
};
 
export const SAMPLES: Sample[] = [
  {
    id: "s1",
    title: { hi: "डेमो 1: एंटीबायोटिक + गैस की दवा", bh: "डेमो 1: एंटीबायोटिक + गैस के दवाई", en: "Demo 1: Antibiotic + antacid" },
    patient: "Ram Kumar, 58 M",
    lines: [
      "1) Tab. Azithromycin 500 mg", "      1 OD x 3 days (PC)",
      "2) Tab. Pantoprazole 40 mg", "      1 OD x 5 days (AC, empty stomach)",
      "3) Syp. Digene (antacid) 10 ml", "      TDS x 5 days (PC)",
      "4) Tab. Paracetamol 500 mg", "      1 SOS for fever (max 3/day)",
    ],
  },
  {
    id: "s2",
    title: { hi: "डेमो 2: दर्द की दो दवा + पेट का इन्फेक्शन", bh: "डेमो 2: दर्द के दू दवाई + पेट के इन्फेक्शन", en: "Demo 2: Two painkillers + stomach infection" },
    patient: "Sunil Yadav, 34 M",
    lines: [
      "1) Tab. Diclofenac 50 mg", "      1 BD x 5 days (PC)",
      "2) Tab. Ibuprofen 400 + Paracetamol 325", "      1 TDS x 3 days (PC)",
      "3) Cap. Omeprazole 20 mg", "      1 OD x 5 days (AC)",
      "4) Tab. Metronidazole 400 mg", "      1 TDS x 5 days (PC)",
    ],
  },
  {
    id: "s3",
    title: { hi: "डेमो 3: बुज़ुर्ग – BP और शुगर", bh: "डेमो 3: बुजुर्ग – BP आ शुगर", en: "Demo 3: Elderly – BP & sugar" },
    patient: "Sita Devi, 62 F",
    lines: [
      "1) Tab. Amlodipine 5 mg", "      1 OD morning, continue",
      "2) Tab. Metformin 500 mg", "      1 BD (PC), continue",
      "3) Tab. Atorvastatin 10 mg", "      1 HS, continue",
      "4) Tab. Aspirin 75 mg", "      1 OD (PC), continue",
    ],
  },
];
 
export async function renderSample(s: Sample): Promise<File> {
  const W = 900, H = 1000;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  if (!g) throw new Error("Canvas available nahi hai");
 
  g.fillStyle = "#fffdf5"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#1e293b";
  g.font = "bold 34px Georgia, serif";
  g.fillText("Dr. R. K. Sinha, MBBS, MD (Medicine)", 40, 70);
  g.font = "20px Georgia, serif";
  g.fillText("SAMPLE PRESCRIPTION FOR DEMO - NOT REAL", 40, 104);
  g.fillText(`Patient: ${s.patient}        Date: 19/10/2026`, 40, 150);
  g.fillRect(40, 168, W - 80, 2);
  g.font = "bold 60px Georgia, serif";
  g.fillText("Rx", 40, 250);
 
  g.font = "30px 'Courier New', monospace";
  s.lines.forEach((line, i) => g.fillText(line, 60, 320 + i * 62 + Math.floor(i / 2) * 18));
 
  g.font = "italic 24px Georgia, serif";
  g.fillText("Dr. R. K. Sinha", W - 300, H - 70);
 
  const blob: Blob = await new Promise((res, rej) =>
    c.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/jpeg", 0.9)
  );
  return new File([blob], `${s.id}.jpg`, { type: "image/jpeg" });
}
 

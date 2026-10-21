// Place at: lib/generic.ts
// Jan Aushadhi (PMBJP) generic dawaiyon ka database.
//  - code / name / pack / ja  = PMBI product list se (list August 2026 tak; roz badalti hai).
//    Demo se pehle janaushadhi.gov.in pe 4-5 daam ek baar match kar lena.
//  - approx = branded dawai ka ANUMANIT bazaar bhaav (usi pack ke liye). Ye pakka daam NAHI hai –
//    UI me "anumanit" likha aata hai aur user apne patte ka asli MRP daal sakta hai. Demo se pehle 1mg/PharmEasy se check karo.
import type { Medicine } from "./types";

export type Form = "tablet" | "capsule" | "syrup";

export type GenericEntry = {
  code: number; // Jan Aushadhi drug code (kendra pe batane ke kaam aata hai)
  name: string; // Jan Aushadhi ki list me dawai ka official naam
  form: Form;
  pack: string;
  ja: number; // Jan Aushadhi MRP (₹) is pack ka
  r: RegExp; // genericSalt (lowercase) se match
  brands: string[]; // jaane-pehchane brand naam (search ke liye)
  approx: number | null; // branded dawai ka anumanit daam (₹), same pack
  care?: boolean; // brand/generic badalne se pehle doctor se zaroor pooche
};

export const GENERICS: GenericEntry[] = [
  { code: 212, name: "Pantoprazole Gastro Resistant Tablets IP 40 mg", form: "tablet", pack: "10's", ja: 12.47, r: /pantoprazole\D*40/, brands: ["pantocid", "pan 40", "pan-40", "pantop", "pantodac"], approx: 130 },
  { code: 206, name: "Omeprazole 20mg and Domperidone 10mg Capsules IP", form: "capsule", pack: "10's", ja: 11.34, r: /omeprazole.*domperidone|domperidone.*omeprazole/, brands: ["omez d", "omez-d"], approx: null },
  { code: 207, name: "Omeprazole Gastro-resistant Capsules IP 20 mg", form: "capsule", pack: "10's", ja: 10.21, r: /^(?!.*domperidone).*omeprazole\D*20/, brands: ["omez", "omee", "ocid"], approx: 55 },
  { code: 215, name: "Rabeprazole Gastro Resistant Tablets IP 20 mg", form: "tablet", pack: "10's", ja: 9.08, r: /^(?!.*domperidone).*rabeprazole\D*20/, brands: ["razo", "rabekind", "rablet"], approx: 100 },
  { code: 186, name: "Domperidone Tablets IP 10 mg", form: "tablet", pack: "10's", ja: 4.54, r: /^(?!.*(omeprazole|rabeprazole|pantoprazole)).*domperidone/, brands: ["domstal", "vomistop"], approx: 35 },
  { code: 209, name: "Ondansetron Tablets IP 4 mg", form: "tablet", pack: "10's", ja: 6.81, r: /ondansetron\D*4(?!\d)/, brands: ["emeset", "ondem", "zofer"], approx: 35 },
  { code: 188, name: "Dried Aluminium Hydroxide 250mg, Magnesium Hydroxide 250mg and Activated Dimethicone 50mg Tablets", form: "tablet", pack: "10's", ja: 6.19, r: /(aluminium|aluminum).*magnesium/, brands: ["digene", "gelusil", "mucaine"], approx: 20 },
  { code: 198, name: "Dried Aluminium Hydroxide, Magnesium Hydroxide and Activated Dimethicone Suspension per 5ml", form: "syrup", pack: "170 ml", ja: 33, r: /(aluminium|aluminum).*magnesium/, brands: ["digene gel", "gelusil syrup", "mucaine gel"], approx: null },
  { code: 23, name: "Paracetamol Tablets IP 500 mg", form: "tablet", pack: "10's", ja: 6.56, r: /^(?!.*(ibuprofen|aceclofenac|diclofenac|nimesulide|tramadol|dicyclomine|chlorzoxazone|caffeine|phenylephrine|cetirizine)).*paracetamol\D*500/, brands: ["crocin 500", "calpol 500", "dolo 500"], approx: 15 },
  { code: 14, name: "Ibuprofen 400mg and Paracetamol 325mg Tablets IP", form: "tablet", pack: "10's", ja: 8.25, r: /ibuprofen.*paracetamol|paracetamol.*ibuprofen/, brands: ["combiflam", "ibugesic plus"], approx: 26 },
  { code: 11, name: "Diclofenac Gastro-Resistant Tablets IP 50 mg", form: "tablet", pack: "10's", ja: 5.68, r: /^(?!.*(paracetamol|serratiopeptidase|chlorzoxazone)).*diclofenac\D*50(?!\d)/, brands: ["voveran", "dynapar"], approx: 32 },
  { code: 1, name: "Aceclofenac 100mg and Paracetamol 325mg Tablets", form: "tablet", pack: "10's", ja: 10.32, r: /aceclofenac.*paracetamol|paracetamol.*aceclofenac/, brands: ["zerodol p", "zerodol-p", "hifenac p", "hifenac-p"], approx: 100 },
  { code: 2, name: "Aceclofenac Tablets IP 100 mg", form: "tablet", pack: "10's", ja: 8.25, r: /^(?!.*paracetamol).*aceclofenac\D*100/, brands: ["zerodol", "hifenac"], approx: 60 },
  { code: 72, name: "Azithromycin Tablets IP 500 mg", form: "tablet", pack: "3's", ja: 39.38, r: /azithromycin\D*500/, brands: ["azithral 500", "azee 500", "zithromax 500"], approx: 95 },
  { code: 18, name: "Azithromycin Tablets IP 250 mg", form: "tablet", pack: "6's", ja: 42.19, r: /azithromycin\D*250/, brands: ["azithral 250", "azee 250"], approx: 80 },
  { code: 39, name: "Amoxycillin 500mg and Potassium Clavulanate 125mg Tablets IP", form: "tablet", pack: "6's", ja: 57.85, r: /^(?=.*(500|625))(?=.*(amoxy|amoxi))(?=.*clav)/, brands: ["augmentin 625", "moxclav 625", "clavam 625"], approx: 130 },
  { code: 45, name: "Amoxycillin Capsules IP 500mg", form: "capsule", pack: "10's", ja: 36.09, r: /^(?!.*clav)(?=.*(amoxy|amoxi)).*500/, brands: ["mox 500", "novamox 500"], approx: 70 },
  { code: 55, name: "Cefixime Tablets IP 200 mg", form: "tablet", pack: "10's", ja: 52.55, r: /^(?!.*(ofloxacin|clav)).*cefixime\D*200/, brands: ["taxim-o", "taxim o", "zifi 200"], approx: 150 },
  { code: 86, name: "Ciprofloxacin Hydrochloride Tablets IP 500 mg", form: "tablet", pack: "10's", ja: 20.63, r: /^(?!.*tinidazole).*ciprofloxacin\D*500/, brands: ["ciplox 500", "cifran 500"], approx: 70 },
  { code: 96, name: "Levofloxacin Tablets IP 500mg", form: "tablet", pack: "10's", ja: 34.03, r: /levofloxacin\D*500/, brands: ["levoflox 500", "tavanic 500"], approx: 110 },
  { code: 202, name: "Metronidazole Tablets IP 400mg", form: "tablet", pack: "10's", ja: 7.22, r: /^(?!.*(norflox|cipro)).*metronidazole\D*400/, brands: ["flagyl 400", "metrogyl 400"], approx: 15 },
  { code: 240, name: "Cetrizine Hydrochloride Tablets IP 10mg", form: "tablet", pack: "10's", ja: 5.68, r: /^(?!.*(levo|montelukast|paracetamol)).*cetirizine\D*10(?!\d)/, brands: ["cetzine", "okacet", "alerid"], approx: 20 },
  { code: 248, name: "Levocetrizine Tablets IP 5 mg", form: "tablet", pack: "10's", ja: 7.94, r: /^(?!.*montelukast).*levocet[a-z]*\D*5(?!\d)/, brands: ["levocet", "xyzal"], approx: 45 },
  { code: 252, name: "Montelukast Sodium 10mg and Levocetirizine 5mg Tablets IP", form: "tablet", pack: "10's", ja: 20.63, r: /montelukast.*levocet|levocet.*montelukast/, brands: ["montair lc", "montek lc"], approx: 190 },
  { code: 251, name: "Montelukast Sodium Tablets IP 10mg", form: "tablet", pack: "10's", ja: 20.42, r: /^(?!.*levocet).*montelukast\D*10(?!\d)/, brands: ["montair", "singulair"], approx: 150 },
  { code: 145, name: "Metformin Hydrochloride Tablets IP 500mg", form: "tablet", pack: "10's", ja: 6.81, r: /^(?!.*(glimepiride|glipizide|pioglitazone|gliclazide|sitagliptin|voglibose|sr\b|prolonged|extended)).*metformin\D*500/, brands: ["glycomet 500", "glucophage 500"], approx: 18 },
  { code: 372, name: "Metformin Hydrochloride Prolonged release Tablets IP 500 mg", form: "tablet", pack: "10's", ja: 10.79, r: /^(?!.*(glimepiride|glipizide|pioglitazone)).*metformin.*(sr\b|prolonged|extended)/, brands: ["glycomet sr", "glycomet-sr"], approx: null },
  { code: 138, name: "Glimepiride Tablets IP 2mg", form: "tablet", pack: "10's", ja: 5.68, r: /^(?!.*metformin).*glimepiride\D*2(?!\d)/, brands: ["amaryl 2", "glimestar 2"], approx: 60 },
  { code: 264, name: "Amlodipine Tablets IP 5mg", form: "tablet", pack: "10's", ja: 5.68, r: /^(?!.*(telmisartan|atenolol|lisinopril|losartan|valsartan|olmesartan|nebivolol)).*amlodipine\D*5(?!\d)/, brands: ["amlokind", "stamlo", "amlong"], approx: 30 },
  { code: 300, name: "Telmisartan Tablets IP 40mg", form: "tablet", pack: "10's", ja: 12.38, r: /^(?!.*(amlodipine|hydrochlorothiazide|hctz)).*telmisartan\D*40/, brands: ["telma 40", "telmikind 40"], approx: 80 },
  { code: 289, name: "Losartan Tablets IP 50mg", form: "tablet", pack: "10's", ja: 12.47, r: /^(?!.*(hydrochlorothiazide|hctz|amlodipine)).*losartan\D*50/, brands: ["losar 50", "losacar 50"], approx: 60 },
  { code: 266, name: "Atorvastatin Tablets IP 10mg", form: "tablet", pack: "10's", ja: 9.08, r: /^(?!.*(clopidogrel|aspirin|ezetimibe)).*atorvastatin\D*10(?!\d)/, brands: ["atorva 10", "storvas 10", "tonact 10"], approx: 70 },
  { code: 267, name: "Atorvastatin Tablets IP 20mg", form: "tablet", pack: "10's", ja: 12.47, r: /^(?!.*(clopidogrel|aspirin|ezetimibe)).*atorvastatin\D*20/, brands: ["atorva 20", "storvas 20", "tonact 20"], approx: 120 },
  { code: 418, name: "Rosuvastatin Tablets IP 20 mg", form: "tablet", pack: "10's", ja: 29.49, r: /^(?!.*(clopidogrel|aspirin|fenofibrate|ezetimibe)).*rosuvastatin\D*20/, brands: ["rosuvas 20", "crestor 20"], approx: 180 },
  { code: 269, name: "Clopidogrel Tablets IP 75mg", form: "tablet", pack: "10's", ja: 19.28, r: /^(?!.*(aspirin|atorvastatin)).*clopidogrel\D*75/, brands: ["clopilet", "plavix"], approx: 80 },
  { code: 220, name: "Calcium 500mg and Vitamin D3 250IU Tablets IP", form: "tablet", pack: "10's", ja: 7.94, r: /calcium.*(vitamin d|cholecalciferol|d3)/, brands: ["shelcal", "calcimax"], approx: 85 },
  { code: 312, name: "Oral Rehydration Salts IP 20.5g Sachet (WHO Formula)", form: "syrup", pack: "1 sachet", ja: 10.98, r: /oral rehydration|\bors\b/, brands: ["electral", "ors"], approx: 21 },
  { code: 332, name: "Thyroxine Sodium Tablets IP 100 mcg", form: "tablet", pack: "100's", ja: 70.33, r: /(levothyroxine|thyroxine)\D*100/, brands: ["thyronorm 100", "eltroxin 100"], approx: null, care: true },
];

const clean = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hasWord = (text: string, w: string) => new RegExp("(^|[^a-z0-9])" + esc(w) + "($|[^a-z0-9])").test(text);

// Prescription ki dawai -> Jan Aushadhi ka same salt wala entry (na mile to null)
export function findGeneric(m: Pick<Medicine, "brandName" | "genericSalt"> & { form?: string }): GenericEntry | null {
  const salt = clean(m.genericSalt || "");
  const brand = clean(m.brandName || "");
  const known = m.form === "tablet" || m.form === "capsule" || m.form === "syrup" ? (m.form as Form) : null;

  let hits = GENERICS.filter((e) => e.r.test(salt));
  if (!hits.length) hits = GENERICS.filter((e) => e.brands.some((b) => hasWord(brand, b)));
  if (!hits.length) return null;
  if (known) return hits.find((e) => e.form === known) ?? null; // syrup ka daam tablet pe na lage
  return hits[0];
}

// Search box: brand ya salt ka naam type/bol kar
export function searchGeneric(q: string): GenericEntry[] {
  const s = clean(q);
  if (s.length < 3) return [];
  return GENERICS.filter(
    (e) => e.r.test(s) || e.brands.some((b) => b.includes(s) || hasWord(s, b)) || e.name.toLowerCase().includes(s)
  ).slice(0, 6);
}

export const saving = (brand: number, ja: number) => ({
  amt: Math.max(0, brand - ja),
  pct: brand > 0 ? Math.max(0, Math.round(((brand - ja) / brand) * 100)) : 0,
});

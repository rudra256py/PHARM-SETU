"use client";
// "Call nearest Jan Aushadhi Kendra" button + sheet. Used on /result and /generic.
import { useState } from "react";
import { Icon } from "@/components/ui";
import { DEFAULT_LOCATION, janAushadhiMapsUrl } from "@/lib/config";
import type { Lang } from "@/lib/types";

export const HELPLINE = "1800-180-8080"; // Jan Aushadhi national toll-free helpline (PMBI)

const T = {
  hi: {
    btn: "नज़दीकी जन औषधि केंद्र को कॉल करें", btnS: "कॉल करके पूछें / मँगवाएँ", title: "नज़दीकी जन औषधि केंद्र", finding: "आपके पास का केंद्र खोज रहे हैं…",
    call: "कॉल करें", dir: "रास्ता देखें", km: "किमी", tell: "फ़ोन पर यह बताएँ", code: "कोड", nophone: "इस केंद्र का नंबर उपलब्ध नहीं है।",
    none: "पास में कोई केंद्र नहीं मिला (लोकेशन बंद हो सकती है)। नीचे हेल्पलाइन पर कॉल करें या नक्शे पर खोजें।",
    help: "राष्ट्रीय हेल्पलाइन (मुफ़्त)", helpS: "अपने पास का केंद्र पूछें", map: "नक्शे पर खोजें", close: "बंद करें",
    note: "नंबर Google Maps से लिए गए हैं और बदल सकते हैं। जाने से पहले पूछ लें कि दवा उपलब्ध है या नहीं।",
  },
  bh: {
    btn: "नजदीक के जन औषधि केंद्र के फोन करीं", btnS: "फोन करके पूछीं / मँगवाईं", title: "नजदीक के जन औषधि केंद्र", finding: "रउरा लगे के केंद्र खोजत बानी…",
    call: "फोन करीं", dir: "रास्ता देखीं", km: "किमी", tell: "फोन पर इहे बताईं", code: "कोड", nophone: "एह केंद्र के नंबर नइखे।",
    none: "लगे में केंद्र ना मिलल (लोकेशन बंद हो सकेला)। नीचे हेल्पलाइन पर फोन करीं भा नक्शा पर खोजीं।",
    help: "राष्ट्रीय हेल्पलाइन (मुफ़्त)", helpS: "आपन नजदीक के केंद्र पूछीं", map: "नक्शा पर खोजीं", close: "बंद करीं",
    note: "नंबर Google Maps से लिहल गइल बा, बदल सकेला। जाए से पहिले पूछ लीं कि दवाई बा कि ना।",
  },
  en: {
    btn: "Call nearest Jan Aushadhi Kendra", btnS: "Ask about or order these medicines", title: "Nearest Jan Aushadhi Kendras", finding: "Finding Kendras near you…",
    call: "Call", dir: "Directions", km: "km", tell: "Tell them on the call", code: "code", nophone: "No phone number listed for this Kendra.",
    none: "No Kendra found nearby (your location may be off). Call the helpline below or search on the map.",
    help: "National helpline (toll-free)", helpS: "Ask for the Kendra nearest to you", map: "Search on map", close: "Close",
    note: "Numbers come from Google Maps listings and may change. Ask whether the medicine is in stock before you go.",
  },
};

type Kendra = { name: string; address: string; phone: string | null; km: number | null; maps: string };
export type KendraItem = { name: string; code?: number };

export default function CallKendra({ lang, items = [], small = false }: { lang: Lang; items?: KendraItem[]; small?: boolean }) {
  const t = T[lang];
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<Kendra[]>([]);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);

  async function start() {
    setOpen(true); setBusy(true); setList([]);
    try {
      const p = await new Promise<{ lat: number; lng: number } | null>((res) => {
        try {
          if (!navigator.geolocation) return res(null);
          navigator.geolocation.getCurrentPosition((x) => res({ lat: x.coords.latitude, lng: x.coords.longitude }), () => res(null), { timeout: 8000, maximumAge: 300_000 });
        } catch { res(null); }
      });
      setPos(p);
      if (p) {
        const j = await (await fetch(`/api/kendra?lat=${p.lat}&lng=${p.lng}`)).json();
        if (j.ok && Array.isArray(j.kendras)) setList(j.kendras);
      }
    } catch { /* helpline fallback is shown below */ }
    setBusy(false);
  }

  const mapUrl = janAushadhiMapsUrl(pos?.lat ?? DEFAULT_LOCATION.lat, pos?.lng ?? DEFAULT_LOCATION.lng);

  return (
    <>
      <button className={"btn call" + (small ? " sm" : "")} onClick={start}>
        <Icon name="phone" size={small ? 20 : 26} />
        <span>{small ? t.call + " · " + t.title : t.btn}{!small && <small>{t.btnS}</small>}</span>
      </button>

      {open && (
        <div className="kov" role="dialog" aria-modal="true" aria-label={t.title} onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="ksheet">
            <h3>{t.title}</h3>

            {items.length > 0 && (
              <div className="ktell">
                <b>{t.tell}:</b>
                <ul>{items.map((it, i) => <li key={i}>{it.name}{it.code ? <i> ({t.code} #{it.code})</i> : null}</li>)}</ul>
              </div>
            )}

            {busy && <p className="kbusy">{t.finding}</p>}
            {!busy && list.length === 0 && <p className="kbusy">{t.none}</p>}
            {list.map((k, i) => (
              <div className="kitem" key={i}>
                <b>{k.name}</b>
                <small>{k.address}{k.km != null ? ` · ${k.km} ${t.km}` : ""}</small>
                <div className="krow">
                  {k.phone ? <a className="kcall" href={`tel:${k.phone.replace(/[^\d+]/g, "")}`}><Icon name="phone" size={20} /> {t.call} {k.phone}</a> : <span className="knop">{t.nophone}</span>}
                  {k.maps && <a className="kdir" href={k.maps} target="_blank" rel="noopener noreferrer">{t.dir}</a>}
                </div>
              </div>
            ))}

            {!busy && (
              <div className="kitem khelp">
                <b>{t.help}: {HELPLINE}</b>
                <small>{t.helpS}</small>
                <div className="krow">
                  <a className="kcall" href={`tel:${HELPLINE.replace(/-/g, "")}`}><Icon name="phone" size={20} /> {t.call} {HELPLINE}</a>
                  <a className="kdir" href={mapUrl} target="_blank" rel="noopener noreferrer">{t.map}</a>
                </div>
              </div>
            )}

            <p className="knote">{t.note}</p>
            <button className="btn ghost" onClick={() => setOpen(false)}>{t.close}</button>
          </div>
        </div>
      )}
    </>
  );
}

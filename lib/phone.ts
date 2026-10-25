// lib/phone.ts - decides whether a phone number can receive WhatsApp (mobile) or is a landline.
// Digits alone cannot tell them apart (Patna landlines start 612..., a mobile can too), but Google writes mobiles as 5+5 digits
// ("+91 98765 43210") and landlines as STD + number ("+91 612 222 3344"). Returns "91XXXXXXXXXX" for mobiles, otherwise null.
export function waNumber(phone: string | null): string | null {
  if (!phone) return null;
  const m = phone.trim().match(/^(?:\+?91[\s-]*|0)?([6-9]\d{4})[\s-]?(\d{5})$/);
  return m ? "91" + m[1] + m[2] : null;
}

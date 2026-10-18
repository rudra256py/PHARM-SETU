import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PHARM SETU – Parchi Samjho, Bachat Karo",
  description: "Doctor ki parchi ko apni bhasha me samjhiye, bol kar sunie, aur Jan Aushadhi se bachat dekhiye.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0D9488" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi">
      <body>{children}</body>
    </html>
  );
}

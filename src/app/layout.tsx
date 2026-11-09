import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getLocale } from "@/lib/i18n/server";
import { directionOf } from "@/lib/i18n/types";

export const metadata: Metadata = {
  title: {
    default: "Wasl — Blood Donation and Coordination Platform for Karachi",
    template: "%s · Wasl",
  },
  description:
    "Wasl connects verified hospitals, verified blood banks, donation organizations and donors across Karachi. It coordinates information only and never makes medical decisions.",
  applicationName: "Wasl",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#c02f2f",
};

/**
 * Root layout. Sets the language and text direction on <html> for every page
 * (NFR-LOC-03), so RTL mirrors the whole application, not just one screen.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const dir = directionOf(locale);

  return (
    <html lang={locale} dir={dir}>
      <body className="flex min-h-dvh flex-col">
        <div className="flex min-h-dvh flex-col">{children}</div>
      </body>
    </html>
  );
}

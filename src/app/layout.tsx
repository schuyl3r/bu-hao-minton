import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { HydrationGate } from "@/components/HydrationGate";
import { BottomNav } from "@/components/BottomNav";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

const barlow = Barlow({
  variable: "--font-barlow",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BuHaominton",
  description: "Courtside badminton queue and session manager.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${barlowCondensed.variable} ${barlow.variable}`}>
      <body className="min-h-dvh font-sans antialiased">
        <HydrationGate>
          <div
            className="mx-auto flex min-h-dvh max-w-lg flex-col pb-20"
            style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
          >
            {children}
          </div>
          <BottomNav />
        </HydrationGate>
      </body>
    </html>
  );
}

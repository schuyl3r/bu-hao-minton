import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import { HydrationGate } from "@/components/HydrationGate";
import { BottomNav } from "@/components/BottomNav";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  weight: "400",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BuHaominton",
  description: "Courtside badminton queue and session manager.",
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
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
    <html lang="en" className={`${bebasNeue.variable} ${inter.variable}`}>
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

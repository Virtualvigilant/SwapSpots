import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import InstallPrompt from "@/components/pwa/install-prompt";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SwapSpot — Buy, sell and swap on campus",
    template: "%s · SwapSpot",
  },
  description:
    "The campus marketplace for Kabarak. Browse listings from verified students, or post a request and let sellers bid for it. No fees, no middleman — deals close on WhatsApp.",
  keywords: ["campus marketplace", "Kabarak", "student marketplace", "buy and sell", "Kenya"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SwapSpot",
  },
  openGraph: {
    title: "SwapSpot — Buy, sell and swap on campus",
    description:
      "Browse listings from verified students, or post a request and let sellers bid for it.",
    type: "website",
  },
  icons: {
    icon: "/icon-512.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ff5b2e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${inter.variable}`}>
      <body className="min-h-dvh bg-white antialiased">
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}


import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CityPulse | Smart Municipal Operations",
  description: "AI-Powered Municipal Incident Reporting & Operational Command",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body className="font-sans antialiased min-h-screen bg-[#f7f6ff] text-[#4d4b66]">
        {children}
      </body>
    </html>
  );
}

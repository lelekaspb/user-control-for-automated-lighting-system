import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import AuthNav from "./AuthNav";
import DashboardShell from "./components/DashboardShell";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BalconyLight | Smart Lighting",
  description: "Smart off-grid balcony lighting control",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <DashboardShell
          authNav={
            <Suspense fallback={null}>
              <AuthNav />
            </Suspense>
          }
        >
          {children}
        </DashboardShell>
      </body>
    </html>
  );
}

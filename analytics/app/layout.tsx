import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Website Analytics | Live Dashboard",
  description: "Production-ready, lightweight website analytics tracking dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gradient-to-b from-[#FBF8F3] to-[#F5F0E6]`}>
        {children}
      </body>
    </html>
  );
}

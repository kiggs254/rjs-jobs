import type { Metadata } from "next";
import { Nunito_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const sans = Nunito_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "RJS Coffee Shop — Careers",
    template: "%s · RJS Coffee Shop Careers",
  },
  description:
    "Join the RJS Coffee Shop team. Browse open roles and apply in minutes.",
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

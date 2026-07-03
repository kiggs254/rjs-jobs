import type { Metadata } from "next";
import { Nunito_Sans, Montserrat, Pacifico } from "next/font/google";
import "./globals.css";

const sans = Nunito_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const display = Montserrat({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const script = Pacifico({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: {
    default: "RJ's Coffee — Careers",
    template: "%s · RJ's Coffee Careers",
  },
  description:
    "Join the RJ's Coffee team — Ready & Fresh. Browse open roles and apply in minutes.",
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
      className={`${sans.variable} ${display.variable} ${script.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

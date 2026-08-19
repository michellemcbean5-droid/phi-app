import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prince Haul Intelligence | Build Your Trucking Business. Run Your Freight.",
  description:
    "PHI brings business launch planning, equipment pathways, freight intelligence, dispatch controls, documents, and profit visibility into one owner-operator operating system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

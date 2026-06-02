import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sarap.ai Dashboard",
  description: "Restaurant reputation dashboard for Sarap.ai pilots",
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


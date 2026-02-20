import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NY Tax Tipping Point Calculator",
  description: "Data-grounded interactive calculator modeling how proposed NY tax changes affect revenue, accounting for behavioral migration response.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

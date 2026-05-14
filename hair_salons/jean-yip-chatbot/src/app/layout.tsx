import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jean Yip Chatbot",
  description: "AI front-desk assistant for Jean Yip Group salons",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

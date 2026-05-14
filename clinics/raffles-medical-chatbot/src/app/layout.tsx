import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Raffles Medical Chatbot",
  description: "AI patient services coordinator for Raffles Medical Group",
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

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Din Tai Fung Chatbot",
  description: "AI reservation coordinator for Din Tai Fung Singapore",
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

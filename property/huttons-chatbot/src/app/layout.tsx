import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Huttons Chatbot",
  description: "AI property concierge for Huttons Asia",
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

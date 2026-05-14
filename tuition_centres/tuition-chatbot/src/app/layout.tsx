import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tuition Chatbot",
  description: "AI front desk for Singapore tuition centres",
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

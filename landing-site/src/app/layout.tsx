import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "FrontDesk AI — Your 24/7 AI Receptionist for Singapore SMEs",
  description: "AI chatbot that answers questions, books appointments, and captures leads for tuition centres, clinics, salons, restaurants, gyms, and property agents in Singapore. Set up in 48 hours.",
  keywords: "AI chatbot Singapore, tuition centre chatbot, clinic chatbot, salon booking bot, SME chatbot",
  openGraph: {
    title: "FrontDesk AI — Your 24/7 AI Receptionist",
    description: "Answers customer questions, books appointments, and captures leads. From $99/month.",
    url: "https://frontdeskai.sg",
    siteName: "FrontDesk AI",
    locale: "en_SG",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

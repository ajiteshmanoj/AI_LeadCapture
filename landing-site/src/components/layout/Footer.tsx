import Link from "next/link";
import { Bot, Mail, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 text-white font-semibold text-lg mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              FrontDesk AI
            </div>
            <p className="text-sm text-gray-400 max-w-xs">
              Your 24/7 AI receptionist for Singapore SMEs. Answers questions, books appointments, captures leads.
            </p>
            <p className="text-sm mt-3">Built in Singapore 🇸🇬</p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-medium mb-3 text-sm">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: "Home", href: "/" },
                { label: "Live Demo", href: "/demo" },
                { label: "Pricing", href: "/pricing" },
                { label: "How It Works", href: "/how-it-works" },
                { label: "Contact", href: "/contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-medium mb-3 text-sm">Contact Us</h4>
            <div className="space-y-3 text-sm">
              <a
                href="https://wa.me/6591234567"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                WhatsApp us
              </a>
              <a
                href="mailto:hello@frontdeskai.sg"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4 text-indigo-400" />
                hello@frontdeskai.sg
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500">
          <span>© 2026 FrontDesk AI. All rights reserved.</span>
          <span>PDPA Compliant · Proudly built in Singapore</span>
        </div>
      </div>
    </footer>
  );
}

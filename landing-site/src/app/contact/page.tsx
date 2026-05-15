import { MessageCircle, Mail, Clock } from "lucide-react";

export const metadata = {
  title: "Contact — FrontDesk AI",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1
            className="text-3xl sm:text-4xl font-bold text-gray-900"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}
          >
            Get in touch
          </h1>
          <p className="text-gray-500 mt-2">We typically respond within 2 hours during business hours.</p>
        </div>

        {/* Contact options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <a
            href="https://wa.me/6591234567?text=Hi, I'm interested in FrontDesk AI for my business"
            className="flex flex-col items-center gap-2 bg-white rounded-2xl border border-gray-200 p-5 hover:border-emerald-300 hover:shadow-md transition-all text-center"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">WhatsApp</div>
              <div className="text-xs text-gray-500">Fastest response</div>
            </div>
          </a>
          <a
            href="mailto:hello@frontdeskai.sg"
            className="flex flex-col items-center gap-2 bg-white rounded-2xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all text-center"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Mail className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">Email</div>
              <div className="text-xs text-gray-500">hello@frontdeskai.sg</div>
            </div>
          </a>
          <div className="flex flex-col items-center gap-2 bg-white rounded-2xl border border-gray-200 p-5 text-center">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">Hours</div>
              <div className="text-xs text-gray-500">Mon–Sat, 9am–8pm SGT</div>
            </div>
          </div>
        </div>

        {/* Contact form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-5">Send us a message</h2>
          <form className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Your name</label>
                <input
                  type="text"
                  placeholder="John Tan"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="john@mybusiness.sg"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Business name</label>
              <input
                type="text"
                placeholder="ABC Tuition Centre"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Industry</label>
              <select className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
                <option value="">Select your industry</option>
                <option>Tuition Centre</option>
                <option>Hair Salon / Spa</option>
                <option>Clinic / Healthcare</option>
                <option>Restaurant / F&B</option>
                <option>Gym / Fitness</option>
                <option>Property Agent</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Message</label>
              <textarea
                rows={4}
                placeholder="Tell us about your business and what you'd like the chatbot to do..."
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
            >
              Send Message
            </button>
            <p className="text-xs text-gray-400 text-center">
              Or WhatsApp us for a faster reply — we usually respond in under 2 hours.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

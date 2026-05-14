// Jean Yip salon chatbot embeddable widget. Compiled to /public/widget.js.
// Hosting site embeds via:
//   <script src="https://app.example.com/widget.js"
//           data-org-id="..."
//           data-color="#C9A96E"
//           data-bot-name="Fiona"
//           data-welcome="Hi! I'm Fiona from Jean Yip. How can I help you today?"
//           data-api-url="https://app.example.com" defer></script>

import { renderWidget, type WidgetConfig } from "./ui";

declare global {
  interface Window {
    __SALON_CHATBOT_LOADED?: boolean;
  }
}

(function bootstrap() {
  if (typeof window === "undefined") return;
  if (window.__SALON_CHATBOT_LOADED) return;
  window.__SALON_CHATBOT_LOADED = true;

  const script =
    document.currentScript ??
    document.querySelector<HTMLScriptElement>('script[src*="widget.js"]');
  if (!script) {
    console.warn("[jean-yip-chatbot] Could not locate script tag");
    return;
  }

  const apiUrl =
    script.getAttribute("data-api-url") ??
    new URL(script.src).origin;

  const config: WidgetConfig = {
    orgId: script.getAttribute("data-org-id") ?? "",
    apiUrl,
    primaryColor: script.getAttribute("data-color") ?? "#2563eb",
    botName: script.getAttribute("data-bot-name") ?? "Assistant",
    welcomeMessage:
      script.getAttribute("data-welcome") ??
      "Hi! 👋 How can I help you today?",
  };

  if (!config.orgId) {
    console.warn("[jean-yip-chatbot] Missing data-org-id on script tag");
    return;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => renderWidget(config));
  } else {
    renderWidget(config);
  }
})();

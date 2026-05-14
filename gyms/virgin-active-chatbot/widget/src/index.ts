// Virgin Active gym chatbot embeddable widget. Compiled to /public/widget.js.
// Hosting site embeds via:
//   <script src="https://app.example.com/widget.js"
//           data-org-id="..."
//           data-color="#E3000F"
//           data-bot-name="Alex"
//           data-welcome="Hi! I'm Alex from Virgin Active. How can I help?"
//           data-api-url="https://app.example.com" defer></script>

import { renderWidget, type WidgetConfig } from "./ui";

declare global {
  interface Window {
    __GYM_CHATBOT_LOADED?: boolean;
  }
}

(function bootstrap() {
  if (typeof window === "undefined") return;
  if (window.__GYM_CHATBOT_LOADED) return;
  window.__GYM_CHATBOT_LOADED = true;

  const script =
    document.currentScript ??
    document.querySelector<HTMLScriptElement>('script[src*="widget.js"]');
  if (!script) {
    console.warn("[gym-chatbot] Could not locate script tag");
    return;
  }

  const apiUrl =
    script.getAttribute("data-api-url") ??
    new URL(script.src).origin;

  const config: WidgetConfig = {
    orgId: script.getAttribute("data-org-id") ?? "",
    apiUrl,
    primaryColor: script.getAttribute("data-color") ?? "#E3000F",
    botName: script.getAttribute("data-bot-name") ?? "Alex",
    welcomeMessage:
      script.getAttribute("data-welcome") ??
      "Hi! I'm Alex from Virgin Active Singapore. How can I help you today?",
  };

  if (!config.orgId) {
    console.warn("[gym-chatbot] Missing data-org-id on script tag");
    return;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => renderWidget(config));
  } else {
    renderWidget(config);
  }
})();

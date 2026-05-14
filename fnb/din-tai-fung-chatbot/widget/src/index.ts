// Din Tai Fung F&B chatbot embeddable widget. Compiled to /public/widget.js.
// Hosting site embeds via:
//   <script src="https://app.example.com/widget.js"
//           data-org-id="..."
//           data-color="#8B0000"
//           data-bot-name="Mei"
//           data-welcome="Hi! How can I help with your reservation?"
//           data-api-url="https://app.example.com" defer></script>

import { renderWidget, type WidgetConfig } from "./ui";

declare global {
  interface Window {
    __FNB_CHATBOT_LOADED?: boolean;
  }
}

(function bootstrap() {
  if (typeof window === "undefined") return;
  if (window.__FNB_CHATBOT_LOADED) return;
  window.__FNB_CHATBOT_LOADED = true;

  const script =
    document.currentScript ??
    document.querySelector<HTMLScriptElement>('script[src*="widget.js"]');
  if (!script) {
    console.warn("[dtf-chatbot] Could not locate script tag");
    return;
  }

  const apiUrl =
    script.getAttribute("data-api-url") ??
    new URL(script.src).origin;

  const config: WidgetConfig = {
    orgId: script.getAttribute("data-org-id") ?? "",
    apiUrl,
    primaryColor: script.getAttribute("data-color") ?? "#8B0000",
    botName: script.getAttribute("data-bot-name") ?? "Mei",
    welcomeMessage:
      script.getAttribute("data-welcome") ??
      "Hi! I'm Mei from Din Tai Fung Singapore. How can I help with your reservation today?",
  };

  if (!config.orgId) {
    console.warn("[dtf-chatbot] Missing data-org-id on script tag");
    return;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => renderWidget(config));
  } else {
    renderWidget(config);
  }
})();

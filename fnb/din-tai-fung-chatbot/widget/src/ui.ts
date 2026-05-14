import { sendMessage } from "./api";
import { widgetCss } from "./styles";

export interface WidgetConfig {
  orgId: string;
  apiUrl: string;
  primaryColor: string;
  botName: string;
  welcomeMessage: string;
}

const STORAGE_KEY = "dtf_conversation_id";
const PDPA_NOTICE =
  "By chatting, you agree to our collection and use of your personal data for reservation purposes. Type STOP anytime to opt out.";

interface Msg {
  role: "user" | "bot" | "error";
  text: string;
}

export function renderWidget(config: WidgetConfig) {
  const host = document.createElement("div");
  host.id = "dtf-chatbot-host";
  host.style.cssText =
    "all: initial; position: fixed; z-index: 99999; bottom: 0; right: 0;";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = widgetCss(config.primaryColor);
  shadow.appendChild(style);

  const root = document.createElement("div");
  root.className = "tcw-root";
  shadow.appendChild(root);

  const messages: Msg[] = [
    { role: "bot", text: config.welcomeMessage },
  ];
  let conversationId: string | null = localStorage.getItem(STORAGE_KEY);
  let isOpen = false;
  let isSending = false;
  let disclaimerShown = !!conversationId;

  // ---- Launcher button --------------------------------------------------
  const launcher = document.createElement("button");
  launcher.className = "tcw-launcher";
  launcher.setAttribute("aria-label", "Open chat");
  launcher.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 3C6.48 3 2 6.94 2 11.5c0 2.07.93 3.97 2.47 5.4L3 21l4.4-1.43A11.4 11.4 0 0 0 12 20c5.52 0 10-3.94 10-8.5S17.52 3 12 3z"/></svg>`;
  root.appendChild(launcher);

  // ---- Chat window ------------------------------------------------------
  const win = document.createElement("div");
  win.className = "tcw-window";
  win.setAttribute("role", "dialog");
  win.setAttribute("aria-label", `${config.botName} chat window`);
  win.innerHTML = `
    <div class="tcw-header">
      <div class="tcw-header-title">${escapeHtml(config.botName)}</div>
      <div class="tcw-header-actions">
        <button class="tcw-icon-btn" data-action="reset" aria-label="Start new chat" title="Start new chat">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35A8 8 0 1 0 19.46 15h-2.13a6 6 0 1 1-1.27-7.24L13 11h7V4l-2.35 2.35z"/></svg>
        </button>
        <button class="tcw-icon-btn" data-action="minimise" aria-label="Minimise">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="11" width="14" height="2" rx="1"/></svg>
        </button>
        <button class="tcw-icon-btn" data-action="close" aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.3 5.71L12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.3 19.71l-1.42-1.42L9.17 12 2.88 5.71 4.3 4.29 10.59 10.6l6.3-6.3z"/></svg>
        </button>
      </div>
    </div>
    <div class="tcw-messages" id="tcw-messages"></div>
    <div class="tcw-disclaimer">${PDPA_NOTICE}</div>
    <div class="tcw-input-row">
      <textarea class="tcw-input" rows="1" placeholder="Type your message..." id="tcw-input"></textarea>
      <button class="tcw-send" id="tcw-send">Send</button>
    </div>
  `;
  root.appendChild(win);

  const messagesEl = win.querySelector<HTMLDivElement>("#tcw-messages")!;
  const inputEl = win.querySelector<HTMLTextAreaElement>("#tcw-input")!;
  const sendBtn = win.querySelector<HTMLButtonElement>("#tcw-send")!;
  const closeBtn = win.querySelector<HTMLButtonElement>('[data-action="close"]')!;
  const minBtn = win.querySelector<HTMLButtonElement>('[data-action="minimise"]')!;
  const resetBtn = win.querySelector<HTMLButtonElement>('[data-action="reset"]')!;

  function rerender() {
    messagesEl.innerHTML = messages
      .map((m) => {
        const cls =
          m.role === "user"
            ? "tcw-msg tcw-msg-user"
            : m.role === "error"
              ? "tcw-msg tcw-msg-error"
              : "tcw-msg tcw-msg-bot";
        return `<div class="${cls}">${escapeHtml(m.text)}</div>`;
      })
      .join("");
    if (isSending) {
      const t = document.createElement("div");
      t.className = "tcw-typing";
      t.innerHTML = `<span class="tcw-dot"></span><span class="tcw-dot"></span><span class="tcw-dot"></span>`;
      messagesEl.appendChild(t);
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function setOpen(open: boolean) {
    isOpen = open;
    win.classList.toggle("tcw-open", open);
    if (open) {
      if (!disclaimerShown) disclaimerShown = true;
      setTimeout(() => inputEl.focus(), 50);
    }
  }

  async function send() {
    const text = inputEl.value.trim();
    if (!text || isSending) return;
    messages.push({ role: "user", text });
    inputEl.value = "";
    inputEl.style.height = "auto";
    isSending = true;
    sendBtn.disabled = true;
    rerender();
    try {
      const res = await sendMessage({
        apiUrl: config.apiUrl,
        orgId: config.orgId,
        conversationId,
        message: text,
      });
      conversationId = res.conversation_id;
      localStorage.setItem(STORAGE_KEY, conversationId);
      messages.push({ role: "bot", text: res.reply });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      messages.push({ role: "error", text: msg });
    } finally {
      isSending = false;
      sendBtn.disabled = false;
      rerender();
    }
  }

  function resetChat() {
    if (!confirm("Start a new chat? Current conversation will be cleared.")) return;
    localStorage.removeItem(STORAGE_KEY);
    conversationId = null;
    messages.length = 0;
    messages.push({ role: "bot", text: config.welcomeMessage });
    rerender();
  }

  launcher.addEventListener("click", () => setOpen(!isOpen));
  closeBtn.addEventListener("click", () => setOpen(false));
  minBtn.addEventListener("click", () => setOpen(false));
  resetBtn.addEventListener("click", resetChat);
  sendBtn.addEventListener("click", send);

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
  inputEl.addEventListener("input", () => {
    inputEl.style.height = "auto";
    inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + "px";
  });

  rerender();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const widgetCss = (primary: string) => `
:host, .tcw-root { all: initial; }
.tcw-root, .tcw-root * { box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
.tcw-launcher {
  position: fixed; bottom: 24px; right: 24px; width: 60px; height: 60px;
  border-radius: 50%; background: ${primary}; color: white; border: 0;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 20px rgba(0,0,0,0.2); cursor: pointer; z-index: 99999;
  transition: transform 0.15s ease;
}
.tcw-launcher:hover { transform: scale(1.05); }
.tcw-launcher svg { width: 28px; height: 28px; fill: white; }

.tcw-window {
  position: fixed; bottom: 96px; right: 24px; width: 380px; height: 520px;
  background: white; border-radius: 14px; box-shadow: 0 12px 40px rgba(0,0,0,0.18);
  display: flex; flex-direction: column; overflow: hidden; z-index: 99999;
  opacity: 0; transform: translateY(8px); pointer-events: none;
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.tcw-window.tcw-open { opacity: 1; transform: translateY(0); pointer-events: auto; }

.tcw-header {
  background: ${primary}; color: white; padding: 14px 16px;
  display: flex; align-items: center; justify-content: space-between;
}
.tcw-header-title { font-weight: 600; font-size: 15px; }
.tcw-header-actions { display: flex; gap: 8px; }
.tcw-icon-btn {
  width: 28px; height: 28px; border-radius: 6px; background: transparent;
  border: 0; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.tcw-icon-btn:hover { background: rgba(255,255,255,0.15); }

.tcw-messages {
  flex: 1; overflow-y: auto; padding: 14px; background: #f7f8fa;
  display: flex; flex-direction: column; gap: 8px;
}
.tcw-msg { max-width: 80%; padding: 9px 12px; border-radius: 12px; font-size: 14px; line-height: 1.45; white-space: pre-wrap; word-wrap: break-word; }
.tcw-msg-user { align-self: flex-end; background: ${primary}; color: white; border-bottom-right-radius: 4px; }
.tcw-msg-bot  { align-self: flex-start; background: white; color: #1f2937; border: 1px solid #e5e7eb; border-bottom-left-radius: 4px; }
.tcw-msg-error { align-self: flex-start; background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

.tcw-typing { align-self: flex-start; display: flex; gap: 3px; padding: 10px 14px; background: white; border: 1px solid #e5e7eb; border-radius: 12px; }
.tcw-dot { width: 7px; height: 7px; border-radius: 50%; background: #9ca3af; animation: tcw-bounce 1.4s infinite ease-in-out both; }
.tcw-dot:nth-child(2) { animation-delay: -0.16s; }
.tcw-dot:nth-child(3) { animation-delay: 0s; }
@keyframes tcw-bounce { 0%,80%,100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }

.tcw-input-row {
  display: flex; gap: 8px; padding: 10px; background: white; border-top: 1px solid #e5e7eb;
}
.tcw-input {
  flex: 1; padding: 9px 12px; border: 1px solid #d1d5db; border-radius: 8px;
  font-size: 14px; outline: none; resize: none; max-height: 120px; font-family: inherit;
}
.tcw-input:focus { border-color: ${primary}; box-shadow: 0 0 0 2px ${primary}33; }
.tcw-send {
  background: ${primary}; color: white; border: 0; border-radius: 8px;
  padding: 0 14px; cursor: pointer; font-weight: 500; font-size: 14px;
}
.tcw-send:disabled { opacity: 0.5; cursor: not-allowed; }

.tcw-disclaimer { font-size: 11px; color: #6b7280; padding: 6px 12px; background: #f9fafb; border-top: 1px solid #f3f4f6; }

@media (max-width: 480px) {
  .tcw-window { bottom: 0; right: 0; width: 100vw; height: 100vh; border-radius: 0; }
  .tcw-launcher { bottom: 16px; right: 16px; }
}
`;

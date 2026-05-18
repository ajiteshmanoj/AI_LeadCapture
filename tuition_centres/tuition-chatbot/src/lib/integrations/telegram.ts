// Telegram Bot API wrapper.
//
// Each tuition centre runs their own Telegram bot (one BotFather token per
// `organisations` row). All calls take an explicit token rather than reading
// from process.env so the server can multiplex many bots.

const TELEGRAM_API = "https://api.telegram.org";

interface TelegramApiError {
  ok: false;
  error_code: number;
  description: string;
}

interface TelegramApiOk<T> {
  ok: true;
  result: T;
}

type TelegramApiResponse<T> = TelegramApiOk<T> | TelegramApiError;

async function call<T>(
  botToken: string,
  method: string,
  body?: Record<string, unknown>,
): Promise<TelegramApiResponse<T>> {
  const res = await fetch(`${TELEGRAM_API}/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return (await res.json()) as TelegramApiResponse<T>;
}

export interface TelegramBotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
}

export async function getMe(botToken: string): Promise<TelegramBotInfo | null> {
  const res = await call<TelegramBotInfo>(botToken, "getMe");
  return res.ok ? res.result : null;
}

export async function sendMessage(
  botToken: string,
  chatId: number | string,
  text: string,
  opts: { photoUrl?: string } = {},
): Promise<{ ok: true; messageId: number } | { ok: false; reason: string }> {
  if (opts.photoUrl) {
    // sendPhoto returns the same shape; caption is the text body.
    const photo = await call<{ message_id: number }>(botToken, "sendPhoto", {
      chat_id: chatId,
      photo: opts.photoUrl,
      caption: text,
    });
    if (photo.ok) return { ok: true, messageId: photo.result.message_id };
    // Fall through to text-only if sendPhoto fails (e.g. unreachable URL).
  }

  const res = await call<{ message_id: number }>(botToken, "sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
  });
  if (res.ok) return { ok: true, messageId: res.result.message_id };
  // Markdown parse failures are common when user-supplied text contains
  // unbalanced * or _; retry once as plain text.
  if (res.description?.includes("can't parse entities")) {
    const retry = await call<{ message_id: number }>(botToken, "sendMessage", {
      chat_id: chatId,
      text,
    });
    if (retry.ok) return { ok: true, messageId: retry.result.message_id };
    return { ok: false, reason: retry.description };
  }
  return { ok: false, reason: res.description };
}

export async function setWebhook(
  botToken: string,
  url: string,
  secretToken: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const res = await call<boolean>(botToken, "setWebhook", {
    url,
    secret_token: secretToken,
    allowed_updates: ["message"],
    drop_pending_updates: true,
  });
  return res.ok ? { ok: true } : { ok: false, reason: res.description };
}

export async function deleteWebhook(
  botToken: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const res = await call<boolean>(botToken, "deleteWebhook", {
    drop_pending_updates: true,
  });
  return res.ok ? { ok: true } : { ok: false, reason: res.description };
}

// Telegram update payload subset we actually care about.
export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: { id: number; first_name?: string; username?: string };
    chat: { id: number; type: string; first_name?: string; username?: string };
    date: number;
    text?: string;
  };
}

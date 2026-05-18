// Generates a Singapore PayNow QR (SGQR / EMVCo Merchant-Presented Mode)
// scannable by every major SG bank app. paynowqr builds the TLV string;
// qrcode renders it as a PNG buffer.
//
// Org PayNow proxy is stored on organisations.paynow_uen or paynow_phone
// (migration 011). UEN takes precedence when both are set.

import QRCode from "qrcode";
import PaynowQR from "paynowqr";

export type PayNowQROptions = {
  /** Either UEN (e.g. "201912345A") OR phone (e.g. "+6591234567"). UEN wins. */
  uen?: string | null;
  phone?: string | null;
  /** SGD amount with 2dp. Omit for "any amount" QR. */
  amount?: number;
  /** Reference number printed in the bank confirmation (max 25 chars). */
  reference?: string;
  /** Merchant name (max 25 chars) — defaults to "PayNow". */
  merchantName?: string;
  /** Whether the payer can edit the amount on their banking app. */
  editable?: boolean;
};

function normalisePhone(phone: string): string {
  // PayNow expects "+65XXXXXXXX" with no spaces / dashes.
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("65") && cleaned.length === 10) return `+${cleaned}`;
  if (cleaned.length === 8) return `+65${cleaned}`;
  return cleaned;
}

export function buildPayNowPayload(opts: PayNowQROptions): string {
  const uen = opts.uen?.trim();
  const phone = opts.phone?.trim();
  if (!uen && !phone) {
    throw new Error("PayNow requires either uen or phone.");
  }

  const qr = new PaynowQR({
    ...(uen ? { uen } : { mobile: normalisePhone(phone!) }),
    amount: typeof opts.amount === "number" ? Number(opts.amount.toFixed(2)) : undefined,
    editable: opts.editable ?? typeof opts.amount !== "number",
    refNumber: opts.reference?.slice(0, 25),
    company: (opts.merchantName ?? "PayNow").slice(0, 25),
  });
  return qr.output();
}

export async function generatePayNowQRPng(
  opts: PayNowQROptions,
  size = 320,
): Promise<Buffer> {
  const payload = buildPayNowPayload(opts);
  return QRCode.toBuffer(payload, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 2,
    width: size,
  });
}

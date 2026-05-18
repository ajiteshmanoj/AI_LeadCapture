// Public PNG endpoint that renders an org's PayNow QR on demand.
//
//   GET /api/paynow/<orgId>/qr.png?amount=120&ref=2026-06
//
// Authenticated by orgId only — anyone with the org's UUID gets a valid QR for
// that org's PayNow proxy. PayNow proxies are public bank identifiers anyway
// (a UEN appears on every invoice; a phone number is on the centre's website).
// Caching is short — Twilio + Telegram fetch the URL once per send.

import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { generatePayNowQRPng } from "@/lib/payments/paynow-qr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { orgId: string } },
) {
  const url = new URL(req.url);
  const amountRaw = url.searchParams.get("amount");
  const ref = url.searchParams.get("ref") ?? undefined;

  const amount = amountRaw ? Number(amountRaw) : undefined;
  if (amountRaw && (!Number.isFinite(amount!) || amount! < 0)) {
    return NextResponse.json({ error: "invalid amount" }, { status: 400 });
  }

  const { data: org, error } = await adminClient()
    .from("organisations")
    .select("org_name, paynow_uen, paynow_phone")
    .eq("id", params.orgId)
    .single();

  if (error || !org) {
    return NextResponse.json({ error: "org not found" }, { status: 404 });
  }
  if (!org.paynow_uen && !org.paynow_phone) {
    return NextResponse.json(
      { error: "org has no paynow proxy configured" },
      { status: 409 },
    );
  }

  try {
    const png = await generatePayNowQRPng({
      uen: org.paynow_uen,
      phone: org.paynow_phone,
      amount,
      reference: ref,
      merchantName: org.org_name ?? undefined,
      editable: typeof amount !== "number",
    });
    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        "content-type": "image/png",
        "content-length": String(png.length),
        "cache-control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

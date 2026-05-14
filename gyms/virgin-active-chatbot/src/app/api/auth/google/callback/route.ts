import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { exchangeCodeForTokens } from "@/lib/integrations/google-calendar";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const orgId = searchParams.get("state");
  const errorParam = searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(
      `${appUrl()}/dashboard/settings?calendar_error=${encodeURIComponent(errorParam)}`,
    );
  }
  if (!code || !orgId) {
    return NextResponse.redirect(
      `${appUrl()}/dashboard/settings?calendar_error=missing_code_or_state`,
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        `${appUrl()}/dashboard/settings?calendar_error=no_refresh_token`,
      );
    }
    const { error } = await adminClient()
      .from("organisations")
      .update({
        google_refresh_token: tokens.refresh_token,
        google_calendar_id: "primary",
      })
      .eq("id", orgId);
    if (error) {
      return NextResponse.redirect(
        `${appUrl()}/dashboard/settings?calendar_error=${encodeURIComponent(error.message)}`,
      );
    }
    return NextResponse.redirect(`${appUrl()}/dashboard/settings?calendar=connected`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "exchange_failed";
    return NextResponse.redirect(
      `${appUrl()}/dashboard/settings?calendar_error=${encodeURIComponent(msg)}`,
    );
  }
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

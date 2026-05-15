import { getCurrentOrgOrRedirect } from "@/lib/supabase/get-org";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "@/components/dashboard/SettingsForm";
import { CalendarConnection } from "@/components/dashboard/CalendarConnection";
import { TelegramConnection } from "@/components/dashboard/TelegramConnection";
import { WhatsAppConnection } from "@/components/dashboard/WhatsAppConnection";
import { AdminNotifications } from "@/components/dashboard/AdminNotifications";
import { BrandingForm } from "@/components/dashboard/BrandingForm";
import { adminClient } from "@/lib/supabase/admin";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { calendar?: string; calendar_error?: string };
}) {
  const org = await getCurrentOrgOrRedirect();
  const { data: notifRow } = await adminClient()
    .from("organisations")
    .select("admin_telegram_chat_id, twilio_account_sid, slug")
    .eq("id", org.id)
    .single();
  const adminLinked = !!notifRow?.admin_telegram_chat_id;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Bot personality & branding</CardTitle>
          <CardDescription>
            These values control how the widget looks and how the bot introduces itself.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm org={org} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>
            Logo and colour palette shown in this dashboard. The widget on your website also picks up the primary colour.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BrandingForm initial={org.settings?.branding ?? {}} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Google Calendar</CardTitle>
          <CardDescription>
            Connect a Google Calendar so trial bookings created via chat appear directly on your team&apos;s calendar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CalendarConnection
            connected={!!org.google_refresh_token}
            calendarId={org.google_calendar_id ?? "primary"}
            successFlag={searchParams.calendar === "connected"}
            errorFlag={searchParams.calendar_error}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>WhatsApp</CardTitle>
          <CardDescription>
            Connect your Twilio WhatsApp number. Parents who message it get the same
            AI chatbot replies — bookings, FAQs, and all. Required for Growth plan features
            (lead nurture, payment reminders).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WhatsAppConnection
            connected={!!notifRow?.twilio_account_sid}
            webhookUrl={
              notifRow?.slug
                ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/whatsapp/${notifRow.slug}`
                : undefined
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Telegram</CardTitle>
          <CardDescription>
            Run a Telegram bot for the centre. Parents who message it get the
            same chatbot answers as the website widget — bookings, FAQs and all.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TelegramConnection connected={!!org.telegram_bot_token} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admin notifications</CardTitle>
          <CardDescription>
            Get a Telegram ping every time something happens — new bookings,
            waitlist entries, parent escalations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminNotifications
            botConnected={!!org.telegram_bot_token}
            adminLinked={adminLinked}
          />
        </CardContent>
      </Card>
    </div>
  );
}

import { getCurrentOrgOrRedirect } from "@/lib/supabase/get-org";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { hexToHslComponents } from "@/lib/branding/hex-to-hsl";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const org = await getCurrentOrgOrRedirect();
  const branding = org.settings?.branding ?? {};

  const overrides: string[] = [];
  const map: [string, string | undefined][] = [
    ["--primary", branding.primary],
    ["--secondary", branding.secondary],
    ["--accent", branding.accent],
    ["--primary-foreground", branding.on_primary],
    ["--accent-foreground", branding.on_primary],
  ];
  for (const [token, hex] of map) {
    if (hex) {
      const hsl = hexToHslComponents(hex);
      if (hsl) overrides.push(`${token}:${hsl}`);
    }
  }
  const themeStyle =
    overrides.length > 0 ? `#org-theme{${overrides.join(";")}}` : "";

  return (
    <>
      {themeStyle && (
        <style dangerouslySetInnerHTML={{ __html: themeStyle }} />
      )}
      <div id="org-theme" className="flex min-h-screen bg-muted/30">
        <Sidebar
          orgName={org.name}
          logoUrl={branding.logo_url ?? null}
        />
        <main className="flex-1 overflow-x-hidden">
          <div className="max-w-6xl mx-auto p-6">{children}</div>
        </main>
      </div>
    </>
  );
}

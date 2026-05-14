import { adminClient } from "@/lib/supabase/admin";
import { getCurrentOrgOrRedirect } from "@/lib/supabase/get-org";
import { Card } from "@/components/ui/card";
import { BookingStatus } from "@/components/dashboard/BookingStatus";
import Link from "next/link";

const STATUSES = ["all", "confirmed", "completed", "no_show", "cancelled"] as const;

type StatusFilter = (typeof STATUSES)[number];

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: { status?: string; location?: string };
}) {
  const org = await getCurrentOrgOrRedirect();
  const filter: StatusFilter = STATUSES.includes(
    (searchParams.status ?? "all") as StatusFilter,
  )
    ? (searchParams.status as StatusFilter)
    : "all";
  const locationFilter = searchParams.location ?? "all";

  const sb = adminClient();
  const { data: locationOptions } = await sb
    .from("locations")
    .select("id, name")
    .eq("org_id", org.id)
    .eq("is_active", true)
    .order("name");

  let query = sb
    .from("bookings")
    .select(
      "id, booking_date, start_time, end_time, status, booking_type, google_calendar_event_id, location_id, students(student_name, parent_name, parent_phone), classes(subject, level), location:locations(name)",
    )
    .eq("org_id", org.id)
    .order("booking_date", { ascending: false })
    .order("start_time", { ascending: false })
    .limit(200);
  if (filter !== "all") query = query.eq("status", filter);
  if (locationFilter !== "all") query = query.eq("location_id", locationFilter);
  const { data: bookings } = await query;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reservations</h1>
          <p className="text-sm text-muted-foreground">
            Reservations made via chat. Click status to mark completed, no-show, or cancel.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/dashboard/bookings?status=${s}${locationFilter !== "all" ? `&location=${locationFilter}` : ""}`}
            className={
              filter === s
                ? "px-3 py-1 rounded-full bg-primary text-primary-foreground capitalize"
                : "px-3 py-1 rounded-full bg-muted text-muted-foreground hover:bg-accent capitalize"
            }
          >
            {s.replace("_", "-")}
          </Link>
        ))}
      </div>

      {(locationOptions ?? []).length > 0 && (
        <div className="flex flex-wrap gap-2 text-sm items-center">
          <span className="text-xs uppercase text-muted-foreground tracking-wide">Outlet:</span>
          <Link
            href={`/dashboard/bookings?status=${filter}`}
            className={
              locationFilter === "all"
                ? "px-3 py-1 rounded-full bg-primary text-primary-foreground"
                : "px-3 py-1 rounded-full bg-muted text-muted-foreground hover:bg-accent"
            }
          >
            All
          </Link>
          {(locationOptions ?? []).map((l) => (
            <Link
              key={l.id}
              href={`/dashboard/bookings?status=${filter}&location=${l.id}`}
              className={
                locationFilter === l.id
                  ? "px-3 py-1 rounded-full bg-primary text-primary-foreground"
                  : "px-3 py-1 rounded-full bg-muted text-muted-foreground hover:bg-accent"
              }
            >
              {l.name}
            </Link>
          ))}
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr className="text-left">
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Time</th>
                <th className="px-4 py-2 font-medium">Guest</th>
                <th className="px-4 py-2 font-medium">Slot</th>
                <th className="px-4 py-2 font-medium">Outlet</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Cal.</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(bookings ?? []).map((b) => {
                type Joined = {
                  students: {
                    student_name: string;
                    parent_name: string | null;
                    parent_phone: string;
                  } | null;
                  classes: { subject: string; level: string } | null;
                  location: { name: string } | null;
                };
                const j = b as unknown as Joined;
                return (
                  <tr key={b.id} className="border-b last:border-0 align-top">
                    <td className="px-4 py-2 whitespace-nowrap">{b.booking_date}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)}
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-medium">{j.students?.student_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {j.students?.parent_name && (
                          <span>{j.students.parent_name} · </span>
                        )}
                        {j.students?.parent_phone}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {j.classes ? `${j.classes.subject} (${j.classes.level})` : "—"}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {j.location?.name ?? "—"}
                    </td>
                    <td className="px-4 py-2 capitalize">{b.booking_type}</td>
                    <td className="px-4 py-2 text-xs">
                      {b.google_calendar_event_id ? (
                        <span className="inline-flex rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 font-medium">
                          synced
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <BookingStatus
                        id={b.id}
                        initial={b.status as "confirmed" | "completed" | "no_show" | "cancelled"}
                      />
                    </td>
                  </tr>
                );
              })}
              {(bookings ?? []).length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    No bookings yet for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

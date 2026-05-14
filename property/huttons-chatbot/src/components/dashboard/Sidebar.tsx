"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Calendar,
  Building2,
  FileText,
  HelpCircle,
  CreditCard,
  Settings,
  BarChart3,
  LayoutDashboard,
  MapPin,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/dashboard/bookings", label: "Viewings", icon: Calendar },
  { href: "/dashboard/waitlist", label: "Pipeline", icon: Filter },
  { href: "/dashboard/classes", label: "Listings/Viewings", icon: Building2 },
  { href: "/dashboard/locations", label: "Offices", icon: MapPin },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/faqs", label: "FAQs", icon: HelpCircle },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ orgName, logoUrl }: { orgName: string; logoUrl?: string | null }) {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 border-r bg-white h-screen sticky top-0 flex flex-col">
      <div className="px-5 py-4 border-b">
        {logoUrl ? (
          <img src={logoUrl} alt={orgName} className="h-8 w-auto object-contain mb-1" />
        ) : (
          <div className="text-xs uppercase text-muted-foreground tracking-wider">
            Huttons Chatbot
          </div>
        )}
        <div className="font-semibold text-sm mt-1 truncate">{orgName}</div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

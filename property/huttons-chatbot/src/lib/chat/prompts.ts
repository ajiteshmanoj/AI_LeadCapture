import type { FAQ, Location, Organisation } from "@/types";
import type { ClassWithLocation, RetrievedChunk, PropertyListingRow } from "./rag";
import { formatSgtDateTime } from "@/lib/utils/dates";

interface BuildPromptArgs {
  org: Organisation;
  classes: ClassWithLocation[];
  listings: PropertyListingRow[];
  locations: Location[];
  faqs: FAQ[];
  chunks: RetrievedChunk[];
}

function formatHours(
  hours: Organisation["operating_hours"],
): string {
  if (!hours) return "Not specified";
  const order = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  return order
    .map((d) => {
      const h = hours[d];
      return h ? `${d.toUpperCase()}: ${h.open}-${h.close}` : null;
    })
    .filter(Boolean)
    .join(", ");
}

function formatClasses(classes: ClassWithLocation[]): string {
  if (classes.length === 0) return "(no active viewing slots)";
  return classes
    .map((c) => {
      const seats = c.max_capacity - c.current_enrollment;
      const seatLabel = seats <= 0 ? "FULL — no slots available" : `${seats} viewing slot(s) left`;
      const loc = c.location?.name ?? "(no office assigned)";
      const propType = c.property_type ? `, ${c.property_type}` : "";
      const tenure = c.tenure ? `, ${c.tenure}` : "";
      const price = c.asking_price
        ? ` | $${(c.asking_price / 1000000).toFixed(1)}M`
        : "";
      const area = c.floor_area_sqft ? ` | ${c.floor_area_sqft} sqft` : "";
      const psf = c.psf ? ` / $${c.psf} psf` : "";
      const district = c.district ? ` | ${c.district}` : "";
      return `- id=${c.id} | ${c.subject} (${c.level}${propType}${tenure}) @ ${loc}${district}${price}${area}${psf} | ${c.day_of_week} ${c.start_time.slice(0, 5)}-${c.end_time.slice(0, 5)} | Agent: ${c.teacher_name ?? "TBC"} | ${seatLabel}`;
    })
    .join("\n");
}

function formatListings(listings: PropertyListingRow[]): string {
  if (listings.length === 0) return "(no active listings)";
  return listings
    .map((l) => {
      const price = l.asking_price
        ? `$${(l.asking_price / 1000000).toFixed(2)}M`
        : "price on request";
      const area = l.floor_area_sqft ? `${l.floor_area_sqft} sqft` : null;
      const psf = l.psf ? `$${l.psf} psf` : null;
      const beds = l.num_bedrooms ? `${l.num_bedrooms}BR` : null;
      const mrt = l.mrt_nearest && l.mrt_distance_minutes
        ? `${l.mrt_nearest} (${l.mrt_distance_minutes} min walk)`
        : l.mrt_nearest ?? null;
      const parts = [beds, area, psf && area ? psf : null, l.tenure, l.district, mrt].filter(Boolean);
      const highlights = l.highlights?.length ? ` | Highlights: ${l.highlights.join(", ")}` : "";
      return `- ${l.title} | ${l.property_type} | ${price} | ${parts.join(" | ")} | Agent: ${l.assigned_agent_name ?? "TBC"}${highlights}`;
    })
    .join("\n");
}

function formatLocations(locations: Location[]): string {
  if (locations.length === 0) return "(no offices configured)";
  return locations
    .map((l) => {
      const parts = [l.address, l.mrt_nearest && `near ${l.mrt_nearest}`].filter(Boolean);
      return `- ${l.name}${parts.length ? ` — ${parts.join(", ")}` : ""}`;
    })
    .join("\n");
}

function formatFaqs(faqs: FAQ[]): string {
  if (faqs.length === 0) return "(no relevant FAQs matched)";
  return faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");
}

function formatContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "(no relevant document context found)";
  return chunks.map((c, i) => `[${i + 1}] ${c.chunk_text}`).join("\n\n");
}

export function buildSystemPrompt({
  org,
  classes,
  listings,
  locations,
  faqs,
  chunks,
}: BuildPromptArgs): string {
  const settings = org.settings ?? {};
  const botName = settings.bot_name ?? "James";
  const contactPerson = settings.contact_person ?? "our property consultants";
  const phone = org.phone ?? "(no phone configured)";
  const email = org.email ?? "(no email configured)";

  return `You are ${botName}, a professional property concierge for Huttons Asia, Singapore's largest private real estate agency with over 5,300 agents.

IMPORTANT RULES:
1. ABSD FIRST: ALWAYS ask for citizenship status before quoting any residential property price. Singapore Citizens, Permanent Residents, and Foreigners have very different ABSD obligations (0%/5%/60% respectively on first/additional properties). Factor this into budget conversations.
2. LEAD QUALIFICATION: Before booking a viewing, always collect: budget range, citizenship status, property type preference (HDB/Condo/Landed), intended use (own stay vs investment), urgency (when looking to buy). This helps us match you with the right agent.
3. CONFIDENTIALITY: Never share another lead's viewing times or offer details.
4. SCOPE: Only discuss Huttons' listed properties and our services. Do not comment on competitor agencies or properties we don't represent. If asked about a property we don't have, say "Let me connect you with one of our agents who can help."
5. HDB RULES: HDB flats can only be purchased by Singapore Citizens and PRs (with restrictions). Foreigners cannot buy HDB. Always clarify eligibility upfront.
6. TONE: Professional, knowledgeable, and trust-building. Property is a major financial decision — be thorough but approachable.

LEAD QUALIFICATION FLOW (collect before booking viewing):
1. What type of property are you looking for? (HDB / Condo / Landed / Commercial)
2. Sale or rental?
3. Preferred district or area?
4. Budget range?
5. Citizenship status? (SC / PR / Foreigner) — affects ABSD
6. First property or additional property?
7. Timeline — when are you looking to complete purchase?
Then score: HOT = ready to buy within 3 months + clear budget + pre-approved loan; WARM = 3–6 months timeline; COLD = >6 months or just browsing
Then trigger: [QUALIFY_LEAD] {"lead_name":"...","lead_score":"hot","budget_min":900000,"budget_max":1200000,"citizenship_status":"SC","preferred_property_type":["Condo"],"preferred_district":["D18","D19"]}

VIEWING BOOKING: After qualification, trigger: [BOOK_VIEWING] {"class_id":"...","lead_name":"...","contact_phone":"...","lead_score":"hot","citizenship_status":"SC","preferred_date":"..."}

HOT LEAD ALERT: If lead is HOT, also trigger: [ALERT_AGENT] {"lead_name":"...","contact_phone":"...","budget":"...","property_interest":"...","urgency":"immediate"}

PDPA: Obtain consent before collecting personal data. Use this notice: "By proceeding, you agree that Huttons Asia may collect and use your personal data for property matching and viewing purposes. Huttons Asia is licensed by the Council for Estate Agencies (CEA). Type STOP to opt out."

STRICT RULES:
1. NEVER make up information. If you don't know something, say: "Let me connect you with ${contactPerson} who can advise — call us at ${phone}."
2. NEVER share other leads' viewing times or offer details.
3. NEVER discuss competitor agencies.
4. If a lead seems upset or has a complaint, acknowledge and say: "Let me connect you with ${contactPerson} who can help resolve this."
5. Always confirm details before creating a viewing booking.
6. Use SGD ($) for all prices. Use psf (price per square foot) comparisons when helpful.
7. Always mention ABSD impact when discussing prices for non-SC buyers.

CURRENT INFORMATION:
- Now: ${formatSgtDateTime()}
- Agency: ${org.name}
- Address: ${org.address ?? "(not configured)"}
- Operating hours: ${formatHours(org.operating_hours)}
- Contact: ${phone} / ${email}

OUR OFFICES (live data):
${formatLocations(locations)}

CURRENT LISTINGS (live data — active properties with viewing slots):
${formatClasses(classes)}

ALL ACTIVE LISTINGS (property_listings table):
${formatListings(listings)}

RELEVANT FAQs:
${formatFaqs(faqs)}

RELEVANT CONTEXT FROM UPLOADED DOCUMENTS:
${formatContext(chunks)}

OTHERWISE: just answer concisely and helpfully — no script needed.`;
}

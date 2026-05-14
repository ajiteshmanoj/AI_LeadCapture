export type Channel = "web" | "whatsapp" | "telegram";

export type Intent =
  | "faq"
  | "booking"
  | "class_booking"
  | "membership"
  | "trial_class"
  | "payment"
  | "complaint"
  | "schedule"
  | "fees"
  | "escalation"
  | "other";

export interface BrandingSettings {
  logo_url?: string;
  primary?: string;
  secondary?: string;
  accent?: string;
  on_primary?: string;
}

export interface Organisation {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  operating_hours: Record<string, { open: string; close: string }> | null;
  google_calendar_id: string | null;
  google_refresh_token: string | null;
  whatsapp_number: string | null;
  telegram_bot_token: string | null;
  stripe_account_id: string | null;
  telegram_bot_username: string | null;
  admin_telegram_chat_id: string | null;
  is_onboarded: boolean;
  onboarding_step: string;
  invite_token: string | null;
  invite_email: string | null;
  invite_expires_at: string | null;
  invite_accepted_at: string | null;
  settings: {
    bot_name?: string;
    welcome_message?: string;
    primary_color?: string;
    contact_person?: string;
    branding?: BrandingSettings;
  };
  created_at: string;
}

export interface ClassRow {
  id: string;
  org_id: string;
  subject: string;
  level: string;
  class_type: "group" | "individual" | "online";
  day_of_week: string;
  start_time: string;
  end_time: string;
  teacher_name: string | null;
  max_capacity: number;
  current_enrollment: number;
  monthly_fee: number;
  registration_fee: number;
  material_fee: number;
  is_active: boolean;
  location_id: string | null;
  created_at: string;
  // Gym-specific fields (migration 011)
  class_category?: string;
  fitness_level?: string;
  class_duration_minutes?: number;
  is_virtual?: boolean;
}

export interface Location {
  id: string;
  org_id: string;
  name: string;
  address: string | null;
  postal_code: string | null;
  mrt_nearest: string | null;
  phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface FAQ {
  id: string;
  org_id: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  org_id: string;
  channel: Channel;
  channel_user_id: string | null;
  student_id: string | null;
  started_at: string;
  last_message_at: string;
  status: "active" | "closed" | "escalated";
  metadata: Record<string, unknown>;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system" | "admin";
  content: string;
  intent: Intent | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Student {
  id: string;
  org_id: string;
  student_name: string;
  parent_name: string | null;
  parent_phone: string;
  parent_email: string | null;
  level: string | null;
  school: string | null;
  status: "lead" | "trial" | "enrolled" | "withdrawn";
  notes: string | null;
  created_at: string;
  // Gym-specific fields (migration 011)
  membership_tier?: string;
  membership_expiry?: string;
  fitness_goals?: string[];
}

export interface Booking {
  id: string;
  org_id: string;
  student_id: string | null;
  class_id: string | null;
  booking_type: "trial" | "trial_class" | "assessment" | "makeup";
  booking_date: string;
  start_time: string;
  end_time: string;
  status: "confirmed" | "cancelled" | "completed" | "no_show";
  google_calendar_event_id: string | null;
  location_id: string | null;
  notes: string | null;
  created_at: string;
  // Gym-specific fields (migration 011)
  is_guest_pass?: boolean;
  membership_tier_at_booking?: string;
}

export interface MembershipTier {
  id: string;
  org_id: string;
  name: string;
  monthly_fee: number | null;
  joining_fee: number;
  included_classes: number | null;
  guest_passes_per_month: number;
  features: string[] | null;
  is_active: boolean;
  created_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  org_id: string;
  chunk_text: string;
  chunk_index: number;
  similarity?: number;
  metadata: Record<string, unknown>;
}

export interface ChatRequest {
  org_id: string;
  conversation_id?: string;
  channel: Channel;
  channel_user_id?: string;
  message: string;
}

export interface ChatResponse {
  conversation_id: string;
  reply: string;
  intent: Intent;
}

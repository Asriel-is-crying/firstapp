export type University = { id: string; name: string; timezone: string };
export type Profile = {
  id: string;
  display_name: string;
  university_id: string | null;
  avatar_url: string | null;
  disabled: boolean;
};
export type Club = {
  id: string;
  name: string;
  slug: string;
  university_id: string;
  description: string;
  contact_email: string;
  logo_url: string | null;
  banner_url: string | null;
  verified: boolean;
  created_at: string;
};
export type Event = {
  id: string;
  club_id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  venue: string;
  starts_at: string;
  ends_at: string;
  registration_opens_at: string;
  registration_closes_at: string;
  capacity: number | null;
  price: number;
  currency: string;
  waitlist_enabled: boolean;
  status: "draft" | "published" | "cancelled" | "disabled";
  cover_url: string | null;
  contact_email: string;
  created_at: string;
  registered?: number;
};
export type Registration = {
  id: string;
  event_id: string;
  user_id: string;
  status: "registered" | "waitlisted" | "cancelled";
  created_at: string;
};
export type Membership = {
  id: string;
  club_id: string;
  user_id: string;
  role: "admin" | "committee";
};
export type TeamMember = { id: string; event_id: string; user_id: string };
export type Role = { id: string; event_id: string; name: string };
export type Window = { starts_at: string; ends_at: string };
export type Availability = Window & {
  id: string;
  event_id: string;
  user_id: string;
};
export type Shift = Window & {
  id: string;
  event_id: string;
  role_id: string;
  name: string;
  description: string;
  location: string;
  required_people: number;
};
export type Assignment = {
  id: string;
  shift_id: string;
  user_id: string;
  status: "pending" | "confirmed" | "declined";
  override_reason: string | null;
};
export type Report = {
  id: string;
  event_id: string | null;
  reported_user_id: string | null;
  reason: string;
  status: string;
};
export type Saved = { id: string; event_id: string; user_id: string };
export type Follow = { id: string; club_id: string; user_id: string };
export const categories = [
  "Arts & Culture",
  "Technology",
  "Sports",
  "Career",
  "Community",
  "Wellbeing",
  "Academic",
  "Social",
];

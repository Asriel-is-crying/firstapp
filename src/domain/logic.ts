import { Club, Event, Window } from "./models";
export function eventState(e: Event, now = new Date()): string {
  const t = now.getTime();
  if (e.status === "cancelled") return "Cancelled";
  if (e.status === "disabled") return "Unavailable";
  if (e.status === "draft") return "Draft";
  if (t >= Date.parse(e.ends_at)) return "Completed";
  if (t >= Date.parse(e.starts_at)) return "Happening Now";
  if (t < Date.parse(e.registration_opens_at))
    return "Registration Not Open Yet";
  if (t >= Date.parse(e.registration_closes_at)) return "Registration Closed";
  if (e.capacity !== null && (e.registered ?? 0) >= e.capacity)
    return e.waitlist_enabled ? "Waitlist" : "Full";
  return "Upcoming";
}
export const overlaps = (a: Window, b: Window) =>
  Date.parse(a.starts_at) < Date.parse(b.ends_at) &&
  Date.parse(b.starts_at) < Date.parse(a.ends_at);
export function availabilityStatus(
  shift: Window,
  windows: Window[],
  others: Window[] = [],
) {
  if (others.some((w) => overlaps(w, shift)))
    return "Already Assigned Elsewhere";
  const sorted = windows
    .filter((w) => overlaps(w, shift))
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
  let cursor = Date.parse(shift.starts_at);
  for (const w of sorted) {
    if (Date.parse(w.starts_at) > cursor) break;
    cursor = Math.max(cursor, Date.parse(w.ends_at));
  }
  if (cursor >= Date.parse(shift.ends_at)) return "Available";
  return sorted.length ? "Partially Available" : "Unavailable";
}
export type Filters = {
  query: string;
  date: string;
  category: string;
  price: string;
  available: boolean;
  club: string;
  sort: string;
  university: string;
};
export const defaultFilters: Filters = {
  query: "",
  date: "Any time",
  category: "All categories",
  price: "Any price",
  available: false,
  club: "",
  sort: "Soonest",
  university: "",
};
export function discover(
  events: Event[],
  clubs: Club[],
  f: Filters,
  now = new Date(),
) {
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const start = midnight.getTime(),
    day = 86400000;
  return events
    .filter((e) => {
      const club = clubs.find((c) => c.id === e.club_id);
      const t = Date.parse(e.starts_at);
      return (
        e.status === "published" &&
        Date.parse(e.ends_at) > now.getTime() &&
        (!f.university || club?.university_id === f.university) &&
        `${e.title} ${e.description} ${club?.name ?? ""}`
          .toLowerCase()
          .includes(f.query.toLowerCase().trim()) &&
        (f.category === "All categories" || e.category === f.category) &&
        (f.price === "Any price" ||
          (f.price === "Free" ? Number(e.price) === 0 : Number(e.price) > 0)) &&
        (!f.club || e.club_id === f.club) &&
        (!f.available ||
          ["Upcoming", "Waitlist"].includes(eventState(e, now))) &&
        (f.date === "Any time" ||
          (f.date === "Today"
            ? t >= start && t < start + day
            : f.date === "Tomorrow"
              ? t >= start + day && t < start + 2 * day
              : t >= start && t < start + 7 * day))
      );
    })
    .sort((a, b) =>
      f.sort === "Popular"
        ? (b.registered ?? 0) - (a.registered ?? 0)
        : f.sort === "Newest"
          ? Date.parse(b.created_at) - Date.parse(a.created_at)
          : Date.parse(a.starts_at) - Date.parse(b.starts_at),
    );
}
export function slugify(text: string, suffix: string) {
  return `${
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "campus"
  }-${suffix}`;
}
export function safeReturn(path: unknown) {
  return typeof path === "string" && /^\/(?!\/)[a-zA-Z0-9/_-]*$/.test(path)
    ? path
    : "/";
}
export function dateLabel(iso: string, timezone?: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...(timezone ? { timeZone: timezone } : {}),
  }).format(new Date(iso));
}

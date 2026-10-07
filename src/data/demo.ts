import { Club, Event, University, categories } from "../domain/models";
const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export const demoUniversity: University = {
  id: uuid(1),
  name: "Meridian University",
  timezone: "Asia/Kuala_Lumpur",
};
const names = [
  "Creative Arts Society",
  "Developer Student Club",
  "Outdoor & Adventure",
  "Career Collective",
  "Green Campus",
  "Mindful Students",
  "Science Society",
  "International Students",
];
export const demoClubs: Club[] = names.map((name, i) => ({
  id: uuid(10 + i),
  name,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  university_id: uuid(1),
  description: `Find your people at ${name}. We bring students together through hands-on activities, welcoming socials, and opportunities to make a difference on campus. Everyone is welcome.`,
  contact_email: `club${i + 1}@example.edu`,
  verified: i < 6,
  logo_url: null,
  banner_url: null,
  created_at: new Date().toISOString(),
}));
const titles = [
  "Open Mic Under the Stars",
  "Build Your First App",
  "Sunrise Trail Walk",
  "Meet Your Future: Career Mixer",
  "Campus Garden Morning",
  "Pause & Breathe",
  "Science After Hours",
  "Around the World Potluck",
  "Printmaking Studio",
  "Hack for Good Weekend",
  "Friday Futsal",
  "CV Clinic & Headshots",
  "Swap, Don’t Shop",
  "Yoga on the Lawn",
  "Astronomy on the Roof",
  "Language Exchange Café",
  "Campus Film Night",
  "Design to Code Workshop",
  "Climbing for Beginners",
  "Internship Stories",
];
const covers = [
  "photo-1516280440614-37939bbacd81",
  "photo-1516321318423-f06f85e504b3",
  "photo-1551632811-561732d1e306",
  "photo-1511795409834-ef04bbd61622",
  "photo-1416879595882-3373a0480b5b",
  "photo-1544367567-0f2fcb009e0b",
  "photo-1532094349884-543bc11b234d",
  "photo-1529156069898-49953e39b3ac",
];
export const demoEvents: Event[] = titles.map((title, i) => {
  const start = new Date();
  start.setDate(start.getDate() + 1 + Math.floor(i / 3));
  start.setHours(10 + (i % 4) * 2, 0, 0, 0);
  const end = new Date(start.getTime() + 7200000),
    open = new Date(start.getTime() - 14 * 86400000);
  return {
    id: uuid(100 + i),
    club_id: uuid(10 + (i % 8)),
    title,
    slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${100 + i}`,
    description: `Take a break from the ordinary and join ${demoClubs[i % 8].name} for ${title.toLowerCase()}. Meet students from across campus, learn something new, and make a few good memories.\n\nCome as you are. No previous experience is needed. Bring your student ID and arrive 15 minutes early so we can get you settled. Our committee will be at the entrance to welcome you.\n\nAccessibility questions? Contact our organizers before the event and we will help you plan your visit.`,
    category: categories[i % 8],
    venue: [
      "Student Centre · Main Hall",
      "Innovation Lab · Level 2",
      "North Gate",
      "Library · Collaboration Space",
    ][i % 4],
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
    registration_opens_at: open.toISOString(),
    registration_closes_at: start.toISOString(),
    capacity: 40 + i * 5,
    price: i % 5 === 0 ? 10 : 0,
    currency: "MYR",
    waitlist_enabled: true,
    status: "published",
    cover_url: `https://images.unsplash.com/${covers[i % 8]}?auto=format&fit=crop&w=1000&q=80`,
    contact_email: `club${(i % 8) + 1}@example.edu`,
    created_at: new Date(open.getTime() + i * 3600000).toISOString(),
    registered: 12 + i,
  };
});

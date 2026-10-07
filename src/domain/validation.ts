import { z } from "zod";
export const email = z.email("Enter a valid email address");
export const password = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(128);
export const eventSchema = z
  .object({
    title: z.string().min(3).max(160),
    description: z.string().min(20).max(10000),
    category: z.string().min(1),
    venue: z.string().min(2),
    starts_at: z.iso.datetime({ offset: true }),
    ends_at: z.iso.datetime({ offset: true }),
    registration_opens_at: z.iso.datetime({ offset: true }),
    registration_closes_at: z.iso.datetime({ offset: true }),
    capacity: z.number().int().positive().nullable(),
    price: z.number().nonnegative(),
    contact_email: email,
    waitlist_enabled: z.boolean(),
    cover_url: z.string().nullable(),
    status: z.enum(["draft", "published", "cancelled"]),
    slug: z.string(),
  })
  .superRefine((e, ctx) => {
    if (Date.parse(e.ends_at) <= Date.parse(e.starts_at))
      ctx.addIssue({
        code: "custom",
        path: ["ends_at"],
        message: "End must be after start",
      });
    if (Date.parse(e.registration_closes_at) > Date.parse(e.starts_at))
      ctx.addIssue({
        code: "custom",
        path: ["registration_closes_at"],
        message: "Close registration by event start",
      });
    if (
      Date.parse(e.registration_opens_at) >=
      Date.parse(e.registration_closes_at)
    )
      ctx.addIssue({
        code: "custom",
        path: ["registration_opens_at"],
        message: "Registration must open before closing",
      });
  });
export function validateImage(size: number, type: string) {
  if (size > 5 * 1024 * 1024)
    throw new Error("Choose an image smaller than 5 MB");
  if (!["image/jpeg", "image/png", "image/webp"].includes(type))
    throw new Error("Use a JPEG, PNG or WebP image");
}

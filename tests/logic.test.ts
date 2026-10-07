import { describe, it, expect } from "vitest";
import { demoEvents, demoClubs } from "../src/data/demo";
import {
  availabilityStatus,
  defaultFilters,
  discover,
  eventState,
  safeReturn,
} from "../src/domain/logic";
import {
  eventSchema,
  validateImage,
  email,
  password,
} from "../src/domain/validation";
const window = (start: number, end: number) => ({
  starts_at: new Date(start * 3600000).toISOString(),
  ends_at: new Date(end * 3600000).toISOString(),
});
describe("scheduling", () => {
  it("merges adjacent availability and handles half-open boundaries", () => {
    expect(
      availabilityStatus(
        window(10, 12),
        [window(10, 11), window(11, 12)],
        [window(8, 10)],
      ),
    ).toBe("Available");
  });
  it("does not cover a gap", () =>
    expect(
      availabilityStatus(window(10, 12), [window(10, 11), window(11.5, 12)]),
    ).toBe("Partially Available"));
  it("prioritizes overlapping assignments", () =>
    expect(
      availabilityStatus(window(10, 12), [window(9, 13)], [window(11, 14)]),
    ).toBe("Already Assigned Elsewhere"));
  it("has no availability by default", () =>
    expect(availabilityStatus(window(10, 12), [])).toBe("Unavailable"));
});
describe("registration states", () => {
  const e = {
    ...demoEvents[0],
    registration_opens_at: new Date(1000).toISOString(),
    registration_closes_at: new Date(3000).toISOString(),
    starts_at: new Date(4000).toISOString(),
    ends_at: new Date(5000).toISOString(),
  };
  it.each([
    [0, "Registration Not Open Yet"],
    [2000, "Upcoming"],
    [3000, "Registration Closed"],
    [4000, "Happening Now"],
    [5000, "Completed"],
  ])("at %i returns %s", (now, state) =>
    expect(eventState(e, new Date(now))).toBe(state),
  );
  it("cancelled takes precedence", () =>
    expect(eventState({ ...e, status: "cancelled" }, new Date(6000))).toBe(
      "Cancelled",
    ));
  it("waitlists only when enabled", () => {
    expect(
      eventState(
        { ...e, registered: 50, capacity: 50, waitlist_enabled: true },
        new Date(2000),
      ),
    ).toBe("Waitlist");
    expect(
      eventState(
        { ...e, registered: 50, capacity: 50, waitlist_enabled: false },
        new Date(2000),
      ),
    ).toBe("Full");
  });
});
describe("discovery and input validation", () => {
  it("finds events by club", () =>
    expect(
      discover(demoEvents, demoClubs, {
        ...defaultFilters,
        query: demoClubs[1].name,
      }).every((e) => e.club_id === demoClubs[1].id),
    ).toBe(true));
  it("combines price and category filters", () =>
    expect(
      discover(demoEvents, demoClubs, {
        ...defaultFilters,
        price: "Free",
        category: "Technology",
      }).every((e) => e.price === 0 && e.category === "Technology"),
    ).toBe(true));
  it("rejects external return links", () => {
    expect(safeReturn("//evil.example")).toBe("/");
    expect(safeReturn("https://evil.example")).toBe("/");
    expect(safeReturn("/events/a")).toBe("/events/a");
  });
  it("rejects oversized and executable uploads", () => {
    expect(() => validateImage(6 * 1024 * 1024, "image/png")).toThrow();
    expect(() => validateImage(100, "image/svg+xml")).toThrow();
    expect(() => validateImage(200, "image/jpeg")).not.toThrow();
  });
  it("validates sign-up inputs", () => {
    expect(email.safeParse("bad").success).toBe(false);
    expect(password.safeParse("short").success).toBe(false);
  });
  it("rejects backwards event times", () =>
    expect(
      eventSchema.safeParse({
        ...demoEvents[0],
        ends_at: demoEvents[0].starts_at,
      }).success,
    ).toBe(false));
});

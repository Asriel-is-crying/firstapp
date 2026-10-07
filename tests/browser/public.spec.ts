import { test, expect } from "@playwright/test";
const widths = [375, 430, 768, 1024, 1440];
for (const width of widths) {
  test(
    "public mobile and desktop flows at " + width + "px",
    async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto("/");
      await expect(
        page.getByText("Happening soon", { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText("Open Mic Under the Stars", { exact: true }).first(),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: "test-results/home-" + width + ".png",
        fullPage: true,
      });
      await page.goto("/explore");
      await page
        .getByLabel("Search events, clubs or keywords")
        .fill("Build Your First App");
      await expect(
        page.getByText("1 events to discover", { exact: true }),
      ).toBeVisible();
      await page
        .getByRole("link")
        .filter({ hasText: "Build Your First App" })
        .click();
      await expect(
        page.getByRole("button", { name: "Register for event", exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await page.reload();
      await expect(
        page.getByText("Good to know", { exact: true }),
      ).toBeVisible();
      await page.screenshot({
        path: "test-results/event-" + width + ".png",
        fullPage: true,
      });
      await page
        .getByRole("button", { name: "Register for event", exact: true })
        .click();
      await expect(page.getByLabel("Email address")).toBeVisible();
      await expect(page).toHaveURL(/auth\/login/);
      await page.getByRole("button", { name: "Sign up", exact: true }).click();
      await expect(page.getByLabel("Your name")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await page.goto("/manage");
      await expect(
        page.getByText("Make it your campus", { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Manage Club", exact: true }),
      ).toHaveCount(0);
      await page.goto("/admin");
      await expect(
        page.getByText("Make it your campus", { exact: true }),
      ).toBeVisible();
      await page.goto("/events/nonexistent-event");
      await expect(
        page.getByText("Event unavailable", { exact: true }),
      ).toBeVisible();
      expect(errors).toEqual([]);
    },
  );
}
test("filters, clubs, auth validation and copy link fallback", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/explore");
  await page.getByRole("button", { name: "More filters", exact: true }).click();
  await page.getByRole("button", { name: "Free", exact: true }).click();
  await page.getByRole("button", { name: "Technology", exact: true }).click();
  await expect(
    page.getByText("Build Your First App", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Open Mic Under the Stars", { exact: true }),
  ).toHaveCount(0);
  await page.goto("/clubs/developer-student-club");
  await expect(
    page.getByRole("button", { name: "Follow club", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Follow club", exact: true }).click();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await page.getByLabel("Email address").fill("not-an-email");
  await page
    .getByRole("button", { name: "Log in", exact: true })
    .last()
    .click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.goto("/events/build-your-first-app-101");
  await page.evaluate(() =>
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
    }),
  );
  await page.getByRole("button", { name: "Share event", exact: true }).click();
  await expect(page.getByText("Link copied", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "/events/build-your-first-app-101",
  );
});

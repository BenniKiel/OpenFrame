import { expect, test } from "@playwright/test";

test("home loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "OpenFrame" })).toBeVisible();
});

test("health endpoint responds", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  await expect(res.json()).resolves.toMatchObject({ ok: true, service: "openframe" });
});

import { randomBytes } from "node:crypto";

import { test, expect } from "@playwright/test";

/** Fresh slug so parallel e2e runs do not mutate the same SQLite row as `home`. */
const editorSlug = `e2eland${randomBytes(4).toString("hex")}`;

test("build landing page", async ({ page }) => {
  await page.goto(`/admin/editor?slug=${encodeURIComponent(editorSlug)}`);

  // Wait for editor to load
  await expect(page.locator(".ec-tree-btn", { hasText: "Page" })).toBeVisible();

  // Select the root Page
  await page.locator(".ec-tree-btn", { hasText: "Page" }).click();

  // Add Hero Section
  await page.locator(".ec-props-action-btn", { hasText: "Section" }).click();
  await page.getByLabel("Layer Name").fill("Hero Section");
  
  // Add a Heading to the Hero Section
  await page.locator(".ec-props-action-btn", { hasText: "Heading" }).click();
  await page.getByLabel("Layer Name").fill("Hero Heading");
  await page.getByLabel("Text", { exact: true }).fill("Welcome to our SaaS");

  // Select the Hero Section again
  await page.locator(".ec-tree-btn", { hasText: "Hero Section" }).click();

  // Add a Text block for the subtitle
  await page.locator(".ec-props-action-btn", { hasText: "Text", exact: true }).click();
  await page.getByLabel("Layer Name").fill("Hero Subtitle");
  await page.getByLabel("Content", { exact: true }).fill("The best tool for your team.");

  // Select the Hero Section again
  await page.locator(".ec-tree-btn", { hasText: "Hero Section" }).click();

  // Add a Button for the CTA
  await page.locator(".ec-props-action-btn", { hasText: "Button" }).click();
  await page.getByLabel("Layer Name").fill("Hero CTA");
  await page.getByLabel("Label").fill("Get Started");

  // Save the page
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForTimeout(1000);
});

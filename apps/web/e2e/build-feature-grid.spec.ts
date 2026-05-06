import { test, expect } from "@playwright/test";

test("build feature grid", async ({ page }) => {
  await page.goto("/admin/editor?slug=home");

  // Wait for editor to load
  await expect(page.locator(".ec-tree-btn", { hasText: "Page" })).toBeVisible();

  // Select the root Page
  await page.locator(".ec-tree-btn", { hasText: "Page" }).click();

  // Add Feature Section
  await page.locator(".ec-props-action-btn", { hasText: "Section" }).click();
  await page.getByLabel("Layer Name").fill("Feature Section");
  
  // Add a Heading to the Feature Section
  await page.locator(".ec-props-action-btn", { hasText: "Heading" }).click();
  await page.getByLabel("Layer Name").fill("Feature Heading");
  await page.getByLabel("Text", { exact: true }).fill("Amazing Features");

  // Select the Feature Section again
  await page.locator(".ec-tree-btn", { hasText: "Feature Section" }).click();

  // Add a Frame for the grid
  await page.locator(".ec-props-action-btn", { hasText: "Frame" }).click();
  await page.getByLabel("Layer Name").fill("Feature Grid");
  
  // Change layout to Grid
  await page.locator(".ec-tab-segment-btn", { hasText: "Grid" }).click();

  // Add 3 feature cards
  for (let i = 1; i <= 3; i++) {
    // Select the grid
    await page.locator(".ec-tree-btn", { hasText: "Feature Grid" }).click();
    
    // Add a Frame for the feature card
    await page.locator(".ec-props-action-btn", { hasText: "Frame" }).click();
    await page.getByLabel("Layer Name").fill(`Feature Card ${i}`);
    
    // Add a Heading to the feature card
    await page.locator(".ec-props-action-btn", { hasText: "Heading" }).click();
    await page.getByLabel("Text", { exact: true }).fill(`Feature ${i}`);
    
    // Select the feature card again
    await page.locator(".ec-tree-btn", { hasText: `Feature Card ${i}` }).click();
    
    // Add a Text to the feature card
    await page.locator(".ec-props-action-btn", { hasText: "Text", exact: true }).click();
    await page.getByLabel("Content", { exact: true }).fill(`Description for feature ${i}`);
  }

  // Save the page
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForTimeout(1000);
});

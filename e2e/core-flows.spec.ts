import { expect, test } from "@playwright/test";

test("browse questions, select an approach, play its walkthrough and switch themes", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#questions");
  await expect(page.getByRole("heading", { name: /find your next/i })).toBeVisible();
  await page.getByRole("link", { name: /binary search/i }).first().click();
  await expect(page.getByRole("heading", { name: "Binary Search", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: /algorithm animation/i })).toBeVisible();
  const selector = page.getByRole("combobox", { name: "Choose an approach" });
  await selector.click();
  await page.getByRole("option", { name: /Brute force/i }).click();
  await expect(page.locator(".trace-mode")).toHaveText("Conceptual walkthrough");
  await expect(page.getByRole("button", { name: "Play animation" })).toBeVisible();
  await page.getByRole("button", { name: "Play animation" }).click();
  await expect(page.getByRole("button", { name: "Pause animation" })).toBeVisible();
  await page.getByRole("button", { name: "Pause animation" }).click();
  const previousTheme = await page.locator("html").getAttribute("data-theme");
  const nextTheme = previousTheme === "dark" ? "light" : "dark";
  await page.locator(".theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", nextTheme);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", nextTheme);
  expect(errors).toEqual([]);
});

test("renders the responsive question sheet and existing topic lesson", async ({ page }) => {
  for (const width of [375, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#questions");
    await expect(page.getByRole("heading", { name: /find your next/i })).toBeVisible();
    expect(await page.locator("body").evaluate((body) => body.scrollWidth)).toBeLessThanOrEqual(width);
  }
  await page.getByPlaceholder(/search questions/i).fill("Binary Search");
  await expect(page.getByRole("link", { name: /binary search/i }).first()).toBeVisible();
  await page.goto("/#topic/0");
  await expect(page.getByRole("heading", { name: "Foundation" })).toBeVisible();
  await expect(page.getByText(/invariant to remember/i)).toBeVisible();
});

test("loads and switches the interactive concept models on the home page", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#home");
  await page.evaluate(async () => { await document.fonts.ready; return true; });
  expect(await page.evaluate(() => document.fonts.check('16px "DM Sans Variable"'))).toBe(true);
  expect(await page.locator("body").evaluate((body) => getComputedStyle(body).fontSize)).toBe("16px");
  expect(await page.locator(".eyebrow").first().evaluate((label) => getComputedStyle(label).fontFamily)).toContain("DM Sans Variable");
  await expect(page.locator(".concept-lab-header strong").first()).toHaveText("Trapping rain water");
  await expect(page.getByText("Water trapped so far")).toBeVisible();
  await page.getByRole("button", { name: "Next featured model" }).click();
  await expect(page.locator(".concept-lab-header strong").first()).toHaveText("Binary search");
  await expect(page.getByText(/Find 13 in a sorted array/)).toBeVisible();
  expect(errors).toEqual([]);
});

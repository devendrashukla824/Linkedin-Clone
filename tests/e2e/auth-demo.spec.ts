import { expect, test } from "@playwright/test";

test("demo user can open the protected feed", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue with demo account" }).click();
  await expect(page.getByPlaceholder("Start a professional conversation")).toBeVisible();
  await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
});

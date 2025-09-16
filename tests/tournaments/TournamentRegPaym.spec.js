const { test, expect } = require('@playwright/test');
import { createAccount, login } from "../helpers";

test.describe("Registration & Payment tab", () => {
  test.beforeEach(async ({ page }) => {
    await createAccount(page);
    await login(page);
    await page.click("#tournamentsMode");
    await page.click("#tournamentModeActionBtn");
    await page.getByText("Registration & Payment").click();
  })

  test("It should have 'Registration & Payment' in the title", async ({ page }) => {
    await expect(page.locator("#tournamentFormHeader")).toHaveText("Registration & Payment");
  })

  test("It should show error box after submitting empty form", async ({ page }) => {
    await page.getByText("Save & Exit").click();

    await expect(page.locator("#tournamentErrorBox")).toBeVisible();
  })

  test("It should show the error if the end date < start date", async ({ page }) => {
    await page.locator("#regStartDate").fill('2024-04-05');
    await page.locator("#regEndDate").fill('2024-04-04');

    await page.getByText("Save & Exit").click();
    await expect(page.locator("#tournamentErrorBox")).toContainText("Registration end date must be on or after start date");
  })

  test("The invalid input should be focused after clicking on the related error message", async ({ page }) => {
    await page.getByText("Save & Exit").click();
    const errorBox = await page.locator("#tournamentErrorBox");

    await errorBox.locator("a").nth(0).click();

    await expect(page.locator("#regStartDate")).toBeFocused();
  })

  test("It should redirect to the previous tab after clicking 'Previous'", async ({ page }) => {
    await page.getByText("Previous").click();

    await expect(page.url()).toContain("/competitions/newTournament/basicInfo");
  })

  test("It should redirect to the '/competitions/' after clicking 'Cancel Changes & Exit'", async ({ page }) => {
    await page.getByText("Cancel Changes & Exit").click();

    await expect(page.url()).toMatch(/competitions\/$/);
  })

  test("It should redirect to the next tab after filling and submitting the form", async ({ page }) => {
    await page.locator("#regStartDate").fill('2024-04-04');
    await page.locator("#regEndDate").fill('2024-04-05');
    await page.locator("#capRegAt").fill("20");
    await page.locator("#processingPercent").fill("10");
    await page.locator("#processingFee").fill("2");

    await page.getByText("Save & Next").click();

    await expect(page.url()).toContain("/competitions/newTournament/colorTheme");
  })
})
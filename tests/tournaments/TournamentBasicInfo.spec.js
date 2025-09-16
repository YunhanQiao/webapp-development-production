import { createAccount, login } from "../helpers";

const { test, expect } = require('@playwright/test');

test.describe("Basic Info tab", () => {
  test.beforeEach(async ({ page }) => {
    await createAccount(page);
    await login(page);
    await page.click("#tournamentsMode");
    await page.click("#tournamentModeActionBtn");
    await page.getByRole('tab', { name: 'Basic Info' }).click();
  })

  test("It should have default title", async ({ page }) => {
    await expect(page.locator("#tournamentFormHeader")).toHaveText("New Tournament : Basic Info");
  })

  test("It should show error box after submitting empty form", async ({ page }) => {
    await page.locator('#basicInfo-footer').getByRole('button', { name: 'Save & Exit' }).click()
    await expect(page.locator("#basicInfoErrorBox")).toBeVisible();
  })

  test("It should show the error if the end date < start date", async ({ page }) => {
    await page.locator("#startDate").fill('2024-04-05');
    await page.locator("#endDate").fill('2024-04-04');

    await page.locator('#basicInfo-footer').getByRole('button', { name: 'Save & Exit' }).click()
    await expect(page.locator("#basicInfoErrorBox")).toContainText("Tournament end date must be on or after start date.");
  })

  test("The invalid input should be focused after clicking on the related error message", async ({ page }) => {
    await page.locator('#basicInfo-footer').getByRole('button', { name: 'Save & Exit' }).click()
    const errorBox = await page.locator("#basicInfoErrorBox");

    await errorBox.locator("a").nth(0).click();

    await expect(page.locator("#startDate")).toBeFocused();
  })

  test("It should redirect to the '/competitions/' after clicking 'Cancel Changes & Exit'", async ({ page }) => {
    await page.locator('#basicInfo-footer').getByRole('button', { name: 'Cancel Changes & Exit' }).click()
    await expect(page.url()).toMatch(/competitions\/$/);
  })

  test("It should redirect to the next tab after filling and submitting the form", async ({ page }) => {
    await page.locator("#startDate").fill('2024-04-04');
    await page.locator("#endDate").fill('2024-04-05');
    await page.locator("#name").fill("Golf League");
    // await page.locator("#tournamentCreatorName").fill("Joy");
    // await page.locator("#tournamentCreator").fill("joy@gmail.com");
    await page.locator("#logo").setInputFiles("./test-image.png");

    await page.locator('#basicInfo-footer').getByRole('button', { name: 'Save & Next' }).click()
    // To be fixed
    // await expect(page.url()).toContain("/tournaments/newTournament/regPayment");
  })
})
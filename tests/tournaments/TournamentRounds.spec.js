import { createAccount, login } from "../helpers";

const { test, expect } = require("@playwright/test");

test.describe("Rounds Tab", () => {
  test.beforeEach(async ({ page }) => {
    await createAccount(page);
    await login(page);
    await page.click("#tournamentsMode");
    await page.click("#tournamentModeActionBtn");
    await page.getByRole("tab", { name: "Rounds" }).click();
  });

  test("It should have 'Rounds' in the title", async ({ page }) => {
    await expect(page.locator("#tournamentFormHeader")).toHaveText("New Tournament : Rounds");
  });

  test("It should show error box after submitting empty form", async ({ page }) => {
    await page.locator('#rounds-footer').getByRole('button', { name: 'Save & Exit' }).click()

    await expect(page.locator("#roundErrorBox")).toBeVisible();
  })

  test("On selecting Number of Tournament Rounds 2, last info box should have Round 2 heading", async ({ page }) => {
    await page.locator("#roundsCount").selectOption({value: '2'});

    await expect(page.locator('.rounds-title').locator('nth=-1')).toHaveText("Round 2");
  })

  test("It should redirect to the previous tab after clicking 'Previous'", async ({ page }) => {
    await page.locator('#rounds-footer').getByRole('button', { name: 'Previous' }).click()

    await expect(page.url()).toContain("/competitions/newTournament/courses");
  })

  test("It should redirect to the '/competitions/' after clicking 'Cancel Changes & Exit'", async ({ page }) => {
    await page.locator('#rounds-footer').getByRole('button', { name: 'Cancel Changes & Exit' }).click()

    await expect(page.url()).toMatch(/competitions\/$/);
  })

  test("It should redirect to the next tab after filling and submitting the form", async ({ page }) => {
    await page.locator("#roundsCount").selectOption({value: '1'});
    await page.locator("#startDate-0").fill('2024-12-05');

    await page.locator('#rounds-footer').getByRole('button', { name: 'Save & Next' }).click()

    await expect(page.url()).toContain("/competitions/newTournament/divisions");
  })
});

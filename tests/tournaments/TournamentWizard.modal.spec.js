const { test, expect } = require("@playwright/test");

const LOGIN_EMAIL = "seal-osu@gmail.com";
const LOGIN_PASSWORD = "GoodLuck2025!";

/**
 * Helper function to login with credentials
 */
async function loginWithCredentials(page) {
  await page.goto("http://localhost:3000/login", {
    waitUntil: "networkidle",
  });

  // Clear storage
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  await page.waitForLoadState("domcontentloaded");
  await page.waitForSelector("form", { timeout: 10000 });

  await page.getByLabel(/email/i).fill(LOGIN_EMAIL);
  await page.getByLabel(/password/i).fill(LOGIN_PASSWORD);

  const [response] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/auth/login") &&
        response.request().method() === "POST",
    ),
    page.getByRole("button", { name: "Log In" }).click(),
  ]);

  if (response.status() === 200) {
    await page.waitForURL(/.*\/feed/, { timeout: 10000 });
    await page
      .getByRole("tab", { name: "Competitions" })
      .waitFor({ timeout: 10000 });
  } else {
    throw new Error("Login failed");
  }
}

/**
 * Helper function to dismiss initial alerts that may block interactions
 */
async function dismissInitialAlerts(page) {
  try {
    await page.waitForSelector(".alert", { timeout: 3000 });
  } catch {
    return;
  }

  const alerts = page.locator(".alert");
  const alertCount = await alerts.count();

  for (let i = 0; i < alertCount; i++) {
    const alert = alerts.nth(i);
    if (!(await alert.isVisible())) continue;

    const closeButton = alert.locator(
      '.btn-close, button[data-bs-dismiss="alert"]',
    );

    if (await closeButton.isVisible()) {
      await closeButton.click();
      await expect(alert).toBeHidden({ timeout: 3000 });
    }
  }

  await page.waitForTimeout(500);
}

test.describe("Tournament Wizard Modal Behavior", () => {
  test.beforeEach(async ({ page }) => {
    // Setup global dialog handler
    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });
  });

  test("should hide mode tab bar when New Tournament button is clicked", async ({
    page,
  }) => {
    // Login and navigate to Competitions tab
    await loginWithCredentials(page);
    await dismissInitialAlerts(page);

    // Navigate to Competitions/Tournaments mode
    const tournamentsModeButton = page.getByRole("tab", {
      name: "Competitions",
    });
    await tournamentsModeButton.click();
    await page.waitForTimeout(1000);

    // Verify mode tab bar is visible BEFORE opening wizard
    const modeTabBar = page.locator("#modeTabs, .modetab-container");
    await expect(modeTabBar).toBeVisible();
    console.log("✅ Mode tab bar is visible before wizard opens");

    // Click "New Tournament" button to open wizard
    const newTournamentButton = page.getByRole("button", {
      name: "New Tournament",
    });
    await newTournamentButton.waitFor({ state: "visible", timeout: 10000 });
    await newTournamentButton.click();
    await page.waitForTimeout(2000);

    // Wait for wizard to load
    await page.waitForSelector(".mode-page.action-dialog", { timeout: 10000 });
    console.log("✅ Tournament wizard opened");

    // Verify mode tab bar is HIDDEN when wizard is open
    const isModeTabBarHidden = await modeTabBar.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.display === "none" || style.visibility === "hidden";
    });
    expect(isModeTabBarHidden).toBe(true);
    console.log("✅ Mode tab bar is hidden when wizard is open");

    console.log(
      "\n🎉 TEST PASSED: Mode tab bar is dismissed when New Tournament button is clicked",
    );
  });
});

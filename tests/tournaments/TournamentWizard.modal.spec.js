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

  test("Tournament Wizard Modal - Mode tab should be hidden when wizard is open, Basic Info tab is active and other tabs are disabled", async ({
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

    // Click "New Tournament" button to open wizard
    const newTournamentButton = page.getByRole("button", {
      name: "New Tournament",
    });
    await newTournamentButton.waitFor({ state: "visible", timeout: 10000 });
    await newTournamentButton.click();
    await page.waitForTimeout(2000);

    // Wait for wizard to load
    await page.waitForSelector(".mode-page.action-dialog", { timeout: 10000 });

    // TEST 1: Verify mode tab bar is HIDDEN when wizard is open
    const isModeTabBarHidden = await modeTabBar.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.display === "none" || style.visibility === "hidden";
    });
    expect(isModeTabBarHidden).toBe(true);
    console.log("✓ TEST 1: Mode tab bar is hidden when wizard opens");

    // TEST 2: Verify Basic Info tab is active
    const basicInfoTab = page.locator(
      '.nav-link:has-text("Basic Info"), .nav-link:has-text("Basic Tournament Information")',
    );
    await expect(basicInfoTab).toBeVisible();
    await expect(basicInfoTab).toHaveClass(/active/);
    console.log("✓ TEST 2: Basic Info tab is active");

    // TEST 3: Verify other tabs are disabled/grayed out
    const tabsToCheck = [
      "Color Theme",
      "Courses",
      "Divisions",
      "Registration & Payment",
    ];

    for (const tabName of tabsToCheck) {
      const tab = page.locator(`.nav-link:has-text("${tabName}")`);
      await expect(tab).toBeVisible();

      // Check if tab is disabled (has 'disabled' class or attribute)
      const isDisabled = await tab.evaluate((el) => {
        return (
          el.classList.contains("disabled") ||
          el.hasAttribute("disabled") ||
          el.getAttribute("aria-disabled") === "true" ||
          el.style.pointerEvents === "none"
        );
      });

      expect(isDisabled).toBe(true);

      // Verify tab is grayed out (check opacity or color)
      const isGrayedOut = await tab.evaluate((el) => {
        const style = window.getComputedStyle(el);
        const opacity = parseFloat(style.opacity);
        const cursor = style.cursor;
        return opacity < 1 || cursor === "not-allowed" || cursor === "default";
      });

      expect(isGrayedOut).toBe(true);
    }
    console.log("✓ TEST 3: All other tabs are disabled and grayed out");

    console.log(
      "\n🎉 ALL TESTS PASSED: Mode tab bar hidden, Basic Info active, other tabs disabled",
    );
  });
});

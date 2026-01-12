const { test, expect } = require("@playwright/test");

const LOGIN_EMAIL = "seal-osu@gmail.com";
const LOGIN_PASSWORD = "GoodLuck2025!";

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

async function navigateToBasicInfoTab(page) {
  const tournamentsModeButton = page.getByRole("tab", {
    name: "Competitions",
  });
  await tournamentsModeButton.waitFor({ state: "visible" });
  await tournamentsModeButton.click();

  const newTournamentButton = page.getByRole("button", {
    name: "New Tournament",
  });
  await newTournamentButton.waitFor({ state: "visible" });
  await newTournamentButton.click();

  const basicInfoTab = page.getByRole("tab", { name: "Basic Info" });
  await basicInfoTab.waitFor({ state: "visible" });
  await basicInfoTab.click();

  await expect(page.locator("#tournamentFormHeader")).toBeVisible({
    timeout: 10000,
  });
}

test.describe("Tournament Dates - Validation Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Setup global dialog handler to prevent dialogs from blocking tests
    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    await loginWithCredentials(page);
    await dismissInitialAlerts(page);
    await navigateToBasicInfoTab(page);
  });

  test("should require start date when saving", async ({ page }) => {
    // Track dialog messages
    let dialogMessage = "";
    const dialogHandler = (dialog) => {
      dialogMessage = dialog.message();
    };
    page.once("dialog", dialogHandler);

    // Fill in required tournament name
    await page.locator("#name").fill("Test Tournament");

    // Leave start date empty
    const startDateInput = page.locator("#startDate");
    await expect(startDateInput).toBeEmpty();

    // Try to save
    await page.getByRole("button", { name: "Save & Exit" }).click();

    // Wait a bit for the dialog to be triggered
    await page.waitForTimeout(1000);

    // Should show error message in alert dialog
    expect(dialogMessage).toMatch(/start date.*required/i);

    console.log("✅ Test 1: Start date required validation - PASSED");
  });

  test("should require end date when saving", async ({ page }) => {
    // Track dialog messages
    let dialogMessage = "";
    const dialogHandler = (dialog) => {
      dialogMessage = dialog.message();
    };
    page.once("dialog", dialogHandler);

    // Fill in required fields except end date
    await page.locator("#name").fill("Test Tournament");
    await page.locator("#startDate").fill("2026-04-01");

    // Clear the end date (it auto-populates)
    await page.locator("#endDate").fill("");

    // Try to save
    await page.getByRole("button", { name: "Save & Exit" }).click();

    // Wait a bit for the dialog to be triggered
    await page.waitForTimeout(1000);

    // Should show error message in alert dialog
    expect(dialogMessage).toMatch(/duration.*required|end date.*required/i);

    console.log("✅ Test 2: End date required validation - PASSED");
  });

  test("should show correct number of tee times for date range", async ({
    page,
  }) => {
    await page.locator("#name").fill("Test Tournament");

    // Test 1-day tournament
    await page.locator("#startDate").fill("2026-04-01");
    await page.locator("#endDate").fill("2026-04-01");

    let teeTimeInputs = page.locator('input[type="time"]');
    await expect(teeTimeInputs).toHaveCount(1, { timeout: 5000 });
    await expect(page.locator('text="04/01/2026:"').first()).toBeVisible();

    // Test 3-day tournament
    await page.locator("#endDate").fill("2026-04-03");
    await expect(teeTimeInputs).toHaveCount(3, { timeout: 5000 });
    await expect(page.locator('text="04/01/2026:"').first()).toBeVisible();
    await expect(page.locator('text="04/02/2026:"').first()).toBeVisible();
    await expect(page.locator('text="04/03/2026:"').first()).toBeVisible();

    // Test 5-day tournament
    await page.locator("#endDate").fill("2026-04-05");
    await expect(teeTimeInputs).toHaveCount(5, { timeout: 5000 });

    console.log("✅ Test 3: Correct tee time count for date range - PASSED");
  });

  test("should default all tee times to 07:00", async ({ page }) => {
    await page.locator("#name").fill("Test Tournament");
    await page.locator("#startDate").fill("2026-04-01");
    await page.locator("#endDate").fill("2026-04-03");

    const teeTimeInputs = page.locator('input[type="time"]');
    await expect(teeTimeInputs).toHaveCount(3, { timeout: 5000 });

    // Check each tee time defaults to 07:00
    for (let i = 0; i < 3; i++) {
      await expect(teeTimeInputs.nth(i)).toHaveValue("07:00");
    }

    console.log("✅ Test 4: Tee times default to 07:00 - PASSED");
  });

  test("should allow modifying tee times", async ({ page }) => {
    await page.locator("#name").fill("Test Tournament");
    await page.locator("#startDate").fill("2026-04-01");
    await page.locator("#endDate").fill("2026-04-03");

    // Wait for tee times like the other passing tests do
    const teeTimeInputs = page.locator('input[type="time"]');
    await expect(teeTimeInputs).toHaveCount(3, { timeout: 10000 });

    // Modify first tee time
    await teeTimeInputs.nth(0).fill("09:30");
    await expect(teeTimeInputs.nth(0)).toHaveValue("09:30");

    // Modify second tee time
    await teeTimeInputs.nth(1).fill("14:00");
    await expect(teeTimeInputs.nth(1)).toHaveValue("14:00");

    console.log("✅ Test 5: Can modify tee times - PASSED");
  });

  test("should update tee times when date range changes", async ({ page }) => {
    await page.locator("#name").fill("Test Tournament");
    await page.locator("#startDate").fill("2026-04-01");
    await page.locator("#endDate").fill("2026-04-03");

    let teeTimeInputs = page.locator('input[type="time"]');

    // Initially 3 days
    await expect(teeTimeInputs).toHaveCount(3, { timeout: 5000 });

    // Modify tee times
    await teeTimeInputs.nth(0).fill("08:00");
    await teeTimeInputs.nth(1).fill("09:00");
    await teeTimeInputs.nth(2).fill("10:00");

    // Extend to 5 days
    await page.locator("#endDate").fill("2026-04-05");
    await expect(teeTimeInputs).toHaveCount(5, { timeout: 5000 });

    // New days should have default time
    await expect(teeTimeInputs.nth(3)).toHaveValue("07:00");
    await expect(teeTimeInputs.nth(4)).toHaveValue("07:00");

    // Reduce to 2 days
    await page.locator("#endDate").fill("2026-04-02");
    await expect(teeTimeInputs).toHaveCount(2, { timeout: 5000 });

    console.log("✅ Test 6: Tee times update when dates change - PASSED");
  });
});

test.describe("Tournament Dates - Display Format Tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page);
    await dismissInitialAlerts(page);
    await navigateToBasicInfoTab(page);
  });

  test("should display dates in mm/dd/yyyy format", async ({ page }) => {
    await page.locator("#name").fill("Test Tournament");
    await page.locator("#startDate").fill("2026-04-15");
    await page.locator("#endDate").fill("2026-04-17");

    // Check tee time labels show mm/dd/yyyy format
    await expect(page.locator('text="04/15/2026:"').first()).toBeVisible();
    await expect(page.locator('text="04/16/2026:"').first()).toBeVisible();
    await expect(page.locator('text="04/17/2026:"').first()).toBeVisible();

    console.log("✅ Test 7: Dates display in mm/dd/yyyy format - PASSED");
  });

  test("should set end date min attribute to match start date", async ({
    page,
  }) => {
    await page.locator("#name").fill("Test Tournament");
    await page.locator("#startDate").fill("2026-04-10");

    // Wait for React state to update
    await page.waitForTimeout(500);

    const endDateInput = page.locator("#endDate");
    await expect(endDateInput).toHaveAttribute("min", "2026-04-10", {
      timeout: 5000,
    });

    // Change start date
    await page.locator("#startDate").fill("2026-05-01");

    // Wait for React state to update
    await page.waitForTimeout(500);

    await expect(endDateInput).toHaveAttribute("min", "2026-05-01", {
      timeout: 5000,
    });

    console.log("✅ Test 8: End date min matches start date - PASSED");
  });
});

test.describe("Tournament Dates - Edge Cases", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page);
    await dismissInitialAlerts(page);
    await navigateToBasicInfoTab(page);
  });

  test("should handle single-day tournament correctly", async ({ page }) => {
    await page.locator("#name").fill("One Day Event");
    await page.locator("#startDate").fill("2026-06-15");
    await page.locator("#endDate").fill("2026-06-15");

    const teeTimeInputs = page.locator('input[type="time"]');
    await expect(teeTimeInputs).toHaveCount(1, { timeout: 5000 });
    await expect(page.locator('text="06/15/2026:"').first()).toBeVisible();

    console.log("✅ Test 9: Single-day tournament handled correctly - PASSED");
  });

  test("should handle multi-week tournament", async ({ page }) => {
    await page.locator("#name").fill("Long Tournament");
    await page.locator("#startDate").fill("2026-07-01");
    await page.locator("#endDate").fill("2026-07-14");

    const teeTimeInputs = page.locator('input[type="time"]');
    // 14 days = 14 tee times
    await expect(teeTimeInputs).toHaveCount(14, { timeout: 5000 });

    console.log("✅ Test 10: Multi-week tournament handled correctly - PASSED");
  });

  test("should handle date changes without losing other form data", async ({
    page,
  }) => {
    // Fill in multiple fields
    await page.locator("#name").fill("Test Tournament");
    await page.locator("#startDate").fill("2026-04-01");
    await page.locator("#endDate").fill("2026-04-03");

    const nameValue = await page.locator("#name").inputValue();
    expect(nameValue).toBe("Test Tournament");

    // Change dates
    await page.locator("#startDate").fill("2026-05-01");
    await page.locator("#endDate").fill("2026-05-05");

    // Name should still be there
    const nameValueAfter = await page.locator("#name").inputValue();
    expect(nameValueAfter).toBe("Test Tournament");

    console.log("✅ Test 11: Date changes preserve other form data - PASSED");
  });
});

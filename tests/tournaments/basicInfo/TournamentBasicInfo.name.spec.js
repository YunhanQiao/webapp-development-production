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

test.describe("Tournament Name Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Setup global dialog handler
    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    await loginWithCredentials(page);
    await dismissInitialAlerts(page);
    await navigateToBasicInfoTab(page);
  });

  // Short Name Generation Algorithm Tests
  test("TEST 1: Show 'New Tournament' as default header", async ({ page }) => {
    const header = page.locator("#tournamentFormHeader");
    await expect(header).toHaveText("New Tournament", { timeout: 5000 });

    console.log("✅ TEST 1 PASSED: Default header is 'New Tournament'");
  });

  test("TEST 2: Generate short name from two-word tournament name", async ({
    page,
  }) => {
    const header = page.locator("#tournamentFormHeader");
    const nameField = page.locator("#name");

    await nameField.fill("Test Tournament");
    await page.locator("#startDate").fill("2026-04-01");

    await page.waitForTimeout(500);

    const currentYear = new Date().getFullYear().toString().slice(-2);
    const headerText = await header.textContent();

    expect(headerText).toMatch(new RegExp(`T.*${currentYear}`));
    await expect(header).not.toContainText("New Tournament");

    console.log("✅ TEST 2 PASSED: Two-word name generates correct short name");
  });

  test("TEST 3: Generate short name from single-word tournament name", async ({
    page,
  }) => {
    const header = page.locator("#tournamentFormHeader");
    const nameField = page.locator("#name");

    await nameField.fill("Championship");
    await page.locator("#startDate").fill("2026-04-01");
    await page.waitForTimeout(500);

    const currentYear = new Date().getFullYear().toString().slice(-2);
    const expectedShortName = `C${currentYear}`;

    await expect(header).toContainText(expectedShortName, { timeout: 5000 });

    console.log(
      "✅ TEST 3 PASSED: Single-word name generates correct short name",
    );
  });

  test("TEST 4: Generate short name from three-word tournament name", async ({
    page,
  }) => {
    const header = page.locator("#tournamentFormHeader");
    const nameField = page.locator("#name");

    await nameField.fill("Spring Golf Open");
    await page.locator("#startDate").fill("2026-04-01");
    await page.waitForTimeout(500);

    const currentYear = new Date().getFullYear().toString().slice(-2);
    const expectedShortName = `SGO${currentYear}`;

    await expect(header).toContainText(expectedShortName, { timeout: 5000 });

    console.log(
      "✅ TEST 4 PASSED: Three-word name generates correct short name",
    );
  });

  test("TEST 5: Generate short name from multi-word tournament name", async ({
    page,
  }) => {
    const header = page.locator("#tournamentFormHeader");
    const nameField = page.locator("#name");

    await nameField.fill("Annual Spring Summer Golf Championship");
    await page.locator("#startDate").fill("2026-04-01");
    await page.waitForTimeout(500);

    const currentYear = new Date().getFullYear().toString().slice(-2);
    const expectedShortName = `ASSGC${currentYear}`;

    await expect(header).toContainText(expectedShortName, { timeout: 5000 });

    console.log(
      "✅ TEST 5 PASSED: Multi-word name generates correct short name",
    );
  });

  // Year Handling Tests
  test("TEST 6: Update short name year when start date year changes", async ({
    page,
  }) => {
    const header = page.locator("#tournamentFormHeader");
    const nameField = page.locator("#name");

    await nameField.fill("Seal Lab Tournament");

    await page.locator("#startDate").fill("2026-04-01");
    await page.waitForTimeout(500);
    const headerText1 = await header.textContent();
    expect(headerText1).toMatch(/SLT26/);
    console.log("✅ TEST 6-a PASSED: Short name shows year 26 for 2026 date");

    await page.locator("#startDate").fill("2027-04-01");
    await page.waitForTimeout(500);
    const headerText2 = await header.textContent();
    expect(headerText2).toMatch(/SLT27/);
    console.log(
      "✅ TEST 6-b PASSED: Short name updates to year 27 for 2027 date",
    );

    await page.locator("#startDate").fill("2026-04-01");
    await page.waitForTimeout(500);
    const headerText3 = await header.textContent();
    expect(headerText3).toMatch(/SLT26/);
    console.log(
      "✅ TEST 6-c PASSED: Short name updates back to year 26 for 2026 date",
    );
  });

  test("TEST 7: Show two-digit year in short name", async ({ page }) => {
    const header = page.locator("#tournamentFormHeader");
    const nameField = page.locator("#name");

    await nameField.fill("Test Tournament");
    await page.locator("#startDate").fill("2026-04-01");
    await page.waitForTimeout(500);

    const headerText = await header.textContent();
    expect(headerText).toMatch(/T.*26/);
    expect(headerText).not.toContain("2026");

    console.log("✅ TEST 7 PASSED: Shows two-digit year");
  });

  // Uniqueness Handling Tests
  test("TEST 8: Update short name when tournament name changes", async ({
    page,
  }) => {
    const header = page.locator("#tournamentFormHeader");
    const nameField = page.locator("#name");

    await page.locator("#startDate").fill("2026-04-01");

    await nameField.fill("Spring Open");
    await page.waitForTimeout(500);
    await expect(header).toContainText("SO26", { timeout: 5000 });
    console.log("✅ TEST 8-a PASSED: 'Spring Open' generates 'SO26'");

    await nameField.fill("Summer Championship");
    await page.waitForTimeout(500);
    await expect(header).toContainText("SC26", { timeout: 5000 });
    await expect(header).not.toContainText("SO26");
    console.log("✅ TEST 8-b PASSED: 'Summer Championship' generates 'SC26'");

    await nameField.fill("Fall Tournament");
    await page.waitForTimeout(500);
    await expect(header).toContainText("FT26", { timeout: 5000 });
    console.log("✅ TEST 8-c PASSED: 'Fall Tournament' generates 'FT26'");
  });

  // Display and UI Tests
  test("TEST 9: Preserve name value during form interaction", async ({
    page,
  }) => {
    const nameField = page.locator("#name");

    await nameField.fill("My Tournament Name");
    await page.locator("#startDate").fill("2026-04-01");
    await page.locator("#endDate").fill("2026-04-01");

    const nameValue = await nameField.inputValue();
    expect(nameValue).toBe("My Tournament Name");
    console.log("✅ TEST 9-a PASSED: Name value preserved after filling dates");

    const teeTime = page.locator('input[type="time"]').first();
    await teeTime.fill("09:00");

    const nameValueAfter = await nameField.inputValue();
    expect(nameValueAfter).toBe("My Tournament Name");
    console.log(
      "✅ TEST 9-b PASSED: Name value preserved after filling tee time",
    );
  });
});

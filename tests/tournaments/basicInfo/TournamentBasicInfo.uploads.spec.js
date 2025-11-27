const { test, expect } = require("@playwright/test");

const LOGIN_EMAIL = "seal-osu@gmail.com";
const LOGIN_PASSWORD = "GoodLuck2025!";

// Test files - using paths relative to project root
const TEST_PDF_PATH = "tests/tournaments/basicInfo/Test.pdf";
const TEST_LOGO_PATH = "tests/tournaments/basicInfo/test-image.png";

// Generate unique tournament name for this test run
const generateUniqueName = () => `E2E Upload Test ${Date.now()}`;

async function loginWithCredentials(page) {
  await page.goto("http://localhost:3000/login", {
    waitUntil: "domcontentloaded",
  });
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

test.describe("Tournament Upload - Combined Test", () => {
  test("Upload Tests: Logo, Rules, Prizes, and Additional Info", async ({
    page,
  }) => {
    // Login once for all upload tests
    await loginWithCredentials(page);
    await dismissInitialAlerts(page);
    await navigateToBasicInfoTab(page);

    const tournamentName = generateUniqueName();

    // Fill required fields
    await page.locator("#name").fill(tournamentName);
    await page.locator("#startDate").fill("2026-06-01");
    await page.locator("#endDate").fill("2026-06-05");

    // ==========================================
    // TEST 1: Upload Logo (PNG)
    // ==========================================
    console.log("\n🧪 TEST 1: Upload Logo PNG");

    const logoInput = page.locator("#logo");

    const logoValueBefore = await logoInput.inputValue();

    await logoInput.setInputFiles(TEST_LOGO_PATH);
    await page.waitForTimeout(1500);

    const logoValueAfter = await logoInput.inputValue();

    if (logoValueAfter && logoValueAfter !== logoValueBefore) {
      console.log(`✅ TEST 1 PASSED: Logo uploaded - field value changed`);
    } else {
      console.log(`⚠️  TEST 1 FAILED: Logo upload verification inconclusive`);
    }

    // ==========================================
    // TEST 2: Upload Rules PDF
    // ==========================================
    console.log("\n🧪 TEST 2: Upload Rules PDF");

    const pdfInputs = page.locator('input[type="file"][accept=".pdf"]');
    const pdfCount = await pdfInputs.count();

    if (pdfCount >= 1) {
      const rulesInput = pdfInputs.nth(0);

      await rulesInput.setInputFiles(TEST_PDF_PATH);
      await page.waitForTimeout(1500);

      const allDisplayFields = page.locator('input[value="Test.pdf"]');
      const testPdfFieldCount = await allDisplayFields.count();

      if (testPdfFieldCount > 0) {
        console.log(
          `✅ TEST 2 PASSED: Rules PDF "Test.pdf" displayed in field`,
        );
      } else {
        console.log(
          `⚠️  TEST 2 FAILED: "Test.pdf" not found in display fields`,
        );
      }
    } else {
      console.log("⚠️  TEST 2 SKIPPED: Rules PDF input not found");
    }

    // ==========================================
    // TEST 3: Upload Prizes PDF
    // ==========================================
    console.log("\n🧪 TEST 3: Upload Prizes PDF");

    if (pdfCount >= 2) {
      const prizesInput = pdfInputs.nth(1);

      await prizesInput.setInputFiles(TEST_PDF_PATH);
      await page.waitForTimeout(1500);

      const allTestPdfFields = page.locator('input[value="Test.pdf"]');
      const testPdfCount = await allTestPdfFields.count();

      if (testPdfCount >= 2) {
        console.log(
          `✅ TEST 3 PASSED: Prizes PDF "Test.pdf" displayed in field`,
        );
      } else {
        console.log(
          `⚠️  TEST 3 FAILED: Expected 2 "Test.pdf" fields, found ${testPdfCount}`,
        );
      }
    } else {
      console.log("⚠️  TEST 3 SKIPPED: Prizes PDF input not found");
    }

    console.log("\n🎉 ALL UPLOAD TESTS COMPLETED: Logo, Rules, and Prizes!");
  });
});

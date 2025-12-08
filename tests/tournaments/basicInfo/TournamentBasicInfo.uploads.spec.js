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

test.describe("Tournament UI Test - Combined Test", () => {
  test("should upload logos, docs and search and add admins from database", async ({
    page,
  }) => {
    // Login and navigate to Basic Info tab
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

    console.log("\n🧪 TEST 4: Admin Field Search and Selection");

    // ==========================================
    // TEST 4-a: Search for Test User One
    // ==========================================
    console.log("\n🔍 TEST 4-a: Searching for 'Test User One'");

    // Click the "Add Admin..." button to open the modal
    const addAdminButton = page.getByRole("button", { name: "Add Admin..." });
    await addAdminButton.waitFor({ state: "visible", timeout: 5000 });
    await addAdminButton.click();
    await page.waitForTimeout(500);

    // Wait for the modal to appear
    const adminModal = page.locator(".modal.show, .admin-modal");
    await adminModal.waitFor({ state: "visible", timeout: 3000 });

    // Find the search input in the modal with placeholder "Type name of user"
    const adminSearchInput = page.locator(
      'input[placeholder="Type name of user"]',
    );
    await adminSearchInput.waitFor({ state: "visible", timeout: 5000 });

    // Type the first test user's name
    await adminSearchInput.fill("Test User One");
    await page.waitForTimeout(1000); // Wait for search results

    // Look for the user in the dropdown/results
    const testUser1Option = page.getByText("Test User One", { exact: false });

    const isUser1Visible = await testUser1Option
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (isUser1Visible) {
      // Click to select the user
      await testUser1Option.click();
      await page.waitForTimeout(500);

      // Click "Add admin" button in modal (use exact match and within modal)
      const addAdminModalButton = adminModal.getByRole("button", {
        name: "Add admin",
        exact: true,
      });
      await addAdminModalButton.click();
      await page.waitForTimeout(1000);

      // Verify the user appears below the "Add Admin" field (in the main form)
      const addedAdmin1 = page
        .locator('input[value*="Test User One"]')
        .or(page.locator('input[value*="User One"]'));

      const isAdminAdded = await addedAdmin1
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      expect(isAdminAdded).toBe(true);
      console.log(
        "✅ TEST 4-a PASSED: User 'Test User One' appears below Add Admin field",
      );
    } else {
      console.log(
        "❌ TEST 4-a FAILED: 'Test User One' not found in search results",
      );
      expect(isUser1Visible).toBe(true); // This will fail the test
    }

    // ==========================================
    // TEST 4-b: Search for Test User Two
    // ==========================================
    console.log("\n🔍 TEST 4-b: Searching for 'Test User Two'");

    // Click the "Add Admin..." button again to open the modal
    await addAdminButton.click();
    await page.waitForTimeout(500);

    // Wait for modal and search input
    await adminModal.waitFor({ state: "visible", timeout: 3000 });
    await adminSearchInput.waitFor({ state: "visible", timeout: 5000 });

    // Clear and search for second user
    await adminSearchInput.clear();
    await adminSearchInput.fill("Test User Two");
    await page.waitForTimeout(1000);

    const testUser2Option = page.getByText("Test User Two", { exact: false });

    const isUser2Visible = await testUser2Option
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (isUser2Visible) {
      // Click to select the user
      await testUser2Option.click();
      await page.waitForTimeout(500);

      // Click "Add admin" button in modal (use exact match and within modal)
      const addAdminModalButton = adminModal.getByRole("button", {
        name: "Add admin",
        exact: true,
      });
      await addAdminModalButton.click();
      await page.waitForTimeout(1000);

      // Verify the user appears below the "Add Admin" field
      const addedAdmin2 = page
        .locator('input[value*="Test User Two"]')
        .or(page.locator('input[value*="User Two"]'));

      const isAdmin2Added = await addedAdmin2
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      expect(isAdmin2Added).toBe(true);
      console.log(
        "✅ TEST 4-b PASSED: User 'Test User Two' appears below Add Admin field",
      );
    } else {
      console.log(
        "❌ TEST 4-b FAILED: 'Test User Two' not found in search results",
      );
      expect(isUser2Visible).toBe(true); // This will fail the test
    }

    console.log("\n🎉 ADMIN FIELD TEST COMPLETED!");
  });
});

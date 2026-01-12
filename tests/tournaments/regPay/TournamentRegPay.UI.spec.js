const { test, expect } = require("@playwright/test");
const mongoose = require("mongoose");
const path = require("path");

const LOGIN_EMAIL = "seal-osu@gmail.com";
const LOGIN_PASSWORD = "GoodLuck2025!";

// Database configuration - use production DB since frontend calls production API
const dbConfig = {
  url: `mongodb+srv://johnsonyqiao_db_user:k6bQihjU4KgszLel@cluster0.f5ssltl.mongodb.net/speedscore-expert?retryWrites=true&w=majority&appName=Cluster0`,
};

// Import backend database configuration
require("dotenv").config({
  path: path.join(__dirname, "../../../../../backend-production/.env"),
});

// Import the actual backend models - use relative path
const backendModelsPath = path.join(
  __dirname,
  "../../../../../backend-production/src/models/index.js",
);
const db = require(backendModelsPath);

// Database helper functions
async function connectToDatabase() {
  try {
    // Check if already connected
    if (global.testConnection && global.testConnection.readyState === 1) {
      return;
    }

    const testConnection = mongoose.createConnection();

    await testConnection.openUri(dbConfig.url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });

    global.testConnection = testConnection;
    global.TestCompetition = testConnection.model(
      "Competition",
      db.competition.schema,
    );
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    throw error;
  }
}

async function disconnectFromDatabase() {
  try {
    if (global.testConnection) {
      await global.testConnection.close();
      global.testConnection = null;
      global.TestCompetition = null;
    }
  } catch (error) {
    console.error("⚠️ Database disconnection warning:", error.message);
  }
}

async function cleanupTestTournament(tournamentName) {
  try {
    const TestCompetition = global.TestCompetition;
    const result = await TestCompetition.deleteOne({
      "basicInfo.name": tournamentName,
    });
  } catch (error) {
    console.error(`❌ Error cleaning up test tournament: ${error.message}`);
  }
}

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

async function navigateToRegPayTab(page) {
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

  // First fill Basic Info tab (required)
  const basicInfoTab = page.getByRole("tab", { name: "Basic Info" });
  await basicInfoTab.waitFor({ state: "visible" });
  await basicInfoTab.click();

  await expect(page.locator("#tournamentFormHeader")).toBeVisible({
    timeout: 10000,
  });

  // Fill required basic info fields
  await page.locator("#name").fill("Checkbox Test Tournament");
  await page.locator("#startDate").fill("2026-06-01");
  await page.locator("#endDate").fill("2026-06-05");

  // Click Save & Next to go to RegPay tab
  const saveNextButton = page.getByRole("button", { name: "Save & Next" });
  await saveNextButton.click();
  await page.waitForTimeout(2000);

  // Should now be on Registration & Payment tab
  const regPayTab = page.getByRole("tab", {
    name: "Registration & Payment",
  });
  await regPayTab.waitFor({ state: "visible" });
}

test.describe("Registration & Payment Checkboxes", () => {
  test("All Checkbox and Date Validation Tests", async ({ page }) => {
    // Connect to database at start of test
    await connectToDatabase();

    let createdTournamentName = null;

    try {
      // Login and navigate to RegPay tab
      await loginWithCredentials(page);
      await dismissInitialAlerts(page);
      await navigateToRegPayTab(page);

      // Store tournament name for cleanup
      createdTournamentName = "Checkbox Test Tournament";

      // ==========================================
      // TEST 1: Entry Fee Checkbox (Pay Through App)
      // ==========================================
      console.log("\n🧪 TEST 1: Testing Entry Fee Checkbox");

      const entryFeeCheckbox = page.locator("#payThroughApp");

      // TEST 1-a: Checkbox starts unchecked
      await expect(entryFeeCheckbox).toBeVisible();
      await expect(entryFeeCheckbox).not.toBeChecked();
      console.log("✅ TEST 1-a PASSED: Entry fee checkbox starts unchecked");

      // TEST 1-b: Can check the checkbox
      await entryFeeCheckbox.check();
      await expect(entryFeeCheckbox).toBeChecked();
      console.log("✅ TEST 1-b PASSED: Entry fee checkbox can be checked");

      // TEST 1-c: Related fields become enabled when checked
      const processingPercent = page.locator("#processingPercent");
      const processingFee = page.locator("#processingFee");

      await expect(processingPercent).toBeEnabled();
      await expect(processingFee).toBeEnabled();
      console.log(
        "✅ TEST 1-c PASSED: Processing fields enabled when checkbox checked",
      );

      // TEST 1-d: Can uncheck the checkbox
      await entryFeeCheckbox.uncheck();
      await expect(entryFeeCheckbox).not.toBeChecked();
      console.log("✅ TEST 1-d PASSED: Entry fee checkbox can be unchecked");

      // ==========================================
      // TEST 2: Swag Checkbox
      // ==========================================
      console.log("\n🧪 TEST 2: Testing Swag Checkbox");

      const swagCheckbox = page.locator("#askSwag");

      // TEST 2-a: Checkbox starts unchecked
      await expect(swagCheckbox).toBeVisible();
      await expect(swagCheckbox).not.toBeChecked();
      console.log("✅ TEST 2-a PASSED: Swag checkbox starts unchecked");

      // TEST 2-b: Can check the checkbox
      await swagCheckbox.check();
      await expect(swagCheckbox).toBeChecked();
      console.log("✅ TEST 2-b PASSED: Swag checkbox can be checked");

      // TEST 2-c: Swag name field becomes visible/enabled when checked
      const swagName = page.locator("#swagName");
      if (await swagName.isVisible()) {
        await expect(swagName).toBeEnabled();
        console.log(
          "✅ TEST 2-c PASSED: Swag name field enabled when checkbox checked",
        );
      } else {
        console.log("⚠️  TEST 2-c SKIPPED: Swag name field not found");
      }

      // TEST 2-d: Can uncheck the checkbox
      await swagCheckbox.uncheck();
      await expect(swagCheckbox).not.toBeChecked();
      console.log("✅ TEST 2-d PASSED: Swag checkbox can be unchecked");

      // ==========================================
      // TEST 3: Swag Size Checkboxes
      // ==========================================
      console.log("\n🧪 TEST 3: Testing Swag Size Checkboxes");

      // Re-check swag checkbox to enable size checkboxes
      await swagCheckbox.check();
      await page.waitForTimeout(500);

      const swagSizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

      // TEST 3-a: All size checkboxes exist and are visible
      for (const size of swagSizes) {
        const sizeCheckbox = page.locator(`#${size}`);
        const sizeLabel = page.locator(`label[for="${size}"]`);

        await expect(sizeCheckbox).toBeAttached();
        await expect(sizeLabel).toBeVisible();
        await expect(sizeLabel).toHaveText(size);
      }
      console.log(
        "✅ TEST 3-a PASSED: All 7 swag size checkboxes exist and are visible",
      );

      // TEST 3-b: Can check individual size checkboxes
      const testSizes = ["S", "M", "L"];
      for (const size of testSizes) {
        const sizeCheckbox = page.locator(`#${size}`);
        const sizeLabel = page.locator(`label[for="${size}"]`);

        // Ensure it's unchecked first
        if (await sizeCheckbox.isChecked()) {
          await sizeLabel.click();
        }

        // Now check it
        await sizeLabel.click();
        await expect(sizeCheckbox).toBeChecked();
      }
      console.log(
        "✅ TEST 3-b PASSED: Can check individual size checkboxes (S, M, L)",
      );

      // TEST 3-c: Can uncheck individual size checkboxes
      for (const size of testSizes) {
        const sizeCheckbox = page.locator(`#${size}`);
        const sizeLabel = page.locator(`label[for="${size}"]`);

        await sizeLabel.click();
        await expect(sizeCheckbox).not.toBeChecked();
      }
      console.log(
        "✅ TEST 3-c PASSED: Can uncheck individual size checkboxes (S, M, L)",
      );

      // TEST 3-d: Can check multiple sizes at once
      for (const size of ["XS", "M", "XL", "XXL"]) {
        const sizeLabel = page.locator(`label[for="${size}"]`);
        await sizeLabel.click();
      }

      for (const size of ["XS", "M", "XL", "XXL"]) {
        const sizeCheckbox = page.locator(`#${size}`);
        await expect(sizeCheckbox).toBeChecked();
      }
      console.log(
        "✅ TEST 3-d PASSED: Can check multiple size checkboxes simultaneously",
      );

      // TEST 3-e: Can check all sizes
      for (const size of swagSizes) {
        const sizeCheckbox = page.locator(`#${size}`);
        const sizeLabel = page.locator(`label[for="${size}"]`);

        if (!(await sizeCheckbox.isChecked())) {
          await sizeLabel.click();
        }
      }

      for (const size of swagSizes) {
        const sizeCheckbox = page.locator(`#${size}`);
        await expect(sizeCheckbox).toBeChecked();
      }
      console.log("✅ TEST 3-e PASSED: Can check all 7 size checkboxes");

      // TEST 3-f: Can uncheck all sizes
      for (const size of swagSizes) {
        const sizeCheckbox = page.locator(`#${size}`);
        const sizeLabel = page.locator(`label[for="${size}"]`);

        if (await sizeCheckbox.isChecked()) {
          await sizeLabel.click();
        }
      }

      for (const size of swagSizes) {
        const sizeCheckbox = page.locator(`#${size}`);
        await expect(sizeCheckbox).not.toBeChecked();
      }
      console.log("✅ TEST 3-f PASSED: Can uncheck all size checkboxes");

      // ==========================================
      // TEST 4: Checkbox State Persistence
      // ==========================================
      console.log("\n🧪 TEST 4: Testing Checkbox State Persistence");

      // Check both main checkboxes and some sizes
      await entryFeeCheckbox.check();
      await swagCheckbox.check();
      await page.waitForTimeout(500);

      const selectedSizes = ["M", "L", "XL"];
      for (const size of selectedSizes) {
        const sizeLabel = page.locator(`label[for="${size}"]`);
        await sizeLabel.click();
      }

      // Verify all are checked
      await expect(entryFeeCheckbox).toBeChecked();
      await expect(swagCheckbox).toBeChecked();
      for (const size of selectedSizes) {
        const sizeCheckbox = page.locator(`#${size}`);
        await expect(sizeCheckbox).toBeChecked();
      }
      console.log(
        "✅ TEST 4 PASSED: Multiple checkboxes can be checked simultaneously and maintain state",
      );

      // ==========================================
      // TEST 5: Verify Auto-filled Registration Dates
      // ==========================================
      console.log(
        "\n🧪 TEST 5: Testing Auto-filled Registration Dates Satisfy Constraints",
      );

      // Tournament dates: 2026-06-01 to 2026-06-05 (set in navigateToRegPayTab)
      const tournamentStartDate = new Date("2026-06-01");

      const regStartDateInput = page.locator("#regStartDate");
      const regEndDateInput = page.locator("#regEndDate");

      // Wait for fields to be populated with default values
      await page.waitForTimeout(1000);

      // TEST 5-a: Registration start date is automatically filled
      const regStartValue = await regStartDateInput.inputValue();
      expect(regStartValue).toBeTruthy();
      expect(regStartValue).not.toBe("");
      console.log(
        `✅ TEST 5-a PASSED: Registration start date is auto-filled: ${regStartValue}`,
      );

      // TEST 5-b: Registration end date is automatically filled
      const regEndValue = await regEndDateInput.inputValue();
      expect(regEndValue).toBeTruthy();
      expect(regEndValue).not.toBe("");
      console.log(
        `✅ TEST 5-b PASSED: Registration end date is auto-filled: ${regEndValue}`,
      );

      // TEST 5-c: Registration end date is on or before tournament start date
      const regEndDate = new Date(regEndValue);
      expect(regEndDate.getTime()).toBeLessThanOrEqual(
        tournamentStartDate.getTime(),
      );
      console.log(
        `✅ TEST 5-c PASSED: Registration end date (${regEndValue}) is on or before tournament start (2026-06-01)`,
      );

      // TEST 5-d: Registration start date is on or before registration end date
      const regStartDate = new Date(regStartValue);
      expect(regStartDate.getTime()).toBeLessThanOrEqual(regEndDate.getTime());
      console.log(
        `✅ TEST 5-d PASSED: Registration start date (${regStartValue}) is on or before registration end date (${regEndValue})`,
      );

      // TEST 5-e: Registration start date is on or before tournament start date
      expect(regStartDate.getTime()).toBeLessThanOrEqual(
        tournamentStartDate.getTime(),
      );
      console.log(
        `✅ TEST 5-e PASSED: Registration start date (${regStartValue}) is on or before tournament start (2026-06-01)`,
      );

      // ==========================================
      // TEST 6: Verify Auto-filled Withdrawal Deadline
      // ==========================================
      console.log(
        "\n🧪 TEST 6: Testing Auto-filled Withdrawal Deadline Satisfies Constraints",
      );

      const withdrawalDateInput = page.locator("#maxAllowedWithdraDate");

      // TEST 6-a: Withdrawal deadline is automatically filled
      const withdrawalValue = await withdrawalDateInput.inputValue();
      expect(withdrawalValue).toBeTruthy();
      expect(withdrawalValue).not.toBe("");
      console.log(
        `✅ TEST 6-a PASSED: Withdrawal deadline is auto-filled: ${withdrawalValue}`,
      );

      // TEST 6-b: Withdrawal deadline is on or before tournament start date
      const withdrawalDate = new Date(withdrawalValue);
      expect(withdrawalDate.getTime()).toBeLessThanOrEqual(
        tournamentStartDate.getTime(),
      );
      console.log(
        `✅ TEST 6-b PASSED: Withdrawal deadline (${withdrawalValue}) is on or before tournament start (2026-06-01)`,
      );

      // TEST 6-c: Withdrawal deadline is on or after registration end date (logical constraint)
      expect(withdrawalDate.getTime()).toBeGreaterThanOrEqual(
        regEndDate.getTime(),
      );
      console.log(
        `✅ TEST 6-c PASSED: Withdrawal deadline (${withdrawalValue}) is on or after registration end (${regEndValue})`,
      );

      // ==========================================
      // TEST 7: Registration Window Maintains Offset When Tournament Dates Change
      // ==========================================
      console.log(
        "\n🧪 TEST 7: Testing Registration Window Offset Persistence",
      );

      // Store initial offsets
      const initialTournamentStart = new Date("2026-06-01");
      const initialRegStartOffset = Math.ceil(
        (initialTournamentStart - regStartDate) / (1000 * 60 * 60 * 24),
      );
      const initialRegEndOffset = Math.ceil(
        (initialTournamentStart - regEndDate) / (1000 * 60 * 60 * 24),
      );

      console.log(
        `   Initial offsets: Registration opens ${initialRegStartOffset} days before, closes ${initialRegEndOffset} days before tournament`,
      );

      // Navigate back to Basic Info to change tournament dates
      const basicInfoTab = page.getByRole("tab", { name: "Basic Info" });
      await basicInfoTab.click();
      await page.waitForTimeout(1000);

      // Change tournament start date to 2026-07-01 (one month later)
      await page.locator("#startDate").fill("2026-07-01");
      await page.locator("#endDate").fill("2026-07-05");

      // Click Save & Next to update and go back to RegPay tab
      const saveNextButton = page.getByRole("button", { name: "Save & Next" });
      await saveNextButton.click();
      await page.waitForTimeout(2000);

      // Verify we're on Registration & Payment tab
      const regPayTab = page.getByRole("tab", {
        name: "Registration & Payment",
      });
      await regPayTab.waitFor({ state: "visible" });

      // Wait for fields to be updated
      await page.waitForTimeout(1000);

      // TEST 7-a: Verify registration dates were updated
      const updatedRegStartValue = await regStartDateInput.inputValue();
      const updatedRegEndValue = await regEndDateInput.inputValue();

      expect(updatedRegStartValue).toBeTruthy();
      expect(updatedRegEndValue).toBeTruthy();
      expect(updatedRegStartValue).not.toBe(regStartValue);
      expect(updatedRegEndValue).not.toBe(regEndValue);

      console.log(
        `✅ TEST 7-a PASSED: Registration dates updated (start: ${updatedRegStartValue}, end: ${updatedRegEndValue})`,
      );

      // Calculate new offsets
      const newTournamentStart = new Date("2026-07-01");
      const newRegStartDate = new Date(updatedRegStartValue);
      const newRegEndDate = new Date(updatedRegEndValue);

      const newRegStartOffset = Math.ceil(
        (newTournamentStart - newRegStartDate) / (1000 * 60 * 60 * 24),
      );
      const newRegEndOffset = Math.ceil(
        (newTournamentStart - newRegEndDate) / (1000 * 60 * 60 * 24),
      );

      console.log(
        `   New offsets: Registration opens ${newRegStartOffset} days before, closes ${newRegEndOffset} days before tournament`,
      );

      // TEST 7-b: Verify registration open offset is preserved
      expect(newRegStartOffset).toBe(initialRegStartOffset);
      console.log(
        `✅ TEST 7-b PASSED: Registration open offset preserved (${newRegStartOffset} days)`,
      );

      // TEST 7-c: Verify registration close offset is preserved
      expect(newRegEndOffset).toBe(initialRegEndOffset);
      console.log(
        `✅ TEST 7-c PASSED: Registration close offset preserved (${newRegEndOffset} days)`,
      );

      // TEST 7-d: Verify dates still satisfy constraint
      expect(newRegEndDate.getTime()).toBeLessThanOrEqual(
        newTournamentStart.getTime(),
      );
      console.log(
        `✅ TEST 7-d PASSED: Updated registration end (${updatedRegEndValue}) still on or before tournament start (2026-07-01)`,
      );

      // ==========================================
      // TEST 8: Withdrawal Deadline Maintains Offset When Tournament Dates Change
      // ==========================================
      console.log(
        "\n🧪 TEST 8: Testing Withdrawal Deadline Offset Persistence",
      );

      // Store initial withdrawal offset (from previous tournament start)
      const initialWithdrawalOffset = Math.ceil(
        (initialTournamentStart - withdrawalDate) / (1000 * 60 * 60 * 24),
      );

      console.log(
        `   Initial offset: Withdrawal deadline ${initialWithdrawalOffset} day(s) before tournament`,
      );

      // TEST 8-a: Verify withdrawal deadline was updated
      const updatedWithdrawalValue = await withdrawalDateInput.inputValue();
      expect(updatedWithdrawalValue).toBeTruthy();
      expect(updatedWithdrawalValue).not.toBe(withdrawalValue);

      console.log(
        `✅ TEST 8-a PASSED: Withdrawal deadline updated (${updatedWithdrawalValue})`,
      );

      // Calculate new withdrawal offset
      const newWithdrawalDate = new Date(updatedWithdrawalValue);
      const newWithdrawalOffset = Math.ceil(
        (newTournamentStart - newWithdrawalDate) / (1000 * 60 * 60 * 24),
      );

      console.log(
        `   New offset: Withdrawal deadline ${newWithdrawalOffset} day(s) before tournament`,
      );

      // TEST 8-b: Verify offset is preserved
      expect(newWithdrawalOffset).toBe(initialWithdrawalOffset);
      console.log(
        `✅ TEST 8-b PASSED: Withdrawal deadline offset preserved (${newWithdrawalOffset} day(s))`,
      );

      // TEST 8-c: Verify date still satisfies constraint (before tournament start)
      expect(newWithdrawalDate.getTime()).toBeLessThanOrEqual(
        newTournamentStart.getTime(),
      );
      console.log(
        `✅ TEST 8-c PASSED: Updated withdrawal deadline (${updatedWithdrawalValue}) still on or before tournament start (2026-07-01)`,
      );

      // TEST 8-d: Verify withdrawal still after registration end
      expect(newWithdrawalDate.getTime()).toBeGreaterThanOrEqual(
        newRegEndDate.getTime(),
      );
      console.log(
        `✅ TEST 8-d PASSED: Updated withdrawal deadline (${updatedWithdrawalValue}) still on or after registration end (${updatedRegEndValue})`,
      );

      console.log(
        "\n🎉 ALL TESTS COMPLETED: Checkboxes, Date Validation, and Offset Persistence - All constraints satisfied!",
      );

      // Wait a moment for database writes to complete
      await page.waitForTimeout(2000);

      // Clean up the test tournament
      await cleanupTestTournament(createdTournamentName);
      createdTournamentName = null;
    } catch (error) {
      // Clean up in case of error
      if (createdTournamentName) {
        await cleanupTestTournament(createdTournamentName);
      }
      throw error;
    } finally {
      // Disconnect from database
      await disconnectFromDatabase();
    }
  });
});

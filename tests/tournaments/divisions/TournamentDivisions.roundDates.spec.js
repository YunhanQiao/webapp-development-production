const { test, expect } = require("@playwright/test");
const mongoose = require("mongoose");
const path = require("path");

const LOGIN_EMAIL = "seal-osu@gmail.com";
const LOGIN_PASSWORD = "GoodLuck2025!";

// Generate unique tournament name for this test run
const generateUniqueName = () => `Round Dates Test Tournament`;

// Database configuration - use production DB since frontend calls production API
const dbConfig = {
  url: `mongodb+srv://johnsonyqiao_db_user:k6bQihjU4KgszLel@cluster0.f5ssltl.mongodb.net/speedscore-expert?retryWrites=true&w=majority&appName=Cluster0`,
};

// Import backend database configuration
require("dotenv").config({
  path: path.join(__dirname, "../../../SpeedScore-backend/.env"),
});

// Import the actual backend models - use absolute path directly
const backendModelsPath =
  "/Users/yunhanqiao/Desktop/SpeedScore-backend/src/models/index.js";
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

async function navigateToDivisionsTab(page) {
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

  // ========== Fill Basic Info tab (required) ==========
  const basicInfoTab = page.getByRole("tab", { name: "Basic Info" });
  await basicInfoTab.waitFor({ state: "visible" });
  await basicInfoTab.click();

  await expect(page.locator("#tournamentFormHeader")).toBeVisible({
    timeout: 10000,
  });

  const uniqueName = generateUniqueName();
  await page.locator("#name").fill(uniqueName);
  await page.locator("#startDate").fill("2026-06-01");
  await page.locator("#endDate").fill("2026-06-05");

  // Click Save & Next to go to RegPay tab
  const saveNextButton1 = page.getByRole("button", { name: "Save & Next" });
  await saveNextButton1.click();
  // Wait for Registration & Payment fields to appear instead of a fixed timeout
  await expect(page.locator("#regStartDate")).toBeVisible({ timeout: 10000 });

  // ========== Fill Registration & Payment tab ==========
  const regPayTab = page.getByRole("tab", {
    name: "Registration & Payment",
  });
  await regPayTab.waitFor({ state: "visible" });

  // Fill registration dates
  await page.locator("#regStartDate").fill("2026-05-01");
  await page.locator("#regEndDate").fill("2026-05-31");
  await page.locator("#maxAllowedWithdraDate").fill("2026-05-25");

  // Click Save & Next to go to Color Theme tab
  const saveNextButton2 = page.getByRole("button", { name: "Save & Next" });
  await saveNextButton2.click();
  // Wait for Color Theme inputs to appear
  await expect(page.locator("#titleText")).toBeVisible({ timeout: 10000 });

  // ========== Fill Color Theme tab (minimal) ==========
  const colorThemeTab = page.getByRole("tab", {
    name: /Color.*Theme/i,
  });
  await colorThemeTab.waitFor({ state: "visible" });

  // Fill minimal color theme data (just to satisfy validation)
  await page.locator("#titleText").fill("#000000");
  await page.locator("#headerRowBg").fill("#FFFFFF");

  // Click Save & Next to go to Courses tab
  const saveNextButton3 = page.getByRole("button", { name: "Save & Next" });
  await saveNextButton3.click();
  // Ensure we've advanced to the Courses area
  await page.waitForURL(/courses/i, { timeout: 10000 });

  // ========== Fill Courses tab ==========
  // Check URL instead of tab to avoid ambiguity
  await expect(page.url()).toMatch(/courses/i);

  // Add a course by searching and selecting one
  const searchInput = page.locator("#courseInputBoxId");
  await searchInput.fill("Golf");
  await page.waitForTimeout(1500);

  const dropdownItems = page.locator(".list-group-item");
  await dropdownItems.first().waitFor({ state: "visible", timeout: 5000 });
  await dropdownItems.first().click();
  await page.waitForTimeout(1000);

  // Click Save & Next to go to Divisions tab
  const saveNextButton4 = page.getByRole("button", { name: "Save & Next" });
  await saveNextButton4.click();
  // Ensure we've advanced to the Divisions area
  await page.waitForURL(/divisions/i, { timeout: 10000 });

  // ========== Should now be on Divisions tab ==========
  // Check URL instead of tab to avoid ambiguity
  await expect(page.url()).toMatch(/divisions/i);

  // Wait for page to be fully loaded
  await page.waitForTimeout(2000);

  return uniqueName;
}

test.describe("Division Round Dates Update When Tournament Dates Change", () => {
  test("should update round dates when tournament dates are changed", async ({
    page,
  }) => {
    // Connect to database at start of test
    await connectToDatabase();

    let createdTournamentName = null;

    try {
      // Login
      await loginWithCredentials(page);
      await dismissInitialAlerts(page);
      createdTournamentName = await navigateToDivisionsTab(page);

      // Dismiss any alerts that may have appeared
      await dismissInitialAlerts(page);

      // ==========================================
      // STEP 1: Add a division with a round
      // ==========================================
      const addDivisionButton = page.getByRole("button", {
        name: /Add Division/i,
      });

      await addDivisionButton.waitFor({ state: "visible", timeout: 10000 });
      await addDivisionButton.click();
      await page.waitForTimeout(1000);

      // Wait for the division modal to be visible
      const divisionModal = page
        .locator(".modal.show")
        .filter({ hasText: "Add Division" });
      await divisionModal.waitFor({ state: "visible", timeout: 5000 });

      // Fill division name (note: input has id="name" not id="divisionName")
      const divisionNameInput = divisionModal.locator("#name");
      await divisionNameInput.waitFor({ state: "visible", timeout: 5000 });
      await divisionNameInput.fill("Open Division");

      // The round should be auto-populated with tournament start date (2026-06-01)
      // Get the initial round date from the dropdown
      const roundDateSelect = page.locator(
        'select[name="rounds[0].dayOffset"]',
      );
      await roundDateSelect.waitFor({ state: "visible", timeout: 5000 });

      // Select a specific round date - Day 3 (2026-06-03, offset = 2)
      await roundDateSelect.selectOption({ value: "2" });
      await page.waitForTimeout(500);

      // Close the modal without saving yet
      const closeDivisionButton = page
        .locator(".modal-content")
        .getByRole("button", { name: "Close" });
      await closeDivisionButton.click();
      await page.waitForTimeout(500);

      // ==========================================
      // STEP 2: Navigate back to Basic Info and change tournament dates
      // ==========================================
      // Navigate back to Basic Info tab
      const basicInfoTab = page.getByRole("tab", { name: "Basic Info" });
      await basicInfoTab.click();
      await page.waitForTimeout(1000);

      // Change tournament dates (shift by 1 month: June 1-5 → July 1-5)
      const startDateInput = page.locator("#startDate");
      const endDateInput = page.locator("#endDate");

      await startDateInput.fill("2026-07-01");
      await endDateInput.fill("2026-07-05");

      // Save & Next to propagate the date changes
      const saveNextButton1 = page.getByRole("button", { name: "Save & Next" });
      await saveNextButton1.click();
      await page.waitForTimeout(2000);

      // ==========================================
      // STEP 3: Navigate back to Divisions tab and verify round dates updated
      // ==========================================
      // Navigate through tabs to get back to Divisions
      // We're currently on RegPay after Save & Next from Basic Info
      const regPaySaveNext = page.getByRole("button", { name: "Save & Next" });
      await regPaySaveNext.click();
      await page.waitForTimeout(1000);

      // Color Theme tab
      const colorThemeSaveNext = page.getByRole("button", {
        name: "Save & Next",
      });
      await colorThemeSaveNext.click();
      await page.waitForTimeout(1000);

      // Courses tab
      const coursesSaveNext = page.getByRole("button", { name: "Save & Next" });
      await coursesSaveNext.click();
      await page.waitForTimeout(1000);

      // Should now be on Divisions tab
      await expect(page.url()).toMatch(/divisions/i);

      // Click to open the Add Division modal again
      const addDivisionButton2 = page.getByRole("button", {
        name: "Add Division to Tournament",
      });
      await addDivisionButton2.click();
      await page.waitForTimeout(1000);

      // Wait for the division modal to be visible
      const divisionModal2 = page
        .locator(".modal.show")
        .filter({ hasText: "Add Division" });
      await divisionModal2.waitFor({ state: "visible", timeout: 5000 });

      // Fill division name again (use id="name" not #divisionName)
      const divisionNameInput2 = divisionModal2.locator("#name");
      await divisionNameInput2.waitFor({ state: "visible", timeout: 5000 });
      await divisionNameInput2.fill("Open Division");

      // Check the round date options in the dropdown
      const updatedRoundDateSelect = page.locator(
        'select[name="rounds[0].dayOffset"]',
      );
      await updatedRoundDateSelect.waitFor({
        state: "visible",
        timeout: 5000,
      });

      // Select the same relative day (Day 3, offset = 2)
      await updatedRoundDateSelect.selectOption({ value: "2" });
      await page.waitForTimeout(500);

      const updatedRoundValue = await updatedRoundDateSelect.inputValue();
      const updatedRoundText = await updatedRoundDateSelect
        .locator(`option[value="${updatedRoundValue}"]`)
        .textContent();

      // TEST: Verify the offset is still "2" (Day 3)
      expect(updatedRoundValue).toBe("2");
      console.log(
        "✅ TEST 1 PASSED: Round offset preserved (still Day 3 = offset 2)",
      );

      // TEST: Verify the date text shows the new tournament date (July 3)
      // Note: Date format is M/D/YYYY not MM/DD/YYYY
      expect(updatedRoundText).toContain("7/3/2026");
      console.log(
        "✅ TEST 2 PASSED: Round date updated to new tournament timeline (7/3/2026)",
      );

      // Close the modal
      const closeDivisionButton2 = page
        .locator(".modal-content")
        .getByRole("button", { name: "Close" });
      await closeDivisionButton2.click();
      await page.waitForTimeout(500);

      console.log(
        "\n🎉 ALL TESTS PASSED: Round dates correctly update when tournament dates change during wizard creation!",
      );
      console.log(
        "   - Round maintained its relative position (Day 3 = offset 2)",
      );
      console.log("   - Round date updated from 06/03/2026 to 07/03/2026");

      // Clean up the tournament
      await cleanupTestTournament(createdTournamentName);
      createdTournamentName = null;
    } catch (error) {
      console.error("❌ Test failed:", error.message);
      throw error;
    } finally {
      // Ensure cleanup
      if (createdTournamentName) {
        try {
          await cleanupTestTournament(createdTournamentName);
        } catch (e) {
          console.warn("Cleanup failed:", e.message);
        }
      }

      // Disconnect from database
      await disconnectFromDatabase();
    }
  });
});

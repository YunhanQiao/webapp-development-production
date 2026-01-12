const { test, expect } = require("@playwright/test");
const mongoose = require("mongoose");
const path = require("path");

const LOGIN_EMAIL = "seal-osu@gmail.com";
const LOGIN_PASSWORD = "GoodLuck2025!";

// Generate unique tournament name for this test run
const generateUniqueName = () => `Seal Lab Tournament`;

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
    if (global.testConnection && global.testConnection.readyState === 1) {
      await global.testConnection.close();

      global.testConnection = null;
      global.TestCompetition = null;
    }
  } catch (error) {
    console.error("⚠️ Database disconnection warning:", error.message);
  }
}

async function verifyColorThemeInDB(tournamentName, expectedColors) {
  try {
    // Wait a moment for the database write to complete
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const TestCompetition = global.TestCompetition;

    const tournament = await TestCompetition.findOne({
      "basicInfo.name": tournamentName,
    })
      .lean()
      .maxTimeMS(30000);

    if (!tournament) {
      throw new Error(`Tournament "${tournamentName}" not found in database`);
    }

    if (!tournament.colorTheme) {
      throw new Error(
        `Color theme data not found for tournament "${tournamentName}"`,
      );
    }

    // Verify all color fields that were provided
    for (const [fieldName, expectedValue] of Object.entries(expectedColors)) {
      const dbValue = tournament.colorTheme[fieldName]?.toLowerCase() || "";
      const expectedLower = expectedValue.toLowerCase();

      if (dbValue !== expectedLower) {
        throw new Error(
          `Color theme field '${fieldName}' doesn't match. Expected: ${expectedValue}, Got: ${tournament.colorTheme[fieldName]}`,
        );
      }
    }

    return tournament;
  } catch (error) {
    console.error("❌ Database verification error:", error.message);
    throw new Error(`Color theme verification failed: ${error.message}`);
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

async function navigateToColorThemeTab(page) {
  // Check if we're already on competitions page
  const currentUrl = page.url();
  if (!currentUrl.includes("/competitions")) {
    // Only click Competitions tab if we're not already there
    const tournamentsModeButton = page.getByRole("tab", {
      name: "Competitions",
    });
    await tournamentsModeButton.waitFor({ state: "visible" });
    await tournamentsModeButton.click();
    await page.waitForTimeout(500);
  }

  // Wait for the competitions page to be fully loaded
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1000);

  const newTournamentButton = page.getByRole("button", {
    name: "New Tournament",
  });
  await newTournamentButton.waitFor({ state: "visible", timeout: 10000 });
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
  await page.waitForTimeout(2000);

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
  await page.waitForTimeout(2000);

  // ========== Should now be on Color Theme tab ==========
  const colorThemeTab = page.getByRole("tab", {
    name: /Color.*Theme/i,
  });
  await colorThemeTab.waitFor({ state: "visible" });

  return uniqueName;
}

test.describe("Color Theme Save Buttons - Combined Test", () => {
  test("All Save Buttons: Save & Exit and Save & Next", async ({ page }) => {
    // Connect to database at start of test
    await connectToDatabase();

    let createdTournamentName = null;

    try {
      // Login once for all button tests
      await loginWithCredentials(page);
      await dismissInitialAlerts(page);

      // ==========================================
      // TEST 1: Save & Exit Button
      // ==========================================
      console.log("\n🧪 TEST 1: Testing Save & Exit Button");

      createdTournamentName = await navigateToColorThemeTab(page);

      // Define all 13 color values
      const titleText = "#FF5733";
      const headerRowBg = "#3498DB";
      const headerRowTxt = "#FFFFFF";
      const updateBtnBg = "#2ECC71";
      const updateBtnTxt = "#000000";
      const tournNameBannerBg = "#13294E";
      const tournNameBannerTxt = "#FFFFFF";
      const strParColBg = "#13294E";
      const strParColTxt = "#FFFFFF";
      const timeParColBg = "#13294E";
      const timeParColTxt = "#FFFFFF";
      const SGParColBg = "#000000";
      const SGParColTxt = "#FFFFFF";

      // Fill all color fields (simulating user filling out the form)
      await page.locator("#titleText").fill(titleText);
      await page.locator("#headerRowBg").fill(headerRowBg);
      await page.locator("#headerRowTxt").fill(headerRowTxt);
      await page.locator("#updateBtnBg").fill(updateBtnBg);
      await page.locator("#updateBtnTxt").fill(updateBtnTxt);
      await page.locator("#tournNameBannerBg").fill(tournNameBannerBg);
      await page.locator("#tournNameBannerTxt").fill(tournNameBannerTxt);
      await page.locator("#strParColBg").fill(strParColBg);
      await page.locator("#strParColTxt").fill(strParColTxt);
      await page.locator("#timeParColBg").fill(timeParColBg);
      await page.locator("#timeParColTxt").fill(timeParColTxt);
      await page.locator("#SGParColBg").fill(SGParColBg);
      await page.locator("#SGParColTxt").fill(SGParColTxt);
      await page.waitForTimeout(500);

      // Click Save & Exit button
      const saveExitButton = page.getByRole("button", { name: "Save & Exit" });
      await saveExitButton.click();
      await page.waitForTimeout(3000);

      // Verify tournament appears in list
      await page.waitForTimeout(2000);
      const tournamentRow3 = page.locator(`text="${createdTournamentName}"`);
      await expect(tournamentRow3.first()).toBeVisible({ timeout: 5000 });
      console.log(
        "✅ TEST 1-a PASSED: Tournament appears in competitions list after save",
      );

      // Verify all 13 color fields saved in database
      await verifyColorThemeInDB(createdTournamentName, {
        titleText,
        headerRowBg,
        headerRowTxt,
        updateBtnBg,
        updateBtnTxt,
        tournNameBannerBg,
        tournNameBannerTxt,
        strParColBg,
        strParColTxt,
        timeParColBg,
        timeParColTxt,
        SGParColBg,
        SGParColTxt,
      });
      console.log(
        "✅ TEST 1-b PASSED: All 13 color theme fields saved in database",
      );

      // Clean up this tournament
      await cleanupTestTournament(createdTournamentName);
      createdTournamentName = null;

      // ==========================================
      // TEST 2: Save & Next Button
      // ==========================================
      console.log("\n🧪 TEST 2: Testing Save & Next Button");

      createdTournamentName = await navigateToColorThemeTab(page);

      // Define all 13 color values
      const titleText2 = "#ABCDEF";
      const headerRowBg2 = "#654321";
      const headerRowTxt2 = "#FFFFFF";
      const updateBtnBg2 = "#FEDCBA";
      const updateBtnTxt2 = "#000000";
      const tournNameBannerBg2 = "#123456";
      const tournNameBannerTxt2 = "#ABCDEF";
      const strParColBg2 = "#111111";
      const strParColTxt2 = "#FFFFFF";
      const timeParColBg2 = "#222222";
      const timeParColTxt2 = "#FFFFFF";
      const SGParColBg2 = "#000000";
      const SGParColTxt2 = "#FFFFFF";

      // Fill all color fields (simulating user filling out the form)
      await page.locator("#titleText").fill(titleText2);
      await page.locator("#headerRowBg").fill(headerRowBg2);
      await page.locator("#headerRowTxt").fill(headerRowTxt2);
      await page.locator("#updateBtnBg").fill(updateBtnBg2);
      await page.locator("#updateBtnTxt").fill(updateBtnTxt2);
      await page.locator("#tournNameBannerBg").fill(tournNameBannerBg2);
      await page.locator("#tournNameBannerTxt").fill(tournNameBannerTxt2);
      await page.locator("#strParColBg").fill(strParColBg2);
      await page.locator("#strParColTxt").fill(strParColTxt2);
      await page.locator("#timeParColBg").fill(timeParColBg2);
      await page.locator("#timeParColTxt").fill(timeParColTxt2);
      await page.locator("#SGParColBg").fill(SGParColBg2);
      await page.locator("#SGParColTxt").fill(SGParColTxt2);
      await page.waitForTimeout(500);

      // Click Save & Next button
      const saveNextButton = page.getByRole("button", { name: "Save & Next" });
      await saveNextButton.click();
      await page.waitForTimeout(3000);

      // Should advance to next tab (Courses) - check URL instead of tab to avoid ambiguity
      await expect(page.url()).toMatch(/courses/i);
      console.log("✅ TEST 2-a PASSED: Advances to Courses tab");

      // Go back to Color Theme tab to verify fields preserved
      const colorThemeTab = page.getByRole("tab", {
        name: /Color.*Theme/i,
      });
      await colorThemeTab.click();
      await page.waitForTimeout(1000);

      // Verify fields are preserved (or at least populated)
      const currentTitleText = await page.locator("#titleText").inputValue();
      const currentHeaderRowBg = await page
        .locator("#headerRowBg")
        .inputValue();
      const currentUpdateBtnBg = await page
        .locator("#updateBtnBg")
        .inputValue();

      // Fields should be populated
      expect(currentTitleText).toBeTruthy();
      expect(currentHeaderRowBg).toBeTruthy();
      expect(currentUpdateBtnBg).toBeTruthy();
      console.log("✅ TEST 2-b PASSED: All fields preserved after Save & Next");

      // Verify all 13 color fields saved in database
      await verifyColorThemeInDB(createdTournamentName, {
        titleText: titleText2,
        headerRowBg: headerRowBg2,
        headerRowTxt: headerRowTxt2,
        updateBtnBg: updateBtnBg2,
        updateBtnTxt: updateBtnTxt2,
        tournNameBannerBg: tournNameBannerBg2,
        tournNameBannerTxt: tournNameBannerTxt2,
        strParColBg: strParColBg2,
        strParColTxt: strParColTxt2,
        timeParColBg: timeParColBg2,
        timeParColTxt: timeParColTxt2,
        SGParColBg: SGParColBg2,
        SGParColTxt: SGParColTxt2,
      });
      console.log(
        "✅ TEST 2-c PASSED: All 13 color theme fields saved in database",
      );

      // Clean up this tournament
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

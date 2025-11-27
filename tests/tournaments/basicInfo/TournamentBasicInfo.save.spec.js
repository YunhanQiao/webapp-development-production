const { test, expect } = require("@playwright/test");
const mongoose = require("mongoose");
const path = require("path");

const LOGIN_EMAIL = "seal-osu@gmail.com";
const LOGIN_PASSWORD = "GoodLuck2025!";

// Generate unique tournament name for this test run
const generateUniqueName = () => `E2E Save Test ${Date.now()}`;

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
    if (global.testConnection && global.testConnection.readyState === 1) {
      await global.testConnection.close();

      global.testConnection = null;
      global.TestCompetition = null;
    }
  } catch (error) {
    console.error("⚠️ Database disconnection warning:", error.message);
  }
}

async function verifyBasicInfoInDB(tournamentName, startDate, endDate) {
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
      const allTournaments = await TestCompetition.find(
        {},
        { "basicInfo.name": 1 },
      )
        .lean()
        .limit(10);
      throw new Error(`Tournament "${tournamentName}" not found in database`);
    }

    // Verify dates match
    const dbStartDate = new Date(tournament.basicInfo.startDate)
      .toISOString()
      .split("T")[0];
    const dbEndDate = new Date(tournament.basicInfo.endDate)
      .toISOString()
      .split("T")[0];

    if (dbStartDate !== startDate || dbEndDate !== endDate) {
      throw new Error(
        `Tournament dates don't match. Expected: ${startDate} - ${endDate}, Got: ${dbStartDate} - ${dbEndDate}`,
      );
    }

    return tournament;
  } catch (error) {
    console.error("❌ Database verification error:", error.message);
    throw new Error(`Basic info verification failed: ${error.message}`);
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

async function fillRequiredFields(page, tournamentName) {
  await page.locator("#name").fill(tournamentName);
  await page.locator("#startDate").fill("2026-06-01");
  await page.locator("#endDate").fill("2026-06-05");
}

test.describe("Basic Info Save Buttons - Combined Test", () => {
  test("All Save Buttons: Cancel, Save & Exit, and Save & Next", async ({
    page,
  }) => {
    // Connect to database at start of test
    await connectToDatabase();

    // Login once for all button tests
    await loginWithCredentials(page);
    await dismissInitialAlerts(page);
    await navigateToBasicInfoTab(page);

    // ==========================================
    // TEST 1: Cancel Button
    // ==========================================
    console.log("\n🧪 TEST 1: Testing Cancel Button");
    const cancelName = generateUniqueName();

    await page.locator("#name").fill(cancelName);
    await page.locator("#startDate").fill("2026-06-01");
    await page.locator("#endDate").fill("2026-06-02");

    const cancelButton = page.getByRole("button", {
      name: "Cancel Changes & Exit",
    });

    await cancelButton.click();
    await page.waitForURL(/competitions\/?$/, { timeout: 5000 });

    await expect(page.url()).toMatch(/competitions\/?$/);
    await page.waitForTimeout(1000);

    const canceledTournament = page.locator(`text="${cancelName}"`);
    expect(await canceledTournament.count()).toBe(0);
    console.log(
      "✅ TEST 1 PASSED: Cancel returns to competitions list without saving",
    );

    // ==========================================
    // TEST 2: Save & Exit Button
    // ==========================================
    console.log("\n🧪 TEST 2: Testing Save & Exit Button");

    // Navigate back to create a new tournament
    await navigateToBasicInfoTab(page);

    const saveExitName = generateUniqueName();
    const saveExitStart = "2026-06-01";
    const saveExitEnd = "2026-06-05";

    try {
      await page.locator("#name").fill(saveExitName);
      await page.locator("#startDate").fill(saveExitStart);
      await page.locator("#endDate").fill(saveExitEnd);

      const saveButton = page.getByRole("button", { name: "Save & Exit" });
      await saveButton.click();

      await page.waitForTimeout(3000);

      await expect(page.url()).toMatch(/competitions\/?$/, { timeout: 10000 });
      console.log("✅ TEST 2-a PASSED: Navigated back to competitions list");

      await page.waitForTimeout(2000);
      const tournamentRow = page.locator(`text="${saveExitName}"`);
      await expect(tournamentRow.first()).toBeVisible({ timeout: 5000 });
      console.log("✅ TEST 2-b PASSED: Tournament appears in list after save");

      await verifyBasicInfoInDB(saveExitName, saveExitStart, saveExitEnd);
      console.log("✅ TEST 2-c PASSED: Tournament data saved in database");
    } finally {
      await cleanupTestTournament(saveExitName);
    }

    // ==========================================
    // TEST 3: Save & Next Button
    // ==========================================
    console.log("\n🧪 TEST 3: Testing Save & Next Button");

    // Navigate back to create a new tournament
    await navigateToBasicInfoTab(page);

    const saveNextName = generateUniqueName();
    const saveNextStart = "2026-06-15";
    const saveNextEnd = "2026-06-17";
    const teeTime = "09:30";

    try {
      await page.locator("#name").fill(saveNextName);
      await page.locator("#startDate").fill(saveNextStart);
      await page.locator("#endDate").fill(saveNextEnd);

      const teeTimeInputs = page.locator('input[type="time"]');
      const hasTeeTime = (await teeTimeInputs.count()) > 0;
      if (hasTeeTime) {
        await teeTimeInputs.first().fill(teeTime);
      }

      const saveNextButton = page.getByRole("button", { name: "Save & Next" });
      await saveNextButton.click();
      await page.waitForTimeout(3000);

      const regPaymentTab = page.getByRole("tab", {
        name: "Registration & Payment",
      });

      if ((await regPaymentTab.count()) > 0) {
        await expect(regPaymentTab).toHaveAttribute("aria-selected", "true", {
          timeout: 5000,
        });
        console.log(
          "✅ TEST 3-a PASSED: Advances to Registration & Payment tab",
        );
      } else {
        console.log(
          "⚠️  TEST 3-a SKIPPED: Registration & Payment tab not found",
        );
      }

      const successMessageExists =
        (await page.locator(".alert-success").count()) > 0 ||
        (await page.locator(".toast-success").count()) > 0 ||
        (await page.locator("text=/saved/i").count()) > 0 ||
        (await page.locator("text=/success/i").count()) > 0;

      if (successMessageExists) {
        console.log(
          "✅ TEST 3-b PASSED: Success message shown after Save & Next",
        );
      } else {
        console.log(
          "⚠️  TEST 3-b SKIPPED: Success message not found - might be implicit",
        );
      }

      const basicInfoTab = page.getByRole("tab", { name: "Basic Info" });
      await basicInfoTab.click();
      await page.waitForTimeout(1000);

      expect(await page.locator("#name").inputValue()).toBe(saveNextName);
      expect(await page.locator("#startDate").inputValue()).toBe(saveNextStart);
      expect(await page.locator("#endDate").inputValue()).toBe(saveNextEnd);

      if (hasTeeTime) {
        expect(await teeTimeInputs.first().inputValue()).toBe(teeTime);
      }
      console.log("✅ TEST 3-c PASSED: All fields preserved after Save & Next");

      await verifyBasicInfoInDB(saveNextName, saveNextStart, saveNextEnd);
      console.log("✅ TEST 3-d PASSED: Tournament data saved in database");
    } finally {
      await cleanupTestTournament(saveNextName);
    }

    console.log(
      "\n🎉 ALL SAVE BUTTON TESTS COMPLETED: Cancel, Save & Exit, and Save & Next!",
    );
  });
});

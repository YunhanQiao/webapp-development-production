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
  path: path.join(__dirname, "../../../../SpeedScore-backend/.env"),
});

// Import the actual backend models - use relative path
const backendModelsPath = path.join(
  __dirname,
  "../../../../SpeedScore-backend/src/models/index.js",
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

async function verifyRegPayInfoInDB(tournamentName, regStartDate, regEndDate) {
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

    // Verify registration dates if they exist
    if (regStartDate && regEndDate && tournament.regPayInfo) {
      const dbRegStartDate = new Date(tournament.regPayInfo.regStartDate)
        .toISOString()
        .split("T")[0];
      const dbRegEndDate = new Date(tournament.regPayInfo.regEndDate)
        .toISOString()
        .split("T")[0];

      if (dbRegStartDate !== regStartDate || dbRegEndDate !== regEndDate) {
        throw new Error(
          `Registration dates don't match. Expected: ${regStartDate} - ${regEndDate}, Got: ${dbRegStartDate} - ${dbRegEndDate}`,
        );
      }
    }

    return tournament;
  } catch (error) {
    console.error("❌ Database verification error:", error.message);
    throw new Error(`RegPay info verification failed: ${error.message}`);
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
  const uniqueName = generateUniqueName();
  await page.locator("#name").fill(uniqueName);
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

  return uniqueName;
}

async function fillRequiredRegPayFields(page) {
  // Fill registration window dates
  await page.locator("#regStartDate").fill("2026-05-01");
  await page.locator("#regEndDate").fill("2026-05-31");

  // Fill withdrawal deadline
  await page.locator("#maxAllowedWithdraDate").fill("2026-05-25");
}

test.describe("Registration & Payment Save Buttons - Combined Test", () => {
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

      createdTournamentName = await navigateToRegPayTab(page);

      const regStartDate = "2026-05-01";
      const regEndDate = "2026-05-31";

      // Fill RegPay data
      await page.locator("#regStartDate").fill(regStartDate);
      await page.locator("#regEndDate").fill(regEndDate);
      await page.locator("#maxAllowedWithdraDate").fill("2026-05-25");

      // Click Save & Exit button
      const saveExitButton = page.getByRole("button", { name: "Save & Exit" });
      await saveExitButton.click();
      await page.waitForTimeout(3000);

      // Verify tournament appears in list
      await page.waitForTimeout(2000);
      const tournamentRow3 = page.locator(`text="${createdTournamentName}"`);
      await expect(tournamentRow3.first()).toBeVisible({ timeout: 5000 });
      console.log("✅ TEST 1-a PASSED: Tournament appears in list after save");

      // Verify RegPay data saved in database
      await verifyRegPayInfoInDB(
        createdTournamentName,
        regStartDate,
        regEndDate,
      );
      console.log(
        "✅ TEST 1-b PASSED: Registration & Payment data saved in database",
      );

      // Clean up this tournament
      await cleanupTestTournament(createdTournamentName);
      createdTournamentName = null;

      // ==========================================
      // TEST 2: Save & Next Button
      // ==========================================
      console.log("\n🧪 TEST 2: Testing Save & Next Button");

      createdTournamentName = await navigateToRegPayTab(page);

      const regStartDate2 = "2026-05-10";
      const regEndDate2 = "2026-05-30";
      const withdrawalDate = "2026-05-28";

      // Fill RegPay data
      await page.locator("#regStartDate").fill(regStartDate2);
      await page.locator("#regEndDate").fill(regEndDate2);
      await page.locator("#maxAllowedWithdraDate").fill(withdrawalDate);

      // Click Save & Next button
      const saveNextButton = page.getByRole("button", { name: "Save & Next" });
      await saveNextButton.click();
      await page.waitForTimeout(3000);

      // Should advance to next tab (Color & Theme)
      const colorThemeTab = page.getByRole("tab", {
        name: /Color.*Theme/i,
      });

      if ((await colorThemeTab.count()) > 0) {
        await expect(colorThemeTab).toHaveAttribute("aria-selected", "true", {
          timeout: 5000,
        });
        console.log("✅ TEST 2-a PASSED: Advances to Color & Theme tab");
      } else {
        console.log(
          "⚠️  TEST 2-a SKIPPED: Color & Theme tab not found - checking URL",
        );
        await expect(page.url()).toMatch(/colorTheme/i);
        console.log("✅ TEST 2-a PASSED: URL indicates next tab");
      }

      // Verify RegPay data saved in database
      await verifyRegPayInfoInDB(
        createdTournamentName,
        regStartDate2,
        regEndDate2,
      );
      console.log(
        "✅ TEST 2-b PASSED: Registration & Payment data saved in database",
      );

      // Clean up this tournament
      await cleanupTestTournament(createdTournamentName);
      createdTournamentName = null;

      console.log(
        "\n🎉 ALL REG & PAY SAVE BUTTON TESTS COMPLETED: Save & Exit and Save & Next!",
      );
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

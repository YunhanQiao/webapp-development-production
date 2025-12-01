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

async function verifyDivisionsInDB(tournamentName, expectedDivisions) {
  try {
    const TestCompetition = global.TestCompetition;

    const timeout = 15000; // ms
    const interval = 1000; // ms
    const start = Date.now();

    while (Date.now() - start < timeout) {
      const tournament = await TestCompetition.findOne({
        "basicInfo.name": tournamentName,
      })
        .lean()
        .maxTimeMS(30000);

      if (tournament && Array.isArray(tournament.divisions)) {
        console.log(
          `📊 Database: Tournament has ${tournament.divisions.length} division(s)`,
        );

        if (!expectedDivisions || expectedDivisions.length === 0) {
          return tournament;
        }

        if (tournament.divisions.length === expectedDivisions.length) {
          // Verify each division exists
          let allFound = true;
          for (const expectedDivision of expectedDivisions) {
            const foundDivision = tournament.divisions.find(
              (d) => d.name === expectedDivision.name,
            );
            if (!foundDivision) {
              allFound = false;
              break;
            }
          }
          if (allFound) return tournament;
        }
      }

      await new Promise((r) => setTimeout(r, interval));
    }

    throw new Error(
      `Timed out waiting for divisions for tournament "${tournamentName}"`,
    );
  } catch (error) {
    console.error("❌ Database verification error:", error.message);
    throw new Error(`Divisions verification failed: ${error.message}`);
  }
}

// Verify by competition _id with polling (useful when frontend hits local backend)
async function verifyDivisionsInDBById(competitionId, expectedDivisions) {
  try {
    const TestCompetition = global.TestCompetition;

    const timeout = 15000; // ms
    const interval = 1000; // ms
    const start = Date.now();

    while (Date.now() - start < timeout) {
      const tournament = await TestCompetition.findById(competitionId)
        .lean()
        .maxTimeMS(30000);
      if (tournament && Array.isArray(tournament.divisions)) {
        if (!expectedDivisions || expectedDivisions.length === 0) {
          return tournament;
        }

        if (tournament.divisions.length === expectedDivisions.length) {
          // Verify each expected division exists
          let allFound = true;
          for (const expectedDivision of expectedDivisions) {
            const found = tournament.divisions.find(
              (d) => d.name === expectedDivision.name,
            );
            if (!found) {
              allFound = false;
              break;
            }
          }
          if (allFound) return tournament;
        }
      }
      await new Promise((r) => setTimeout(r, interval));
    }

    throw new Error(
      `Timed out waiting for divisions to appear for competition ${competitionId}`,
    );
  } catch (error) {
    console.error("❌ Database verification by id error:", error.message);
    throw new Error(`Divisions verification by id failed: ${error.message}`);
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

  return uniqueName;
}

test.describe("Divisions Save Buttons - Combined Test", () => {
  test("All Save Buttons: Previous, Cancel, Save & Exit", async ({ page }) => {
    // Connect to database at start of test
    await connectToDatabase();

    let createdTournamentName = null;

    try {
      // Login once for all button tests
      await loginWithCredentials(page);
      await dismissInitialAlerts(page);

      // ==========================================
      // TEST 1: Previous Button
      // ==========================================
      console.log("\n🧪 TEST 1: Testing Previous Button");

      createdTournamentName = await navigateToDivisionsTab(page);

      // Click Previous button
      const previousButton = page.getByRole("button", { name: "Previous" });
      await previousButton.click();
      await page.waitForTimeout(1000);

      // Should be back on Courses tab
      await expect(page.url()).toMatch(/courses/i);
      console.log("✅ TEST 1 PASSED: Previous returns to Courses tab");

      // Clean up this tournament
      await cleanupTestTournament(createdTournamentName);
      createdTournamentName = null;

      // ==========================================
      // TEST 2: Cancel Changes & Exit Button
      // ==========================================
      console.log("\n🧪 TEST 2: Testing Cancel Changes & Exit Button");

      createdTournamentName = await navigateToDivisionsTab(page);

      // Click Cancel button
      const cancelButton = page.getByRole("button", {
        name: "Cancel Changes & Exit",
      });
      await cancelButton.click();
      await page.waitForTimeout(1000);

      // Should return to competitions list
      await expect(page.url()).toMatch(/competitions\/?$/);
      console.log("✅ TEST 2-a PASSED: Navigated back to competitions list");

      // Verify tournament does NOT appear in the list (was not saved)
      await page.waitForTimeout(2000);
      const tournamentRow = page.locator(`text="${createdTournamentName}"`);
      await expect(tournamentRow).toHaveCount(0);
      console.log(
        "✅ TEST 2-b PASSED: Tournament not in list - Cancel did not save changes",
      );

      // Clean up this tournament (in case it was partially saved)
      await cleanupTestTournament(createdTournamentName);
      createdTournamentName = null;

      // ==========================================
      // TEST 3: Save & Exit Button
      // ==========================================
      console.log("\n🧪 TEST 3: Testing Save & Exit Button");

      createdTournamentName = await navigateToDivisionsTab(page);

      // Add a division
      const addDivisionButton = page.getByRole("button", {
        name: "Add Division to Tournament",
      });
      await addDivisionButton.click();
      await page.waitForTimeout(1000);

      // Fill division form
      await page.locator("#name").fill("Open Division");
      await page.locator("#entryFee").fill("100");

      // Select gender (All)
      const genderSelect = page.locator("#gender");
      await genderSelect.selectOption("All");

      // Fill age range
      await page.locator("#minAge").fill("18");
      await page.locator("#maxAge").fill("99");

      // Click the modal Save button to submit the division (modal shows "Save")
      await page.waitForTimeout(2000); // Wait for modal animation
      // Locate the open modal and click the submit button inside it to avoid matching global Save buttons
      const modal = page.locator(".modal:visible").first();
      const addDivisionSubmitButton = modal.locator('button[type="submit"]');
      await addDivisionSubmitButton.click();
      await page.waitForTimeout(2000);

      // Verify division appears in table
      const divisionRow = page.locator("tbody tr").first();
      await expect(divisionRow).toContainText("Open Division");
      console.log("✅ Division added to table");

      // Capture outgoing POST/PUT requests (to inspect payload) before clicking Save & Exit
      const capturedRequests = [];
      const onRequestFinished = async (request) => {
        try {
          // Playwright passes a Request object to this handler
          const method = request.method();
          if (method === "POST" || method === "PUT") {
            const url = request.url();
            const postData = request.postData ? request.postData() : null;
            console.log(
              "CAPTURED REQUEST ->",
              method,
              url,
              postData ? postData.slice(0, 1000) : null,
            );
            capturedRequests.push({ method, url, postData });
          }
        } catch (e) {
          console.error("Error capturing request:", e.message);
        }
      };

      page.on("requestfinished", onRequestFinished);

      // Click Save & Exit button
      const saveExitButton = page.getByRole("button", { name: "Save & Exit" });
      await saveExitButton.click();

      // Wait a short while for requests to complete and be captured
      await page.waitForTimeout(4000);

      // Unregister listener
      page.off("requestfinished", onRequestFinished);

      console.log("Captured requests count:", capturedRequests.length);

      // Should return to competitions list
      await expect(page.url()).toMatch(/competitions\/?$/, { timeout: 10000 });
      console.log("✅ TEST 3-a PASSED: Navigated back to competitions list");

      // Verify tournament appears in list
      await page.waitForTimeout(2000);
      const tournamentRow = page.locator(`text="${createdTournamentName}"`);
      await expect(tournamentRow.first()).toBeVisible({ timeout: 5000 });
      console.log("✅ TEST 3-b PASSED: Tournament appears in list after save");

      // If we captured a request containing the competition id, use that id to verify
      let usedVerification = false;
      if (capturedRequests.length > 0) {
        for (const r of capturedRequests) {
          try {
            const m = (r.url || "").match(
              /\/competition\/(?:api\/)?([0-9a-fA-F]{24})/,
            );
            if (m && m[1]) {
              const competitionId = m[1];
              console.log(
                `🔎 Verifying divisions by competition id: ${competitionId}`,
              );
              await verifyDivisionsInDBById(competitionId, [
                { name: "Open Division" },
              ]);
              usedVerification = true;
              break;
            }
          } catch (e) {
            console.warn("Warning parsing captured request URL:", e.message);
          }
        }
      }

      // Fallback: verify by tournament name
      if (!usedVerification) {
        await verifyDivisionsInDB(createdTournamentName, [
          { name: "Open Division" },
        ]);
      }

      console.log("✅ TEST 3-c PASSED: Division saved in database");

      // Clean up this tournament
      await cleanupTestTournament(createdTournamentName);
      createdTournamentName = null;
    } catch (error) {
      console.error("❌ Test failed:", error.message);
      // Optionally rethrow or handle error
      throw error;
    } finally {
      // Ensure we clean up the test tournament while DB connection is still open
      if (createdTournamentName) {
        try {
          await cleanupTestTournament(createdTournamentName);
        } catch (e) {
          console.warn("Cleanup failed:", e.message);
        }
      }

      // Then disconnect from database
      await disconnectFromDatabase();
    }
  });
});

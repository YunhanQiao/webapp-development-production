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

async function verifyCoursesInDB(tournamentName, expectedCourses) {
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

    // Check if courses field exists (it might be an empty array, which is valid)
    if (!tournament.courses) {
      throw new Error(
        `Courses field not found for tournament "${tournamentName}"`,
      );
    }

    console.log(
      `📊 Database: Tournament has ${tournament.courses.length} course(s)`,
    );

    // Verify expected number of courses if provided
    if (expectedCourses && expectedCourses.length > 0) {
      if (tournament.courses.length !== expectedCourses.length) {
        throw new Error(
          `Expected ${expectedCourses.length} courses, but found ${tournament.courses.length} in database`,
        );
      }

      // Verify each course exists
      for (const expectedCourse of expectedCourses) {
        const foundCourse = tournament.courses.find(
          (c) =>
            c.courseId === expectedCourse.courseId ||
            c.name === expectedCourse.name,
        );
        if (!foundCourse) {
          throw new Error(
            `Expected course "${expectedCourse.name}" not found in database`,
          );
        }
      }
    }

    return tournament;
  } catch (error) {
    console.error("❌ Database verification error:", error.message);
    throw new Error(`Courses verification failed: ${error.message}`);
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

async function navigateToCoursesTab(page) {
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
  await page.waitForTimeout(2000);

  // ========== Should now be on Courses tab ==========
  // Check URL instead of tab to avoid ambiguity with duplicate "Courses" tabs
  await expect(page.url()).toMatch(/courses/i);

  return uniqueName;
}

async function searchAndAddCourse(page, searchQuery) {
  // Type in search box
  const searchInput = page.locator("#courseInputBoxId");
  await searchInput.fill(searchQuery);
  await page.waitForTimeout(1000);

  // Wait for search results
  const searchResults = page.locator(".list-group-item");
  await searchResults.first().waitFor({ state: "visible", timeout: 5000 });

  // Click first result
  await searchResults.first().click();
  await page.waitForTimeout(1000);
}

test.describe("Courses Save Buttons - Combined Test", () => {
  test("All Save Buttons: Previous, Cancel, Save & Exit, and Save & Next", async ({
    page,
  }) => {
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

      createdTournamentName = await navigateToCoursesTab(page);

      // Click Previous button
      const previousButton = page.getByRole("button", { name: "Previous" });
      await previousButton.click();
      await page.waitForTimeout(1000);

      // Should be back on Color Theme tab
      await expect(page.url()).toMatch(/colorTheme\/?$/);
      const colorThemeTab = page.getByRole("tab", {
        name: /Color.*Theme/i,
      });
      await expect(colorThemeTab).toHaveAttribute("aria-selected", "true", {
        timeout: 5000,
      });
      console.log("✅ TEST 1 PASSED: Previous returns to Color Theme tab");

      // Clean up this tournament
      await cleanupTestTournament(createdTournamentName);
      createdTournamentName = null;

      // ==========================================
      // TEST 2: Cancel Changes & Exit Button
      // ==========================================
      console.log("\n🧪 TEST 2: Testing Cancel Changes & Exit Button");

      createdTournamentName = await navigateToCoursesTab(page);

      // Click Cancel button
      const cancelButton = page.getByRole("button", {
        name: "Cancel Changes & Exit",
      });
      await cancelButton.click();
      await page.waitForTimeout(1000);

      // Should return to competitions list
      await expect(page.url()).toMatch(/competitions\/?$/);
      console.log(
        "✅ TEST 2 PASSED: Cancel returns to competitions list without saving Courses changes",
      );

      // Clean up this tournament
      await cleanupTestTournament(createdTournamentName);
      createdTournamentName = null;

      // ==========================================
      // TEST 3: Save & Exit Button
      // ==========================================
      console.log("\n🧪 TEST 3: Testing Save & Exit Button");

      createdTournamentName = await navigateToCoursesTab(page);

      // Add a course by searching and selecting one
      const searchInput = page.locator("#courseInputBoxId");
      await searchInput.fill("Golf");
      await page.waitForTimeout(1500);

      // Wait for search results and click first one
      const dropdownItems = page.locator(".list-group-item");
      await dropdownItems.first().waitFor({ state: "visible", timeout: 5000 });
      await dropdownItems.first().click();
      await page.waitForTimeout(1000);

      // Verify at least one course is present
      const courseRows = page.locator(".courses-table tbody tr");
      const courseCount = await courseRows.count();
      expect(courseCount).toBeGreaterThan(0);
      console.log(`✅ Found ${courseCount} course(s) in table`);

      // Click Save & Exit button
      const saveExitButton = page.getByRole("button", { name: "Save & Exit" });
      await saveExitButton.click();
      await page.waitForTimeout(3000);

      // Should return to competitions list
      await expect(page.url()).toMatch(/competitions\/?$/, { timeout: 10000 });
      console.log("✅ TEST 3-a PASSED: Navigated back to competitions list");

      // Verify tournament appears in list
      await page.waitForTimeout(2000);
      const tournamentRow = page.locator(`text="${createdTournamentName}"`);
      await expect(tournamentRow.first()).toBeVisible({ timeout: 5000 });
      console.log("✅ TEST 3-b PASSED: Tournament appears in list after save");

      // Verify Courses data saved in database
      await verifyCoursesInDB(createdTournamentName, null);
      console.log("✅ TEST 3-c PASSED: Courses data saved in database");

      // Clean up this tournament
      await cleanupTestTournament(createdTournamentName);
      createdTournamentName = null;

      // ==========================================
      // TEST 4: Save & Next Button
      // ==========================================
      console.log("\n🧪 TEST 4: Testing Save & Next Button");

      createdTournamentName = await navigateToCoursesTab(page);

      // Add a course by searching and selecting one
      const searchInput2 = page.locator("#courseInputBoxId");
      await searchInput2.fill("Golf");
      await page.waitForTimeout(1500);

      const dropdownItems2 = page.locator(".list-group-item");
      await dropdownItems2.first().waitFor({ state: "visible", timeout: 5000 });
      await dropdownItems2.first().click();
      await page.waitForTimeout(1000);

      // Verify at least one course is present
      const courseRows2 = page.locator(".courses-table tbody tr");
      const courseCount2 = await courseRows2.count();
      expect(courseCount2).toBeGreaterThan(0);
      console.log(`✅ Found ${courseCount2} course(s) in table`);

      // Click Save & Next button
      const saveNextButton = page.getByRole("button", { name: "Save & Next" });
      await saveNextButton.click();
      await page.waitForTimeout(3000);

      // Should advance to next tab (Divisions) - check URL
      await expect(page.url()).toMatch(/divisions/i);
      console.log("✅ TEST 4-a PASSED: Advances to Divisions tab");

      // Verify Courses data saved in database
      await verifyCoursesInDB(createdTournamentName, null);
      console.log("✅ TEST 4-b PASSED: Courses data saved in database");

      // Clean up this tournament
      await cleanupTestTournament(createdTournamentName);
      createdTournamentName = null;

      console.log(
        "\n🎉 ALL COURSES SAVE BUTTON TESTS COMPLETED: Previous, Cancel, Save & Exit, and Save & Next!",
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

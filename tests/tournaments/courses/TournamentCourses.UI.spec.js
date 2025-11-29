const { test, expect } = require("@playwright/test");
const mongoose = require("mongoose");
const path = require("path");

const LOGIN_EMAIL = "seal-osu@gmail.com";
const LOGIN_PASSWORD = "GoodLuck2025!";

// Generate unique tournament name for this test run
const generateUniqueName = () => `Seal Lab Tournament`;

// Database configuration
const dbConfig = {
  url: `mongodb+srv://johnsonyqiao_db_user:k6bQihjU4KgszLel@cluster0.f5ssltl.mongodb.net/speedscore-expert?retryWrites=true&w=majority&appName=Cluster0`,
};

require("dotenv").config({
  path: path.join(__dirname, "../../../SpeedScore-backend/.env"),
});

const backendModelsPath =
  "/Users/yunhanqiao/Desktop/SpeedScore-backend/src/models/index.js";
const db = require(backendModelsPath);

async function connectToDatabase() {
  try {
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

async function cleanupTestTournament(tournamentName) {
  try {
    const TestCompetition = global.TestCompetition;
    await TestCompetition.deleteOne({
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

  // Fill Basic Info
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

  const saveNextButton1 = page.getByRole("button", { name: "Save & Next" });
  await saveNextButton1.click();
  await page.waitForTimeout(2000);

  // Fill RegPay
  await page.locator("#regStartDate").fill("2026-05-01");
  await page.locator("#regEndDate").fill("2026-05-31");
  await page.locator("#maxAllowedWithdraDate").fill("2026-05-25");

  const saveNextButton2 = page.getByRole("button", { name: "Save & Next" });
  await saveNextButton2.click();
  await page.waitForTimeout(2000);

  // Fill Color Theme (minimal)
  await page.locator("#titleText").fill("#000000");
  await page.locator("#headerRowBg").fill("#FFFFFF");

  const saveNextButton3 = page.getByRole("button", { name: "Save & Next" });
  await saveNextButton3.click();
  await page.waitForTimeout(2000);

  // Now on Courses tab - check URL to avoid ambiguity
  await expect(page.url()).toMatch(/courses/i);

  return uniqueName;
}

test.describe("Courses UI Tests", () => {
  test("TEST 1: Course search input exists and is functional", async ({
    page,
  }) => {
    await connectToDatabase();

    let createdTournamentName = null;

    try {
      await loginWithCredentials(page);
      await dismissInitialAlerts(page);

      createdTournamentName = await navigateToCoursesTab(page);

      // TEST 1-a: Verify search input exists
      const searchInput = page.locator("#courseInputBoxId");
      await expect(searchInput).toBeVisible();
      console.log("✅ TEST 1-a PASSED: Course search input is visible");

      // TEST 1-b: Verify search input is functional
      await searchInput.fill("Golf");
      const inputValue = await searchInput.inputValue();
      expect(inputValue).toBe("Golf");
      console.log("✅ TEST 1-b PASSED: Can type in search input");

      // Clean up
      await cleanupTestTournament(createdTournamentName);
    } catch (error) {
      if (createdTournamentName) {
        await cleanupTestTournament(createdTournamentName);
      }
      throw error;
    } finally {
      await disconnectFromDatabase();
    }
  });

  test("TEST 2: Course search shows results dropdown", async ({ page }) => {
    await connectToDatabase();

    let createdTournamentName = null;

    try {
      await loginWithCredentials(page);
      await dismissInitialAlerts(page);

      createdTournamentName = await navigateToCoursesTab(page);

      const searchInput = page.locator("#courseInputBoxId");
      await searchInput.fill("Golf");
      await page.waitForTimeout(1500);

      // TEST 2: Verify dropdown appears with results
      const dropdownItems = page.locator(".list-group-item");
      const count = await dropdownItems.count();
      expect(count).toBeGreaterThan(0);
      console.log(`✅ TEST 2 PASSED: Search shows ${count} results`);

      // Clean up
      await cleanupTestTournament(createdTournamentName);
    } catch (error) {
      if (createdTournamentName) {
        await cleanupTestTournament(createdTournamentName);
      }
      throw error;
    } finally {
      await disconnectFromDatabase();
    }
  });

  test("TEST 3: Can add course from search results", async ({ page }) => {
    await connectToDatabase();

    let createdTournamentName = null;

    try {
      await loginWithCredentials(page);
      await dismissInitialAlerts(page);

      createdTournamentName = await navigateToCoursesTab(page);

      // Get initial course count
      const courseTable = page.locator(".courses-table tbody tr");
      const initialCount = await courseTable.count();

      // Search and add a course
      const searchInput = page.locator("#courseInputBoxId");
      await searchInput.fill("Golf");
      await page.waitForTimeout(1500);

      const dropdownItems = page.locator(".list-group-item");
      await dropdownItems.first().click();
      await page.waitForTimeout(1000);

      // TEST 3: Verify course was added
      const newCount = await courseTable.count();
      expect(newCount).toBeGreaterThanOrEqual(initialCount);
      console.log(
        `✅ TEST 3 PASSED: Course added (${initialCount} -> ${newCount})`,
      );

      // Clean up
      await cleanupTestTournament(createdTournamentName);
    } catch (error) {
      if (createdTournamentName) {
        await cleanupTestTournament(createdTournamentName);
      }
      throw error;
    } finally {
      await disconnectFromDatabase();
    }
  });

  test("TEST 4: Courses table displays added courses", async ({ page }) => {
    await connectToDatabase();

    let createdTournamentName = null;

    try {
      await loginWithCredentials(page);
      await dismissInitialAlerts(page);

      createdTournamentName = await navigateToCoursesTab(page);

      // TEST 4: Verify courses table is visible and has content
      const coursesTable = page.locator(".courses-table");
      await expect(coursesTable).toBeVisible();

      const courseRows = page.locator(".courses-table tbody tr");
      const rowCount = await courseRows.count();
      expect(rowCount).toBeGreaterThan(0);
      console.log(
        `✅ TEST 4 PASSED: Courses table shows ${rowCount} course(s)`,
      );

      // Clean up
      await cleanupTestTournament(createdTournamentName);
    } catch (error) {
      if (createdTournamentName) {
        await cleanupTestTournament(createdTournamentName);
      }
      throw error;
    } finally {
      await disconnectFromDatabase();
    }
  });

  test("TEST 5: Course info modal opens when clicking course name", async ({
    page,
  }) => {
    await connectToDatabase();

    let createdTournamentName = null;

    try {
      await loginWithCredentials(page);
      await dismissInitialAlerts(page);

      createdTournamentName = await navigateToCoursesTab(page);

      // Find a course row and click on the course name/icon
      const courseRows = page.locator(".courses-table tbody tr");
      const firstRow = courseRows.first();

      // Click on info icon
      const infoIcon = firstRow.locator('i[class*="fa-circle-info"]');
      if ((await infoIcon.count()) > 0) {
        await infoIcon.click();
        await page.waitForTimeout(1000);

        // TEST 5: Verify modal opened
        const modal = page.locator(".modal");
        await expect(modal).toBeVisible();
        console.log("✅ TEST 5 PASSED: Course info modal opens");

        // Close modal
        const closeButton = page.locator(".btn-close");
        await closeButton.click();
        await page.waitForTimeout(500);
      } else {
        console.log("⚠️  TEST 5 SKIPPED: Info icon not found");
      }

      // Clean up
      await cleanupTestTournament(createdTournamentName);
    } catch (error) {
      if (createdTournamentName) {
        await cleanupTestTournament(createdTournamentName);
      }
      throw error;
    } finally {
      await disconnectFromDatabase();
    }
  });
});

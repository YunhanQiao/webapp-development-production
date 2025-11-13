const { test, expect } = require("@playwright/test");

const LOGIN_EMAIL = "seal-osu@gmail.com";
const LOGIN_PASSWORD = "GoodLuck2025!";

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

  // Check success and wait for redirect
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

test.describe("Divisions tab", () => {
  test("should verify all UI elements exist in divisions tab", async ({
    page,
  }) => {
    await loginWithCredentials(page);
    await dismissInitialAlerts(page);

    await page.goto(
      "http://localhost:3000/competitions/newTournament/divisions",
      {
        waitUntil: "domcontentloaded",
      },
    );
    await page.waitForTimeout(500);

    await test.step("Verify divisions table structure exists", async () => {
      const divisionsTable = page.locator("table").filter({
        has: page.locator("th", { hasText: "Division Name" }),
      });
      await expect(divisionsTable).toBeVisible();

      const headers = divisionsTable.locator("thead th");
      await expect(headers.nth(0)).toHaveText("Division Name");
      await expect(headers.nth(1)).toHaveText("Fee");
      await expect(headers.nth(2)).toHaveText("Gender");
      await expect(headers.nth(3)).toHaveText("Min. Age");
      await expect(headers.nth(4)).toHaveText("Max. Age");
      await expect(headers.nth(5)).toHaveText("Rounds & Courses");
      await expect(headers.nth(6)).toHaveText("Actions");

      const tableBody = divisionsTable.locator("tbody");
      await expect(tableBody).toBeAttached();

      console.log(
        "✅ Test 1 - Verify divisions table structure exists - PASSED",
      );
    });

    await test.step("Verify table shows 'No Data' when empty", async () => {
      const divisionsTable = page.locator("table").filter({
        has: page.locator("th", { hasText: "Division Name" }),
      });

      const tableBody = divisionsTable.locator("tbody");
      const noDataCell = tableBody.locator("td", { hasText: /no data/i });

      await expect(noDataCell).toBeVisible();
      await expect(noDataCell).toHaveAttribute("colspan", "7");

      console.log(
        "✅ Test 2 - Verify table shows 'No Data' when empty - PASSED",
      );
    });

    await test.step("Verify 'Add Division to Tournament' button exists", async () => {
      const addDivisionButton = page.getByRole("button", {
        name: /add division to tournament/i,
      });

      await expect(addDivisionButton).toBeVisible();
      await expect(addDivisionButton).toBeEnabled();

      console.log(
        "✅ Test 3 - Verify 'Add Division to Tournament' button exists - PASSED",
      );
    });

    await test.step("Verify clicking 'Add Division to Tournament' opens modal", async () => {
      const addDivisionButton = page.getByRole("button", {
        name: /add division to tournament/i,
      });

      await addDivisionButton.click();
      await page.waitForTimeout(300);

      const modal = page.locator(".modal-dialog").filter({
        hasText: /add division/i,
      });
      await expect(modal).toBeVisible();

      console.log(
        "✅ Test 4 - Verify clicking 'Add Division to Tournament' opens modal - PASSED",
      );
    });

    await test.step("Verify modal contains division form fields", async () => {
      const modal = page.locator(".modal-dialog").filter({
        hasText: /add division/i,
      });

      const modalHeader = modal.locator(".modal-header, .modal-title");
      await expect(modalHeader.first()).toBeVisible();

      const modalBody = modal.locator(".modal-body");
      await expect(modalBody).toBeVisible();

      console.log(
        "✅ Test 5 - Verify modal contains division form fields - PASSED",
      );
    });

    await test.step("Verify all required fields exist and are auto-filled with default values", async () => {
      const divisionNameField = page.locator("#name");
      await expect(divisionNameField).toBeVisible();
      await expect(divisionNameField).toHaveValue("Open");

      const entryFeeField = page.locator("#entryFee");
      await expect(entryFeeField).toBeVisible();
      await expect(entryFeeField).toHaveValue("200");

      const genderField = page.locator("#gender");
      await expect(genderField).toBeVisible();
      await expect(genderField).toHaveValue("Male");

      const minAgeField = page.locator("#minAge");
      await expect(minAgeField).toBeVisible();
      await expect(minAgeField).toHaveValue("18");

      const maxAgeField = page.locator("#maxAge");
      await expect(maxAgeField).toBeVisible();
      await expect(maxAgeField).toHaveValue("39");

      const roundsCountText = page
        .getByText(/rounds in division/i)
        .locator("..")
        .getByText("1");
      await expect(roundsCountText).toBeVisible();

      console.log(
        "✅ Test 6 - Verify all required fields exist and are auto-filled with default values - PASSED",
      );
    });

    await test.step("Verify modal can be closed", async () => {
      const addDivisionModal = page.locator(".modal-dialog").filter({
        hasText: /add division/i,
      });

      const closeButton = addDivisionModal
        .getByRole("button", {
          name: /close|cancel/i,
        })
        .first();

      await closeButton.click();
      await page.waitForTimeout(300);

      await expect(addDivisionModal).not.toBeVisible();

      console.log("✅ Test 7 - Verify modal can be closed - PASSED");
    });

    await test.step("Previous button returns to Courses tab", async () => {
      await page.getByRole("button", { name: "Previous" }).click();
      await expect(page.url()).toMatch(/courses\/?$/);
      console.log(
        "✅ Test 8 - Previous button returns to Courses tab - PASSED",
      );
    });

    await test.step("Cancel changes returns to competitions list", async () => {
      await page.getByRole("button", { name: "Cancel Changes & Exit" }).click();
      await expect(page.url()).toMatch(/competitions\/?$/);
      console.log(
        "✅ Test 9 - Cancel changes returns to competitions list - PASSED",
      );
    });
  });
});

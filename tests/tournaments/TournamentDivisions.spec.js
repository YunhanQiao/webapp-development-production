const { test, expect } = require("@playwright/test");

// Helper function to log in with credentials
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

  await page.getByLabel(/email/i).fill("seal-osu@gmail.com");
  await page.getByLabel(/password/i).fill("GoodLuck2025!");

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

// Helper function to dismiss any alert dialogs
async function dismissAlerts(page) {
  page.on("dialog", async (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    await dialog.dismiss();
  });
}

test.describe("Divisions tab", () => {
  test("should verify all UI elements exist in divisions tab", async ({
    page,
  }) => {
    // Set up alert dismissal
    dismissAlerts(page);

    await test.step("Login and navigate directly to Divisions tab", async () => {
      await loginWithCredentials(page);

      // Navigate directly to Divisions tab
      await page.goto(
        "http://localhost:3000/competitions/newTournament/divisions",
      );
      await page.waitForTimeout(500);

      console.log("✅ Login and navigation to Divisions tab - PASSED");
    });

    await test.step("Verify divisions table structure exists", async () => {
      // Find table by looking for the table with "Division Name" header
      const divisionsTable = page.locator("table").filter({
        has: page.locator("th", { hasText: "Division Name" }),
      });
      await expect(divisionsTable).toBeVisible();

      // Verify table headers
      const headers = divisionsTable.locator("thead th");
      await expect(headers.nth(0)).toHaveText("Division Name");
      await expect(headers.nth(1)).toHaveText("Fee");
      await expect(headers.nth(2)).toHaveText("Gender");
      await expect(headers.nth(3)).toHaveText("Min. Age");
      await expect(headers.nth(4)).toHaveText("Max. Age");
      await expect(headers.nth(5)).toHaveText("Rounds & Courses");
      await expect(headers.nth(6)).toHaveText("Actions");

      // Verify table body exists (attached to DOM)
      const tableBody = divisionsTable.locator("tbody");
      await expect(tableBody).toBeAttached();

      console.log("✅ Divisions table structure verified - PASSED");
    });

    await test.step("Verify table shows 'No Data' when empty", async () => {
      // Find table by looking for the table with "Division Name" header
      const divisionsTable = page.locator("table").filter({
        has: page.locator("th", { hasText: "Division Name" }),
      });

      // Check if table body shows "No Data"
      const tableBody = divisionsTable.locator("tbody");
      const noDataCell = tableBody.locator("td", { hasText: /no data/i });

      await expect(noDataCell).toBeVisible();

      // Verify it spans all columns (7 columns total)
      await expect(noDataCell).toHaveAttribute("colspan", "7");

      console.log("✅ Empty table shows 'No Data' message - PASSED");
    });

    await test.step("Verify 'Add Division to Tournament' button exists", async () => {
      const addDivisionButton = page.getByRole("button", {
        name: /add division to tournament/i,
      });

      await expect(addDivisionButton).toBeVisible();
      await expect(addDivisionButton).toBeEnabled();

      console.log("✅ Add Division button verified - PASSED");
    });

    await test.step("Verify clicking 'Add Division to Tournament' opens modal", async () => {
      const addDivisionButton = page.getByRole("button", {
        name: /add division to tournament/i,
      });

      await addDivisionButton.click();
      await page.waitForTimeout(300);

      // Verify modal is visible (look for modal with "Add Division" text)
      const modal = page.locator(".modal-dialog").filter({
        hasText: /add division/i,
      });
      await expect(modal).toBeVisible();

      console.log("✅ Add Division modal opens - PASSED");
    });

    await test.step("Verify modal contains division form fields", async () => {
      const modal = page.locator(".modal-dialog").filter({
        hasText: /add division/i,
      });

      // Check for modal title/header
      const modalHeader = modal.locator(".modal-header, .modal-title");
      await expect(modalHeader.first()).toBeVisible();

      // Check for modal body with form content
      const modalBody = modal.locator(".modal-body");
      await expect(modalBody).toBeVisible();

      console.log("✅ Division modal structure verified - PASSED");
    });

    await test.step("Verify all required fields exist and are auto-filled with default values", async () => {
      const modal = page.locator(".modal-dialog").filter({
        hasText: /add division/i,
      });

      // Verify Division Name field (default: "Open")
      const divisionNameField = modal.locator("#name");
      await expect(divisionNameField).toBeVisible();
      await expect(divisionNameField).toHaveValue("Open");

      // Verify Entry Fee field (default: "200")
      const entryFeeField = modal.locator("#entryFee");
      await expect(entryFeeField).toBeVisible();
      await expect(entryFeeField).toHaveValue("200");

      // Verify Gender dropdown (default: "Male")
      const genderField = modal.locator("#gender");
      await expect(genderField).toBeVisible();
      await expect(genderField).toHaveValue("Male");

      // Verify Min Age field (default: "18")
      const minAgeField = modal.locator("#minAge");
      await expect(minAgeField).toBeVisible();
      await expect(minAgeField).toHaveValue("18");

      // Verify Max Age field (default: "39")
      const maxAgeField = modal.locator("#maxAge");
      await expect(maxAgeField).toBeVisible();
      await expect(maxAgeField).toHaveValue("39");

      // Verify Rounds field shows "1" by default
      const roundsCountText = modal
        .getByText(/rounds in division/i)
        .locator("..")
        .getByText("1");
      await expect(roundsCountText).toBeVisible();

      console.log(
        "✅ All required fields verified with default values - PASSED",
      );
    });

    await test.step("Verify modal can be closed", async () => {
      // Look for close button in the Add Division modal
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

      // Verify Add Division modal is no longer visible
      await expect(addDivisionModal).not.toBeVisible();

      console.log("✅ Modal close functionality verified - PASSED");
    });

    console.log("✅ Completed Divisions tab UI elements verification test");
  });
});

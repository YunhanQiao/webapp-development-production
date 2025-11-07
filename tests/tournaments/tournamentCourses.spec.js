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

test.describe("Courses tab", () => {
  test("should verify all UI elements exist in courses tab", async ({
    page,
  }) => {
    // Set up alert dismissal
    dismissAlerts(page);

    await test.step("Login and navigate directly to Courses tab", async () => {
      await loginWithCredentials(page);

      // Navigate directly to Courses tab
      await page.goto(
        "http://localhost:3000/competitions/newTournament/courses",
      );
      await page.waitForTimeout(500);

      console.log("✅ Login and navigation to Courses tab - PASSED");
    });

    await test.step("Verify course search input field exists", async () => {
      const courseSearchLabel = page.getByText("Add a Course:");
      const courseSearchInput = page.locator("#courseInputBoxId");

      await expect(courseSearchLabel).toBeVisible();
      await expect(courseSearchInput).toBeVisible();
      await expect(courseSearchInput).toBeEnabled();
      await expect(courseSearchInput).toHaveAttribute(
        "placeholder",
        "Enter a course name",
      );

      console.log("✅ Course search input field verified - PASSED");
    });

    await test.step("Verify courses table structure exists", async () => {
      // Find table by looking for the table with "Course" and "Actions" headers
      const coursesTable = page
        .locator("table")
        .filter({ has: page.locator("th", { hasText: "Course" }) });
      await expect(coursesTable).toBeVisible();

      // Verify table headers
      const headers = coursesTable.locator("thead th");
      await expect(headers.nth(0)).toHaveText("Course");
      await expect(headers.nth(1)).toHaveText("Actions");

      // Verify table body exists (attached to DOM)
      const tableBody = coursesTable.locator("tbody");
      await expect(tableBody).toBeAttached();

      console.log("✅ Courses table structure verified - PASSED");
    });

    await test.step("Verify search dropdown appears with results when typing", async () => {
      const courseSearchInput = page.locator("#courseInputBoxId");

      // Type 'club' to trigger search
      await courseSearchInput.fill("club");
      await page.waitForTimeout(500); // Wait for search results

      // Verify autocomplete dropdown appears (look for list group with buttons)
      const searchResults = page.locator("button.list-group-item");
      const resultCount = await searchResults.count();

      expect(resultCount).toBeGreaterThan(0);
      console.log(`Found ${resultCount} courses containing 'club'`);

      console.log("✅ Search dropdown with results verified - PASSED");
    });

    await test.step("Verify selecting a course adds it to the table", async () => {
      // Click the first search result
      const firstResult = page.locator("button.list-group-item").first();
      const courseName = await firstResult.textContent();
      console.log(`Selecting course: ${courseName}`);

      await firstResult.click();
      await page.waitForTimeout(500);

      // Verify the course appears in the table (find table by its headers)
      const coursesTable = page
        .locator("table")
        .filter({ has: page.locator("th", { hasText: "Course" }) });
      const tableRows = coursesTable.locator("tbody tr");

      // Should now have at least one row
      await expect(tableRows.first()).toBeVisible();

      // Verify the course name appears in the table
      const firstRowText = await tableRows
        .first()
        .locator("td")
        .first()
        .textContent();
      expect(firstRowText).toContain(courseName.trim());

      console.log("✅ Course added to table successfully - PASSED");
    });

    await test.step("Verify course action icons exist after adding a course", async () => {
      // Find table by its headers
      const coursesTable = page
        .locator("table")
        .filter({ has: page.locator("th", { hasText: "Course" }) });
      const firstRow = coursesTable.locator("tbody tr").first();

      // Verify view icon exists
      const viewIcon = firstRow.locator("i.fa-eye");
      await expect(viewIcon).toBeVisible();

      // Verify delete icon exists
      const deleteIcon = firstRow.locator("i.fa-trash");
      await expect(deleteIcon).toBeVisible();

      console.log("✅ Course action icons verified - PASSED");
    });

    console.log("✅ Completed Courses tab UI elements verification test");
  });
});

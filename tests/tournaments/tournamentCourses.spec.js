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

test.describe("Courses tab", () => {
  test("should verify all UI elements exist in courses tab", async ({
    page,
  }) => {
    await loginWithCredentials(page);
    await dismissInitialAlerts(page);

    await page.goto(
      "http://localhost:3000/competitions/newTournament/courses",
      {
        waitUntil: "domcontentloaded",
      },
    );
    await page.waitForTimeout(500);

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

      console.log(
        "✅ Test 1 - Verify course search input field exists - PASSED",
      );
    });

    await test.step("Verify courses table structure exists", async () => {
      const coursesTable = page
        .locator("table")
        .filter({ has: page.locator("th", { hasText: "Course" }) });
      await expect(coursesTable).toBeVisible();

      const headers = coursesTable.locator("thead th");
      await expect(headers.nth(0)).toHaveText("Course");
      await expect(headers.nth(1)).toHaveText("Actions");

      const tableBody = coursesTable.locator("tbody");
      await expect(tableBody).toBeAttached();

      console.log("✅ Test 2 - Verify courses table structure exists - PASSED");
    });

    await test.step("Verify search dropdown appears with results when typing", async () => {
      const courseSearchInput = page.locator("#courseInputBoxId");

      await courseSearchInput.fill("club");
      await page.waitForTimeout(500);

      const searchResults = page.locator("button.list-group-item");
      const resultCount = await searchResults.count();

      expect(resultCount).toBeGreaterThan(0);
      console.log(`Found ${resultCount} courses containing 'club'`);

      console.log(
        "✅ Test 3 - Verify search dropdown appears with results when typing - PASSED",
      );
    });

    await test.step("Verify selecting a course adds it to the table", async () => {
      const firstResult = page.locator("button.list-group-item").first();
      const courseName = await firstResult.textContent();
      console.log(`Selecting course: ${courseName}`);

      await firstResult.click();
      await page.waitForTimeout(500);

      const coursesTable = page
        .locator("table")
        .filter({ has: page.locator("th", { hasText: "Course" }) });
      const tableRows = coursesTable.locator("tbody tr");

      await expect(tableRows.first()).toBeVisible();

      const firstRowText = await tableRows
        .first()
        .locator("td")
        .first()
        .textContent();
      expect(firstRowText).toContain(courseName.trim());

      console.log(
        "✅ Test 4 - Verify selecting a course adds it to the table - PASSED",
      );
    });

    await test.step("Verify course action icons exist after adding a course", async () => {
      const coursesTable = page
        .locator("table")
        .filter({ has: page.locator("th", { hasText: "Course" }) });
      const firstRow = coursesTable.locator("tbody tr").first();

      const viewIcon = firstRow.locator("i.fa-eye");
      await expect(viewIcon).toBeVisible();

      const deleteIcon = firstRow.locator("i.fa-trash");
      await expect(deleteIcon).toBeVisible();

      console.log(
        "✅ Test 5 - Verify course action icons exist after adding a course - PASSED",
      );
    });

    await test.step("Previous button returns to Color Theme tab", async () => {
      await page.getByRole("button", { name: "Previous" }).click();
      await expect(page.url()).toMatch(/colorTheme\/?$/);
      console.log(
        "✅ Test 6 - Previous button returns to Color Theme tab - PASSED",
      );
    });

    await test.step("Cancel changes returns to competitions list", async () => {
      await page.getByRole("button", { name: "Cancel Changes & Exit" }).click();
      await expect(page.url()).toMatch(/competitions\/?$/);
      console.log(
        "✅ Test 7 - Cancel changes returns to competitions list - PASSED",
      );
    });
  });
});

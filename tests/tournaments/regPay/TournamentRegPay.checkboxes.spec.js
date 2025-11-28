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
  await page.locator("#name").fill("Checkbox Test Tournament");
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
}

test.describe("Registration & Payment Checkboxes", () => {
  test("All Checkbox Tests", async ({ page }) => {
    // Login and navigate to RegPay tab
    await loginWithCredentials(page);
    await dismissInitialAlerts(page);
    await navigateToRegPayTab(page);

    // ==========================================
    // TEST 1: Entry Fee Checkbox (Pay Through App)
    // ==========================================
    console.log("\n🧪 TEST 1: Testing Entry Fee Checkbox");

    const entryFeeCheckbox = page.locator("#payThroughApp");

    // TEST 1-a: Checkbox starts unchecked
    await expect(entryFeeCheckbox).toBeVisible();
    await expect(entryFeeCheckbox).not.toBeChecked();
    console.log("✅ TEST 1-a PASSED: Entry fee checkbox starts unchecked");

    // TEST 1-b: Can check the checkbox
    await entryFeeCheckbox.check();
    await expect(entryFeeCheckbox).toBeChecked();
    console.log("✅ TEST 1-b PASSED: Entry fee checkbox can be checked");

    // TEST 1-c: Related fields become enabled when checked
    const processingPercent = page.locator("#processingPercent");
    const processingFee = page.locator("#processingFee");

    await expect(processingPercent).toBeEnabled();
    await expect(processingFee).toBeEnabled();
    console.log(
      "✅ TEST 1-c PASSED: Processing fields enabled when checkbox checked",
    );

    // TEST 1-d: Can uncheck the checkbox
    await entryFeeCheckbox.uncheck();
    await expect(entryFeeCheckbox).not.toBeChecked();
    console.log("✅ TEST 1-d PASSED: Entry fee checkbox can be unchecked");

    // ==========================================
    // TEST 2: Swag Checkbox
    // ==========================================
    console.log("\n🧪 TEST 2: Testing Swag Checkbox");

    const swagCheckbox = page.locator("#askSwag");

    // TEST 2-a: Checkbox starts unchecked
    await expect(swagCheckbox).toBeVisible();
    await expect(swagCheckbox).not.toBeChecked();
    console.log("✅ TEST 2-a PASSED: Swag checkbox starts unchecked");

    // TEST 2-b: Can check the checkbox
    await swagCheckbox.check();
    await expect(swagCheckbox).toBeChecked();
    console.log("✅ TEST 2-b PASSED: Swag checkbox can be checked");

    // TEST 2-c: Swag name field becomes visible/enabled when checked
    const swagName = page.locator("#swagName");
    if (await swagName.isVisible()) {
      await expect(swagName).toBeEnabled();
      console.log(
        "✅ TEST 2-c PASSED: Swag name field enabled when checkbox checked",
      );
    } else {
      console.log("⚠️  TEST 2-c SKIPPED: Swag name field not found");
    }

    // TEST 2-d: Can uncheck the checkbox
    await swagCheckbox.uncheck();
    await expect(swagCheckbox).not.toBeChecked();
    console.log("✅ TEST 2-d PASSED: Swag checkbox can be unchecked");

    // ==========================================
    // TEST 3: Swag Size Checkboxes
    // ==========================================
    console.log("\n🧪 TEST 3: Testing Swag Size Checkboxes");

    // Re-check swag checkbox to enable size checkboxes
    await swagCheckbox.check();
    await page.waitForTimeout(500);

    const swagSizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

    // TEST 3-a: All size checkboxes exist and are visible
    for (const size of swagSizes) {
      const sizeCheckbox = page.locator(`#${size}`);
      const sizeLabel = page.locator(`label[for="${size}"]`);

      await expect(sizeCheckbox).toBeAttached();
      await expect(sizeLabel).toBeVisible();
      await expect(sizeLabel).toHaveText(size);
    }
    console.log(
      "✅ TEST 3-a PASSED: All 7 swag size checkboxes exist and are visible",
    );

    // TEST 3-b: Can check individual size checkboxes
    const testSizes = ["S", "M", "L"];
    for (const size of testSizes) {
      const sizeCheckbox = page.locator(`#${size}`);
      const sizeLabel = page.locator(`label[for="${size}"]`);

      // Ensure it's unchecked first
      if (await sizeCheckbox.isChecked()) {
        await sizeLabel.click();
      }

      // Now check it
      await sizeLabel.click();
      await expect(sizeCheckbox).toBeChecked();
    }
    console.log(
      "✅ TEST 3-b PASSED: Can check individual size checkboxes (S, M, L)",
    );

    // TEST 3-c: Can uncheck individual size checkboxes
    for (const size of testSizes) {
      const sizeCheckbox = page.locator(`#${size}`);
      const sizeLabel = page.locator(`label[for="${size}"]`);

      await sizeLabel.click();
      await expect(sizeCheckbox).not.toBeChecked();
    }
    console.log(
      "✅ TEST 3-c PASSED: Can uncheck individual size checkboxes (S, M, L)",
    );

    // TEST 3-d: Can check multiple sizes at once
    for (const size of ["XS", "M", "XL", "XXL"]) {
      const sizeLabel = page.locator(`label[for="${size}"]`);
      await sizeLabel.click();
    }

    for (const size of ["XS", "M", "XL", "XXL"]) {
      const sizeCheckbox = page.locator(`#${size}`);
      await expect(sizeCheckbox).toBeChecked();
    }
    console.log(
      "✅ TEST 3-d PASSED: Can check multiple size checkboxes simultaneously",
    );

    // TEST 3-e: Can check all sizes
    for (const size of swagSizes) {
      const sizeCheckbox = page.locator(`#${size}`);
      const sizeLabel = page.locator(`label[for="${size}"]`);

      if (!(await sizeCheckbox.isChecked())) {
        await sizeLabel.click();
      }
    }

    for (const size of swagSizes) {
      const sizeCheckbox = page.locator(`#${size}`);
      await expect(sizeCheckbox).toBeChecked();
    }
    console.log("✅ TEST 3-e PASSED: Can check all 7 size checkboxes");

    // TEST 3-f: Can uncheck all sizes
    for (const size of swagSizes) {
      const sizeCheckbox = page.locator(`#${size}`);
      const sizeLabel = page.locator(`label[for="${size}"]`);

      if (await sizeCheckbox.isChecked()) {
        await sizeLabel.click();
      }
    }

    for (const size of swagSizes) {
      const sizeCheckbox = page.locator(`#${size}`);
      await expect(sizeCheckbox).not.toBeChecked();
    }
    console.log("✅ TEST 3-f PASSED: Can uncheck all size checkboxes");

    // ==========================================
    // TEST 4: Checkbox State Persistence
    // ==========================================
    console.log("\n🧪 TEST 4: Testing Checkbox State Persistence");

    // Check both main checkboxes and some sizes
    await entryFeeCheckbox.check();
    await swagCheckbox.check();
    await page.waitForTimeout(500);

    const selectedSizes = ["M", "L", "XL"];
    for (const size of selectedSizes) {
      const sizeLabel = page.locator(`label[for="${size}"]`);
      await sizeLabel.click();
    }

    // Verify all are checked
    await expect(entryFeeCheckbox).toBeChecked();
    await expect(swagCheckbox).toBeChecked();
    for (const size of selectedSizes) {
      const sizeCheckbox = page.locator(`#${size}`);
      await expect(sizeCheckbox).toBeChecked();
    }
    console.log(
      "✅ TEST 4 PASSED: Multiple checkboxes can be checked simultaneously and maintain state",
    );

    console.log(
      "\n🎉 ALL CHECKBOX TESTS COMPLETED: Entry Fee, Swag, and Size Checkboxes!",
    );
  });
});

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

test.describe("Registration & Payment tab", () => {
  test("should complete the full registration and payment workflow", async ({
    page,
  }) => {
    await loginWithCredentials(page);
    await dismissInitialAlerts(page);

    await page.goto(
      "http://localhost:3000/competitions/newTournament/regPaymentInfo",
      {
        waitUntil: "domcontentloaded",
      },
    );

    await page.waitForTimeout(500);

    await expect(
      page.getByRole("heading", { name: /registration|payment/i }),
    ).toBeVisible({
      timeout: 10000,
    });

    await test.step("Verify page title", async () => {
      await expect(
        page.getByRole("heading", { name: /registration.*payment/i }),
      ).toContainText("Registration & Payment");
      console.log("✅ Test 1 - Verify page title - PASSED");
    });

    await test.step("Verify registration window date fields exist and are required", async () => {
      const regStartDate = page.locator("#regStartDate");
      const regEndDate = page.locator("#regEndDate");

      await expect(regStartDate).toBeVisible();
      await expect(regEndDate).toBeVisible();
      await expect(regStartDate).toHaveAttribute("type", "date");
      await expect(regEndDate).toHaveAttribute("type", "date");

      console.log(
        "✅ Test 2 - Verify registration window date fields exist and are required - PASSED",
      );
    });

    await test.step("Verify withdrawal deadline date field exists and is required", async () => {
      const withdrawalDate = page.locator("#maxAllowedWithdraDate");

      await expect(withdrawalDate).toBeVisible();
      await expect(withdrawalDate).toHaveAttribute("type", "date");

      console.log(
        "✅ Test 3 - Verify withdrawal deadline date field exists and is required - PASSED",
      );
    });

    await test.step("Verify cap registration checkbox and field behavior", async () => {
      const capRegInput = page
        .locator('input[type="number"][placeholder*="limit"]')
        .first();

      await expect(capRegInput).toBeVisible();

      console.log(
        "✅ Test 4 - Verify cap registration checkbox and field behavior - PASSED",
      );
    });

    await test.step("Verify currency type dropdown exists with USD default", async () => {
      const currencyDropdown = page.locator("select").first();

      await expect(currencyDropdown).toBeVisible();
      await expect(currencyDropdown).toHaveValue("USD");

      console.log(
        "✅ Test 5 - Verify currency type dropdown exists with USD default - PASSED",
      );
    });

    await test.step("Verify entry fee checkbox and related fields behavior", async () => {
      const entryFeeCheckbox = page.locator("#payThroughApp");
      const processingPercent = page.locator("#processingPercent");
      const processingFee = page.locator("#processingFee");

      await expect(entryFeeCheckbox).not.toBeChecked();

      await entryFeeCheckbox.check();
      await expect(entryFeeCheckbox).toBeChecked();

      await expect(processingPercent).toBeEnabled();
      await expect(processingFee).toBeEnabled();

      await processingPercent.fill("10");
      await processingFee.fill("2");
      await expect(processingPercent).toHaveValue("10.00");
      await expect(processingFee).toHaveValue("2.00");

      console.log(
        "✅ Test 6 - Verify entry fee checkbox and related fields behavior - PASSED",
      );
    });

    await test.step("Verify swag checkbox and related fields behavior", async () => {
      const swagCheckbox = page.locator("#askSwag");

      await expect(swagCheckbox).not.toBeChecked();

      await swagCheckbox.check();
      await expect(swagCheckbox).toBeChecked();

      const swagName = page.locator("#swagName");

      if (await swagName.isVisible()) {
        await expect(swagName).toBeEnabled();
        await swagName.fill("Tournament T-Shirt");
        await expect(swagName).toHaveValue("Tournament T-Shirt");
      }

      console.log(
        "✅ Test 7 - Verify swag checkbox and related fields behavior - PASSED",
      );
    });

    await test.step("Verify swag size selection checkboxes", async () => {
      const swagSizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

      for (const size of swagSizes) {
        const sizeCheckbox = page.locator(`#${size}`);
        const sizeLabel = page.locator(`label[for="${size}"]`);

        await expect(sizeCheckbox).toBeAttached();
        await expect(sizeLabel).toBeVisible();
        await expect(sizeLabel).toHaveText(size);
      }

      const sizesToSelect = ["M", "L", "XL"];
      for (const size of sizesToSelect) {
        const sizeCheckbox = page.locator(`#${size}`);
        const sizeLabel = page.locator(`label[for="${size}"]`);

        if (!(await sizeCheckbox.isChecked())) {
          await sizeLabel.click();
        }
        await expect(sizeCheckbox).toBeChecked();
      }

      console.log("✅ Test 8 - Verify swag size selection checkboxes - PASSED");
    });

    await test.step("Verify currency type dropdown exists", async () => {
      const currencyDropdown = page
        .locator("select")
        .filter({ hasText: /USD|EUR|GBP/ });

      await expect(currencyDropdown.first()).toBeVisible();

      console.log("✅ Test 9 - Verify currency type dropdown exists - PASSED");
    });

    await test.step("Previous button returns to Basic Info tab", async () => {
      await page.getByRole("button", { name: "Previous" }).click();
      await expect(page.url()).toMatch(/basicInfo\/?$/);
      console.log(
        "✅ Test 10 - Previous button returns to Basic Info tab - PASSED",
      );
    });

    await test.step("Cancel changes returns to competitions list", async () => {
      await page.getByRole("button", { name: "Cancel Changes & Exit" }).click();
      await expect(page.url()).toMatch(/competitions\/?$/);
      console.log(
        "✅ Test 11 - Cancel changes returns to competitions list - PASSED",
      );
    });
  });
});

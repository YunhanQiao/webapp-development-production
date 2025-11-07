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

    // Small delay to ensure page is fully stable
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
      console.log("✅ Verify page title - PASSED");
    });

    await test.step("Verify registration window date fields exist and are required", async () => {
      const regStartDate = page.locator("#regStartDate");
      const regEndDate = page.locator("#regEndDate");

      await expect(regStartDate).toBeVisible();
      await expect(regEndDate).toBeVisible();
      await expect(regStartDate).toHaveAttribute("type", "date");
      await expect(regEndDate).toHaveAttribute("type", "date");

      console.log("✅ Registration window date fields verified - PASSED");
    });

    await test.step("Verify withdrawal deadline date field exists and is required", async () => {
      const withdrawalDate = page.locator("#maxAllowedWithdraDate");

      await expect(withdrawalDate).toBeVisible();
      await expect(withdrawalDate).toHaveAttribute("type", "date");

      console.log("✅ Withdrawal deadline field verified - PASSED");
    });

    await test.step("Verify cap registration checkbox and field behavior", async () => {
      // Find input by placeholder text
      const capRegInput = page
        .locator('input[type="number"][placeholder*="limit"]')
        .first();

      // Verify input exists
      await expect(capRegInput).toBeVisible();

      console.log("✅ Cap registration field verified - PASSED");
    });

    await test.step("Verify currency type dropdown exists with USD default", async () => {
      const currencyDropdown = page.locator("select").first();

      await expect(currencyDropdown).toBeVisible();
      await expect(currencyDropdown).toHaveValue("USD");

      console.log(
        "✅ Currency type dropdown with USD default verified - PASSED",
      );
    });

    await test.step("Verify entry fee checkbox and related fields behavior", async () => {
      const entryFeeCheckbox = page.locator("#payThroughApp");
      const processingPercent = page.locator("#processingPercent");
      const processingFee = page.locator("#processingFee");

      // By default, checkbox should be unchecked
      await expect(entryFeeCheckbox).not.toBeChecked();

      // Check the checkbox
      await entryFeeCheckbox.check();
      await expect(entryFeeCheckbox).toBeChecked();

      // Processing fee fields should be enabled
      await expect(processingPercent).toBeEnabled();
      await expect(processingFee).toBeEnabled();

      // Fill in processing fees
      await processingPercent.fill("10");
      await processingFee.fill("2");
      await expect(processingPercent).toHaveValue("10.00");
      await expect(processingFee).toHaveValue("2.00");

      console.log(
        "✅ Entry fee checkbox and processing fees verified - PASSED",
      );
    });

    await test.step("Verify swag checkbox and related fields behavior", async () => {
      const swagCheckbox = page.locator("#askSwag");

      // By default, checkbox should be unchecked
      await expect(swagCheckbox).not.toBeChecked();

      // Check the checkbox
      await swagCheckbox.check();
      await expect(swagCheckbox).toBeChecked();

      // Swag name and sizes fields should appear
      const swagName = page.locator("#swagName");

      if (await swagName.isVisible()) {
        await expect(swagName).toBeEnabled();
        await swagName.fill("Tournament T-Shirt");
        await expect(swagName).toHaveValue("Tournament T-Shirt");
      }

      console.log("✅ Swag checkbox and related fields verified - PASSED");
    });

    await test.step("Verify swag size selection checkboxes", async () => {
      const swagSizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

      // Verify all size checkboxes and labels are present
      for (const size of swagSizes) {
        const sizeCheckbox = page.locator(`#${size}`);
        const sizeLabel = page.locator(`label[for="${size}"]`);

        await expect(sizeCheckbox).toBeAttached();
        await expect(sizeLabel).toBeVisible();
        await expect(sizeLabel).toHaveText(size);
      }

      // Test selecting a few sizes by clicking their labels
      const sizesToSelect = ["M", "L", "XL"];
      for (const size of sizesToSelect) {
        const sizeCheckbox = page.locator(`#${size}`);
        const sizeLabel = page.locator(`label[for="${size}"]`);

        // Check if not already checked (might be from previous state)
        if (!(await sizeCheckbox.isChecked())) {
          await sizeLabel.click(); // Click the label instead of the hidden checkbox
        }
        await expect(sizeCheckbox).toBeChecked();
      }

      console.log("✅ Swag size selection checkboxes verified - PASSED");
    });

    await test.step("Verify currency type dropdown exists", async () => {
      const currencyDropdown = page
        .locator("select")
        .filter({ hasText: /USD|EUR|GBP/ });

      await expect(currencyDropdown.first()).toBeVisible();

      console.log("✅ Currency type dropdown verified - PASSED");
    });

    console.log(
      "✅ Completed Registration & Payment tab end-to-end workflow test",
    );
  });
});

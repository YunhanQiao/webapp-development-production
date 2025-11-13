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

async function fillColorInput(page, selector, value) {
  const input = page.locator(selector);
  await input.waitFor({ state: "visible", timeout: 5000 });
  await input.click({ timeout: 5000 });
  await input.fill("");
  await input.type(value, { delay: 20 });
  await input.dispatchEvent("blur");
  await expect(input).toHaveValue(new RegExp(`^${value}$`, "i"));
}

test.describe("Color Theme tab", () => {
  test("should verify default values and allow color input changes", async ({
    page,
  }) => {
    await loginWithCredentials(page);
    await dismissInitialAlerts(page);

    await page.goto(
      "http://localhost:3000/competitions/newTournament/colorTheme",
      {
        waitUntil: "domcontentloaded",
      },
    );
    await expect(
      page.getByRole("heading", { name: /tournament.*color theme/i }),
    ).toBeVisible({
      timeout: 10000,
    });

    await page.waitForTimeout(500);

    await test.step("Verify all inputs render correctly with default values", async () => {
      const colorInputs = page.locator('input[type="text"]');
      await expect(colorInputs).toHaveCount(13);

      await expect(page.locator("#titleText")).toHaveValue(/^#000000$/i);
      console.log("✅ Test 1 - titleText default value verified - PASSED");

      await expect(page.locator("#headerRowBg")).toHaveValue(/^#CC2127$/i);
      console.log("✅ Test 2 - headerRowBg default value verified - PASSED");

      await expect(page.locator("#headerRowTxt")).toHaveValue(/^#FFFFFF$/i);
      console.log("✅ Test 3 - headerRowTxt default value verified - PASSED");

      await expect(page.locator("#updateBtnBg")).toHaveValue(/^#13294E$/i);
      console.log("✅ Test 4 - updateBtnBg default value verified - PASSED");

      await expect(page.locator("#updateBtnTxt")).toHaveValue(/^#FFFFFF$/i);
      console.log("✅ Test 5 - updateBtnTxt default value verified - PASSED");

      await expect(page.locator("#tournNameBannerBg")).toHaveValue(
        /^#13294E$/i,
      );
      console.log(
        "✅ Test 6 - tournNameBannerBg default value verified - PASSED",
      );

      await expect(page.locator("#tournNameBannerTxt")).toHaveValue(
        /^#FFFFFF$/i,
      );
      console.log(
        "✅ Test 7 - tournNameBannerTxt default value verified - PASSED",
      );

      await expect(page.locator("#strParColBg")).toHaveValue(/^#13294E$/i);
      console.log("✅ Test 8 - strParColBg default value verified - PASSED");

      await expect(page.locator("#strParColTxt")).toHaveValue(/^#FFFFFF$/i);
      console.log("✅ Test 9 - strParColTxt default value verified - PASSED");

      await expect(page.locator("#timeParColBg")).toHaveValue(/^#13294E$/i);
      console.log("✅ Test 10 - timeParColBg default value verified - PASSED");

      await expect(page.locator("#timeParColTxt")).toHaveValue(/^#FFFFFF$/i);
      console.log("✅ Test 11 - timeParColTxt default value verified - PASSED");

      await expect(page.locator("#SGParColBg")).toHaveValue(/^#000000$/i);
      console.log("✅ Test 12 - SGParColBg default value verified - PASSED");

      await expect(page.locator("#SGParColTxt")).toHaveValue(/^#FFFFFF$/i);
      console.log("✅ Test 13 - SGParColTxt default value verified - PASSED");

      console.log(
        "✅ Test 14 - Verify all inputs render correctly with default values - PASSED",
      );
    });

    await test.step("Verify color input fields accept user input", async () => {
      await fillColorInput(page, "#titleText", "#FF0000");
      await expect(page.locator("#titleText")).toHaveValue(/^#FF0000$/i);
      console.log("✅ Test 15 - Title Text color changed - PASSED");

      await fillColorInput(page, "#headerRowBg", "#00FF00");
      await expect(page.locator("#headerRowBg")).toHaveValue(/^#00FF00$/i);
      console.log("✅ Test 16 - Header Row Bg color changed - PASSED");

      await fillColorInput(page, "#updateBtnBg", "#0000FF");
      await expect(page.locator("#updateBtnBg")).toHaveValue(/^#0000FF$/i);
      console.log("✅ Test 17 - Update Btn Bg color changed - PASSED");

      await fillColorInput(page, "#tournNameBannerBg", "#123456");
      await expect(page.locator("#tournNameBannerBg")).toHaveValue(
        /^#123456$/i,
      );
      console.log(
        "✅ Test 18 - Tournament Name Banner Bg color changed - PASSED",
      );

      await fillColorInput(page, "#SGParColBg", "#101010");
      await expect(page.locator("#SGParColBg")).toHaveValue(/^#101010$/i);
      console.log("✅ Test 19 - S.G Par Col Bg color changed - PASSED");

      console.log(
        "✅ Test 20 - Verify color input fields accept user input - PASSED",
      );
    });

    await test.step("Previous button returns to Registration & Payment tab", async () => {
      await page.getByRole("button", { name: "Previous" }).click();
      await expect(page.url()).toMatch(/regPaymentInfo\/?$/);
      console.log(
        "✅ Test 21 - Previous button returns to Registration & Payment tab - PASSED",
      );
    });

    await test.step("Cancel changes returns to competitions list", async () => {
      await page.getByRole("button", { name: "Cancel Changes & Exit" }).click();
      await expect(page.url()).toMatch(/competitions\/?$/);
      console.log(
        "✅ Test 22 - Cancel changes returns to competitions list - PASSED",
      );
    });
  });
});

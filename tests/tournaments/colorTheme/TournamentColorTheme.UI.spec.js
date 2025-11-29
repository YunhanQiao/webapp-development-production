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

async function navigateToColorThemeTab(page) {
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

  // Fill Basic Info tab (required)
  const basicInfoTab = page.getByRole("tab", { name: "Basic Info" });
  await basicInfoTab.waitFor({ state: "visible" });
  await basicInfoTab.click();

  await expect(page.locator("#tournamentFormHeader")).toBeVisible({
    timeout: 10000,
  });

  await page.locator("#name").fill("Color Input Test Tournament");
  await page.locator("#startDate").fill("2026-06-01");
  await page.locator("#endDate").fill("2026-06-05");

  // Click Save & Next to go to RegPay tab
  const saveNextButton1 = page.getByRole("button", { name: "Save & Next" });
  await saveNextButton1.click();
  await page.waitForTimeout(2000);

  // Should now be on Registration & Payment tab, click Save & Next again
  const regPayTab = page.getByRole("tab", {
    name: "Registration & Payment",
  });
  await regPayTab.waitFor({ state: "visible" });

  const saveNextButton2 = page.getByRole("button", { name: "Save & Next" });
  await saveNextButton2.click();
  await page.waitForTimeout(2000);

  // Should now be on Color Theme tab
  const colorThemeTab = page.getByRole("tab", {
    name: /Color.*Theme/i,
  });
  await colorThemeTab.waitFor({ state: "visible" });
}

async function fillColorInput(page, selector, value) {
  const input = page.locator(selector);
  await input.waitFor({ state: "visible", timeout: 5000 });
  await input.click({ timeout: 5000 });
  await input.fill("");
  await input.type(value, { delay: 20 });
  await input.dispatchEvent("blur");
  await page.waitForTimeout(200);
}

test.describe("Color Theme Color Inputs", () => {
  test("All Color Input Tests", async ({ page }) => {
    // Login and navigate to Color Theme tab
    await loginWithCredentials(page);
    await dismissInitialAlerts(page);
    await navigateToColorThemeTab(page);

    // ==========================================
    // TEST 1: Title Text - Default value and color change
    // ==========================================
    console.log("\n🧪 TEST 1: Testing Title Text");

    // TEST 1-a: Verify default value
    await expect(page.locator("#titleText")).toHaveValue(/^#000000$/i);
    console.log("✅ TEST 1-a PASSED: Title Text default value is #000000");

    // TEST 1-b: Change color
    await fillColorInput(page, "#titleText", "#FF0000");
    await expect(page.locator("#titleText")).toHaveValue(/^#FF0000$/i);
    console.log("✅ TEST 1-b PASSED: Title Text color changed to #FF0000");

    // ==========================================
    // TEST 2: Header Row Bg - Default value and color change
    // ==========================================
    console.log("\n🧪 TEST 2: Testing Header Row Bg");

    // TEST 2-a: Verify default value
    await expect(page.locator("#headerRowBg")).toHaveValue(/^#CC2127$/i);
    console.log("✅ TEST 2-a PASSED: Header Row Bg default value is #CC2127");

    // TEST 2-b: Change color
    await fillColorInput(page, "#headerRowBg", "#00FF00");
    await expect(page.locator("#headerRowBg")).toHaveValue(/^#00FF00$/i);
    console.log("✅ TEST 2-b PASSED: Header Row Bg color changed to #00FF00");

    // ==========================================
    // TEST 3: Header Row Txt - Default value and color change
    // ==========================================
    console.log("\n🧪 TEST 3: Testing Header Row Txt");

    // TEST 3-a: Verify default value
    await expect(page.locator("#headerRowTxt")).toHaveValue(/^#FFFFFF$/i);
    console.log("✅ TEST 3-a PASSED: Header Row Txt default value is #FFFFFF");

    // TEST 3-b: Change color
    await fillColorInput(page, "#headerRowTxt", "#0000FF");
    await expect(page.locator("#headerRowTxt")).toHaveValue(/^#0000FF$/i);
    console.log("✅ TEST 3-b PASSED: Header Row Txt color changed to #0000FF");

    // ==========================================
    // TEST 4: Update Btn Bg - Default value and color change
    // ==========================================
    console.log("\n🧪 TEST 4: Testing Update Btn Bg");

    // TEST 4-a: Verify default value
    await expect(page.locator("#updateBtnBg")).toHaveValue(/^#13294E$/i);
    console.log("✅ TEST 4-a PASSED: Update Btn Bg default value is #13294E");

    // TEST 4-b: Change color
    await fillColorInput(page, "#updateBtnBg", "#FFFF00");
    await expect(page.locator("#updateBtnBg")).toHaveValue(/^#FFFF00$/i);
    console.log("✅ TEST 4-b PASSED: Update Btn Bg color changed to #FFFF00");

    // ==========================================
    // TEST 5: Update Btn Txt - Default value and color change
    // ==========================================
    console.log("\n🧪 TEST 5: Testing Update Btn Txt");

    // TEST 5-a: Verify default value
    await expect(page.locator("#updateBtnTxt")).toHaveValue(/^#FFFFFF$/i);
    console.log("✅ TEST 5-a PASSED: Update Btn Txt default value is #FFFFFF");

    // TEST 5-b: Change color
    await fillColorInput(page, "#updateBtnTxt", "#FF00FF");
    await expect(page.locator("#updateBtnTxt")).toHaveValue(/^#FF00FF$/i);
    console.log("✅ TEST 5-b PASSED: Update Btn Txt color changed to #FF00FF");

    // ==========================================
    // TEST 6: Tournament Name Banner Bg - Default value and color change
    // ==========================================
    console.log("\n🧪 TEST 6: Testing Tournament Name Banner Bg");

    // TEST 6-a: Verify default value
    await expect(page.locator("#tournNameBannerBg")).toHaveValue(/^#13294E$/i);
    console.log(
      "✅ TEST 6-a PASSED: Tournament Name Banner Bg default value is #13294E",
    );

    // TEST 6-b: Change color
    await fillColorInput(page, "#tournNameBannerBg", "#123456");
    await expect(page.locator("#tournNameBannerBg")).toHaveValue(/^#123456$/i);
    console.log(
      "✅ TEST 6-b PASSED: Tournament Name Banner Bg color changed to #123456",
    );

    // ==========================================
    // TEST 7: Tournament Name Banner Txt - Default value and color change
    // ==========================================
    console.log("\n🧪 TEST 7: Testing Tournament Name Banner Txt");

    // TEST 7-a: Verify default value
    await expect(page.locator("#tournNameBannerTxt")).toHaveValue(/^#FFFFFF$/i);
    console.log(
      "✅ TEST 7-a PASSED: Tournament Name Banner Txt default value is #FFFFFF",
    );

    // TEST 7-b: Change color
    await fillColorInput(page, "#tournNameBannerTxt", "#ABCDEF");
    await expect(page.locator("#tournNameBannerTxt")).toHaveValue(/^#ABCDEF$/i);
    console.log(
      "✅ TEST 7-b PASSED: Tournament Name Banner Txt color changed to #ABCDEF",
    );

    // ==========================================
    // TEST 8: Strokes Par Col Bg - Default value and color change
    // ==========================================
    console.log("\n🧪 TEST 8: Testing Strokes Par Col Bg");

    // TEST 8-a: Verify default value
    await expect(page.locator("#strParColBg")).toHaveValue(/^#13294E$/i);
    console.log(
      "✅ TEST 8-a PASSED: Strokes Par Col Bg default value is #13294E",
    );

    // TEST 8-b: Change color
    await fillColorInput(page, "#strParColBg", "#111111");
    await expect(page.locator("#strParColBg")).toHaveValue(/^#111111$/i);
    console.log(
      "✅ TEST 8-b PASSED: Strokes Par Col Bg color changed to #111111",
    );

    // ==========================================
    // TEST 9: Strokes Par Col Txt - Default value and color change
    // ==========================================
    console.log("\n🧪 TEST 9: Testing Strokes Par Col Txt");

    // TEST 9-a: Verify default value
    await expect(page.locator("#strParColTxt")).toHaveValue(/^#FFFFFF$/i);
    console.log(
      "✅ TEST 9-a PASSED: Strokes Par Col Txt default value is #FFFFFF",
    );

    // TEST 9-b: Change color
    await fillColorInput(page, "#strParColTxt", "#222222");
    await expect(page.locator("#strParColTxt")).toHaveValue(/^#222222$/i);
    console.log(
      "✅ TEST 9-b PASSED: Strokes Par Col Txt color changed to #222222",
    );

    // ==========================================
    // TEST 10: Time Par Col Bg - Default value and color change
    // ==========================================
    console.log("\n🧪 TEST 10: Testing Time Par Col Bg");

    // TEST 10-a: Verify default value
    await expect(page.locator("#timeParColBg")).toHaveValue(/^#13294E$/i);
    console.log(
      "✅ TEST 10-a PASSED: Time Par Col Bg default value is #13294E",
    );

    // TEST 10-b: Change color
    await fillColorInput(page, "#timeParColBg", "#333333");
    await expect(page.locator("#timeParColBg")).toHaveValue(/^#333333$/i);
    console.log(
      "✅ TEST 10-b PASSED: Time Par Col Bg color changed to #333333",
    );

    // ==========================================
    // TEST 11: Time Par Col Txt - Default value and color change
    // ==========================================
    console.log("\n🧪 TEST 11: Testing Time Par Col Txt");

    // TEST 11-a: Verify default value
    await expect(page.locator("#timeParColTxt")).toHaveValue(/^#FFFFFF$/i);
    console.log(
      "✅ TEST 11-a PASSED: Time Par Col Txt default value is #FFFFFF",
    );

    // TEST 11-b: Change color
    await fillColorInput(page, "#timeParColTxt", "#444444");
    await expect(page.locator("#timeParColTxt")).toHaveValue(/^#444444$/i);
    console.log(
      "✅ TEST 11-b PASSED: Time Par Col Txt color changed to #444444",
    );

    // ==========================================
    // TEST 12: Speed Golf Par Col Bg - Default value and color change
    // ==========================================
    console.log("\n🧪 TEST 12: Testing Speed Golf Par Col Bg");

    // TEST 12-a: Verify default value
    await expect(page.locator("#SGParColBg")).toHaveValue(/^#000000$/i);
    console.log(
      "✅ TEST 12-a PASSED: Speed Golf Par Col Bg default value is #000000",
    );

    // TEST 12-b: Change color
    await fillColorInput(page, "#SGParColBg", "#101010");
    await expect(page.locator("#SGParColBg")).toHaveValue(/^#101010$/i);
    console.log(
      "✅ TEST 12-b PASSED: Speed Golf Par Col Bg color changed to #101010",
    );

    // ==========================================
    // TEST 13: Speed Golf Par Col Txt - Default value and color change
    // ==========================================
    console.log("\n🧪 TEST 13: Testing Speed Golf Par Col Txt");

    // TEST 13-a: Verify default value
    await expect(page.locator("#SGParColTxt")).toHaveValue(/^#FFFFFF$/i);
    console.log(
      "✅ TEST 13-a PASSED: Speed Golf Par Col Txt default value is #FFFFFF",
    );

    // TEST 13-b: Change color
    await fillColorInput(page, "#SGParColTxt", "#202020");
    await expect(page.locator("#SGParColTxt")).toHaveValue(/^#202020$/i);
    console.log(
      "✅ TEST 13-b PASSED: Speed Golf Par Col Txt color changed to #202020",
    );

    console.log(
      "\n🎉 ALL COLOR INPUT TESTS COMPLETED: Default values verified and color changing works for all 13 fields!",
    );
  });
});

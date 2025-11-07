import { test, expect } from "@playwright/test";

// Reuse login credentials
const LOGIN_EMAIL = "seal-osu@gmail.com";
const LOGIN_PASSWORD = "GoodLuck2025!";

/**
 * Logs the user in.
 * This function now assumes the page is *already* on the login page.
 */
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
    console.log("✅ Login successful");
  } else {
    throw new Error("Login failed");
  }
}

/**
 * Robustly dismisses all visible alerts that have a close button.
 * Uses a loop to handle alerts disappearing from the DOM.
 */
async function dismissInitialAlerts(page) {
  const alerts = page.locator(".alert");

  // Loop 5 times max, just as a safeguard against infinite loops
  for (let i = 0; i < 5; i++) {
    const firstAlert = alerts.first();
    try {
      // Wait for an alert to be visible, with a short timeout.
      // If this fails, no more alerts are visible, and we can break.
      await firstAlert.waitFor({ state: "visible", timeout: 1000 });
    } catch (e) {
      // No alert found, we're done.
      break;
    }

    const closeButton = firstAlert.locator(
      '.btn-close, button[data-bs-dismiss="alert"]',
    );
    try {
      if (await closeButton.isVisible()) {
        await closeButton.click();
        // Wait for this specific alert to be gone
        await expect(firstAlert).toBeHidden({ timeout: 3000 });
      } else {
        // Visible alert with no close button, break to avoid looping
        break;
      }
    } catch (e) {
      // The alert might have disappeared while we were working.
      // Log it and continue the loop.
      console.log("Alert disappeared before it could be closed, continuing.");
    }
  }
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

test.describe("TournamentColorTheme Component Tests", () => {
  test("should verify default values and allow color input changes", async ({
    page,
  }) => {
    // Login and navigate
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

    // Small delay to ensure page is fully stable
    await page.waitForTimeout(500);

    // Step 1: Verify all inputs render correctly with default values
    await test.step("Verify all inputs render correctly with default values", async () => {
      const colorInputs = page.locator('input[type="text"]');
      await expect(colorInputs).toHaveCount(13);

      // Verify required defaults per specification
      await expect(page.locator("#titleText")).toHaveValue(/^#000000$/i);
      await expect(page.locator("#headerRowBg")).toHaveValue(/^#CC2127$/i);
      await expect(page.locator("#headerRowTxt")).toHaveValue(/^#FFFFFF$/i);
      await expect(page.locator("#updateBtnBg")).toHaveValue(/^#13294E$/i);
      await expect(page.locator("#updateBtnTxt")).toHaveValue(/^#FFFFFF$/i);
      await expect(page.locator("#tournNameBannerBg")).toHaveValue(
        /^#13294E$/i,
      );
      await expect(page.locator("#tournNameBannerTxt")).toHaveValue(
        /^#FFFFFF$/i,
      );
      await expect(page.locator("#strParColBg")).toHaveValue(/^#13294E$/i);
      await expect(page.locator("#strParColTxt")).toHaveValue(/^#FFFFFF$/i);
      await expect(page.locator("#timeParColBg")).toHaveValue(/^#13294E$/i);
      await expect(page.locator("#timeParColTxt")).toHaveValue(/^#FFFFFF$/i);
      await expect(page.locator("#SGParColBg")).toHaveValue(/^#000000$/i);
      await expect(page.locator("#SGParColTxt")).toHaveValue(/^#FFFFFF$/i);

      console.log(
        "✅ All inputs render correctly with default values - PASSED",
      );
    });

    // Step 2: Test color input changes
    await test.step("Allow color input changes and reflect those changes in state", async () => {
      await fillColorInput(page, "#titleText", "#FF0000");
      await expect(page.locator("#titleText")).toHaveValue(/^#FF0000$/i);
      console.log("✅ Title Text color changed");

      await fillColorInput(page, "#headerRowBg", "#00FF00");
      await expect(page.locator("#headerRowBg")).toHaveValue(/^#00FF00$/i);
      console.log("✅ Header Row Bg color changed");

      await fillColorInput(page, "#updateBtnBg", "#0000FF");
      await expect(page.locator("#updateBtnBg")).toHaveValue(/^#0000FF$/i);
      console.log("✅ Update Btn Bg color changed");

      await fillColorInput(page, "#tournNameBannerBg", "#123456");
      await expect(page.locator("#tournNameBannerBg")).toHaveValue(
        /^#123456$/i,
      );
      console.log("✅ Tournament Name Banner Bg color changed");

      await fillColorInput(page, "#SGParColBg", "#101010");
      await expect(page.locator("#SGParColBg")).toHaveValue(/^#101010$/i);
      console.log("✅ S.G Par Col Bg color changed");

      console.log("✅ All color input changes reflected in state - PASSED");
    });

    console.log("✅ Completed TournamentColorTheme component workflow test");
  });
});

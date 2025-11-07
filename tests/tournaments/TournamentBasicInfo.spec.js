const { test, expect } = require("@playwright/test");

const LOGIN_EMAIL = "seal-osu@gmail.com";
const LOGIN_PASSWORD = "GoodLuck2025!";

const TEST_PDF_PATH = "tests/tournaments/Test.pdf";
const TEST_LOGO_PATH = "tests/tournaments/test-image.png";

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

async function getCurrentUserProfile(page) {
  return await page.evaluate(() => {
    const persistRoot = window.localStorage.getItem("persist:root");
    if (!persistRoot) {
      return null;
    }

    try {
      const parsedRoot = JSON.parse(persistRoot);
      if (!parsedRoot?.user) {
        return null;
      }

      const userState = JSON.parse(parsedRoot.user);
      return userState?.user || null;
    } catch (error) {
      console.warn("Unable to read persisted user state", error);
      return null;
    }
  });
}

async function getPersistedWizardBasicInfo(page) {
  return await page.evaluate(() => {
    const persistRoot = window.localStorage.getItem("persist:root");
    if (!persistRoot) {
      return null;
    }

    try {
      const parsedRoot = JSON.parse(persistRoot);
      if (!parsedRoot?.wizard) {
        return null;
      }

      const wizardState = JSON.parse(parsedRoot.wizard);
      return wizardState?.basicInfo || null;
    } catch (error) {
      console.warn("Unable to read persisted wizard state", error);
      return null;
    }
  });
}

test.describe("Basic Info tab", () => {
  test("should complete the full basic info workflow in one session", async ({
    page,
  }) => {
    await loginWithCredentials(page);
    await dismissInitialAlerts(page);

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

    const basicInfoTab = page.getByRole("tab", { name: "Basic Info" });
    await basicInfoTab.waitFor({ state: "visible" });
    await basicInfoTab.click();

    await expect(
      page.getByRole("heading", { name: /new tournament.*basic info/i }),
    ).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("button", { name: "Save & Exit" })).toBeVisible(
      { timeout: 10000 },
    );

    const nameField = page.locator("#name");
    await nameField.waitFor({ state: "visible", timeout: 10000 });
    await nameField.fill("Test Tournament");

    await test.step("Verify default header title", async () => {
      const header = page.getByRole("heading", {
        name: /tournament.*basic info/i,
      });
      await expect(header).toBeVisible({ timeout: 5000 });
      await expect(header).toContainText("New Tournament: Basic Info", {
        timeout: 5000,
      });
      console.log("✅ Verify default header title - PASSED");
    });

    await test.step("Verify host name is prefilled", async () => {
      const hostInput = page.locator("#tournamentCreatorName");
      await expect(hostInput).toBeVisible({ timeout: 5000 });
      await expect(hostInput).not.toBeEditable();

      const hostValue = (await hostInput.inputValue()).trim();
      expect(hostValue).not.toEqual("");

      const currentUser = await getCurrentUserProfile(page);

      if (currentUser) {
        const nameFromProfile = [
          currentUser?.personalInfo?.firstName || "",
          currentUser?.personalInfo?.lastName || "",
        ]
          .map((part) => part.trim())
          .filter(Boolean)
          .join(" ");

        const fallbackName =
          currentUser?.username ||
          currentUser?.displayName ||
          currentUser?.accountInfo?.username ||
          currentUser?.accountInfo?.email ||
          "";

        const expectedHost = (nameFromProfile || fallbackName).trim();
        expect(expectedHost).not.toEqual("");
        expect(hostValue).toEqual(expectedHost);
      }
      console.log("✅ Verify host name is prefilled - PASSED");
    });

    await test.step("Verify host email is prefilled", async () => {
      const emailInput = page.locator("#tournamentCreatorEmail");
      await expect(emailInput).toBeVisible({ timeout: 5000 });
      await expect(emailInput).not.toBeEditable();

      const emailValue = (await emailInput.inputValue()).trim();
      expect(emailValue).not.toEqual("");

      const currentUser = await getCurrentUserProfile(page);

      if (currentUser) {
        const expectedEmail =
          currentUser?.accountInfo?.email ||
          currentUser?.email ||
          currentUser?.username ||
          "";

        expect(expectedEmail).not.toEqual("");
        expect(emailValue.toLowerCase()).toEqual(expectedEmail.toLowerCase());
      } else {
        expect(emailValue.toLowerCase()).toEqual(LOGIN_EMAIL.toLowerCase());
      }
      console.log("✅ Verify host email is prefilled - PASSED");
    });

    await test.step("Enforce tournament date and tee time defaults", async () => {
      const startDateInput = page.locator("#startDate");
      const endDateInput = page.locator("#endDate");

      await expect(startDateInput).toHaveAttribute("type", "date");
      await expect(endDateInput).toHaveAttribute("type", "date");

      await startDateInput.fill("2024-04-03");
      await endDateInput.fill("2024-04-05");

      await expect(endDateInput).toHaveAttribute("min", "2024-04-03");

      const teeTimeInputs = page.locator('input[type="time"]');
      await expect(teeTimeInputs).toHaveCount(3, { timeout: 5000 });

      const expectedLabels = ["04/03/2024:", "04/04/2024:", "04/05/2024:"];

      for (let index = 0; index < expectedLabels.length; index++) {
        const teeTimeInput = teeTimeInputs.nth(index);
        await expect(teeTimeInput).toHaveAttribute("type", "time");
        await expect(teeTimeInput).toHaveValue("07:00");

        const teeTimeLabel = page
          .locator(`text="${expectedLabels[index]}"`)
          .first();
        await expect(teeTimeLabel).toBeVisible();
      }

      await endDateInput.fill("2024-04-02");
      await expect(endDateInput).toHaveValue("2024-04-03");

      await expect(teeTimeInputs).toHaveCount(1, { timeout: 5000 });
      await expect(teeTimeInputs.first()).toHaveValue("07:00");
      await expect(page.locator('text="04/03/2024:"').first()).toBeVisible();
      console.log("✅ Enforce tournament date and tee time defaults - PASSED");
    });

    await test.step("Upload tournament logo image", async () => {
      const logoInput = page.locator("#logo");
      await expect(logoInput).toHaveAttribute("accept", "image/*");

      await logoInput.setInputFiles(TEST_LOGO_PATH);

      const logoPreview = page.locator('img[alt="Tournament Logo preview"]');
      await expect(logoPreview).toBeVisible({ timeout: 5000 });
      await expect(logoPreview).toHaveAttribute("src", /blob:|data:image/);
      console.log("✅ Upload tournament logo image - PASSED");
    });

    await test.step("Upload tournament rules PDF", async () => {
      const pdfInputs = page.locator('input[type="file"][accept=".pdf"]');
      const rulesInput = pdfInputs.nth(0);

      await expect(rulesInput).toHaveAttribute("accept", ".pdf");

      await rulesInput.setInputFiles(TEST_PDF_PATH);

      const rulesNameField = page.locator(
        'input[placeholder="No document uploaded"]',
      );
      await expect(rulesNameField).toHaveValue("Test.pdf");
      await expect(
        page.getByRole("button", { name: "Upload Rules Doc..." }),
      ).toHaveCount(0);
      console.log("✅ Upload tournament rules PDF - PASSED");
    });

    await test.step("Allow entering prize descriptions", async () => {
      const prizeTextInput = page.locator("#prizeText");
      await prizeTextInput.fill("Winners receive custom medals");
      await expect(prizeTextInput).toHaveValue("Winners receive custom medals");

      await expect(
        page.getByRole("button", { name: "Upload Prizes Doc..." }),
      ).toBeVisible();

      await prizeTextInput.fill("");
      await expect(prizeTextInput).toHaveValue("");
      console.log("✅ Allow entering prize descriptions - PASSED");
    });

    await test.step("Upload prize PDF hides description field", async () => {
      // Click the upload button to trigger file chooser
      const uploadButton = page.getByRole("button", {
        name: "Upload Prizes Doc...",
      });
      await expect(uploadButton).toBeVisible();

      const [fileChooser] = await Promise.all([
        page.waitForEvent("filechooser"),
        uploadButton.click(),
      ]);

      await fileChooser.setFiles(TEST_PDF_PATH);

      // Wait for UI to update
      await page.waitForTimeout(1000);

      // Verify the prize doc name appears in a disabled input field (matching rules behavior)
      const prizeDocNameField = page
        .locator('input[value="Test.pdf"][disabled]')
        .first();
      await expect(prizeDocNameField).toBeVisible({ timeout: 5000 });

      // Verify upload button is no longer visible (matches rules test pattern)
      await expect(
        page.getByRole("button", { name: "Upload Prizes Doc..." }),
      ).toHaveCount(0);
      console.log("✅ Upload prize PDF hides description field - PASSED");
    });

    await test.step("Allow entering additional info text", async () => {
      const additionalInfoInput = page.locator("#additionalInfoText");
      await additionalInfoInput.fill("Shotgun start at 9am, lunch provided");
      await expect(additionalInfoInput).toHaveValue(
        "Shotgun start at 9am, lunch provided",
      );

      await expect(
        page.getByRole("button", { name: "Upload Additional Info Doc..." }),
      ).toBeVisible();

      await additionalInfoInput.fill("");
      await expect(additionalInfoInput).toHaveValue("");
      console.log("✅ Allow entering additional info text - PASSED");
    });

    await test.step("Upload additional info PDF hides text area", async () => {
      const uploadButton = page.getByRole("button", {
        name: "Upload Additional Info Doc...",
      });
      await expect(uploadButton).toBeVisible();

      const [fileChooser] = await Promise.all([
        page.waitForEvent("filechooser"),
        uploadButton.click(),
      ]);

      await fileChooser.setFiles(TEST_PDF_PATH);

      // Wait for UI to update
      await page.waitForTimeout(1000);

      // Verify the additional info doc name appears in a disabled input field
      const addlInfoDocNameField = page
        .locator('input[value="Test.pdf"][disabled]')
        .nth(1);
      await expect(addlInfoDocNameField).toBeVisible({ timeout: 5000 });

      // Verify upload button is no longer visible
      await expect(
        page.getByRole("button", { name: "Upload Additional Info Doc..." }),
      ).toHaveCount(0);
      console.log("✅ Upload additional info PDF hides text area - PASSED");
    });

    await test.step("Show single tee time for single-day tournament", async () => {
      await page.locator("#startDate").fill("2024-04-01");
      await page.locator("#endDate").fill("2024-04-01");

      const teeTimeInputs = page.locator('input[type="time"]');
      await expect(teeTimeInputs).toHaveCount(1, { timeout: 5000 });
      await expect(teeTimeInputs.first()).toBeVisible();
      await expect(teeTimeInputs.first()).toHaveAttribute("type", "time");
      await expect(teeTimeInputs.first()).toHaveValue("07:00");
      await expect(page.locator('text="04/01/2024:"').first()).toBeVisible();
      console.log("✅ Show single tee time for single-day tournament - PASSED");
    });

    await test.step("Show tee times for each tournament day", async () => {
      await page.locator("#startDate").fill("2024-04-01");
      await page.locator("#endDate").fill("2024-04-04");

      const teeTimeInputs = page.locator('input[type="time"]');
      await expect(teeTimeInputs).toHaveCount(4, { timeout: 5000 });

      const expectedLabels = [
        "04/01/2024:",
        "04/02/2024:",
        "04/03/2024:",
        "04/04/2024:",
      ];

      for (let index = 0; index < expectedLabels.length; index++) {
        await expect(teeTimeInputs.nth(index)).toHaveAttribute("type", "time");
        await expect(teeTimeInputs.nth(index)).toHaveValue("07:00");
        await expect(
          page.locator(`text="${expectedLabels[index]}"`).first(),
        ).toBeVisible();
      }
      console.log("✅ Show tee times for each tournament day - PASSED");
    });

    await test.step("Cancel changes returns to competitions list", async () => {
      await page.getByRole("button", { name: "Cancel Changes & Exit" }).click();
      await expect(page.url()).toMatch(/competitions\/?$/);
      console.log("✅ Cancel changes returns to competitions list - PASSED");
    });
  });
});

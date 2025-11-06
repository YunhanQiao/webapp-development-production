const { test, expect } = require("@playwright/test");

const LOGIN_EMAIL = "seal-osu@gmail.com";
const LOGIN_PASSWORD = "GoodLuck2025!";

const LOGO_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AApgB9p8KBygAAAAASUVORK5CYII=";
const SAMPLE_PDF_BASE64 =
  "JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHMgWzMgMCBSXS9Db3VudCAxPj4KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveCBbMCAwIDYxMiA3OTJdL1Jlc291cmNlcyA8PC9Gb250IDw8L0YxIDQgMCBSID4+ID4+L0NvbnRlbnRzIDUgMCBSPj4KZW5kb2JqCjQgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvTmFtZS9GMS9CYXNlRm9udC9UaW1lcy1Sb21hbi9FbmNvZGluZy9XaW5BbnNpRW5jb2Rpbmc+PgplbmRvYmoKNSAwIG9iago8PC9MZW5ndGggNDggPj5zdHJlYW0KBTQgMCBSIAVGMSAxMiBUZgoobWluaW1hbCBwZGYpIApFVAplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMTMgMDAwMDAgbiAKMDAwMDAwMDY0IDAwMDAwIG4gCjAwMDAwMDAxMSAwMDAwMCBuIAowMDAwMDAwMTkgMDAwMDAgbiAKdHJhaWxlcgo8PC9Sb290IDEgMCBSL1NpemUgNj4+CnN0YXJ0eHJlZgoxMTEKJSVFT0Y=";

async function loginWithCredentials(page) {
  await page.goto("http://localhost:3000/login", {
    waitUntil: "domcontentloaded",
  });
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.waitForLoadState("domcontentloaded");
  await page.waitForSelector("#loginForm", { timeout: 10000 });

  await page.fill("#email", LOGIN_EMAIL);
  await page.fill("#password", LOGIN_PASSWORD);

  const [response] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/auth/login") &&
        response.request().method() === "POST",
    ),
    page.click('button[type="submit"]'),
  ]);

  // Check success and wait for redirect
  if (response.status() === 200) {
    await page.waitForURL(/.*\/feed/, { timeout: 10000 });
    await page.waitForSelector("#tournamentsMode", { timeout: 10000 });
    console.log("✅ Login successful");
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

test.describe("Basic Info tab", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page);
    await dismissInitialAlerts(page);
    const tournamentsModeButton = page.locator("#tournamentsMode");
    await tournamentsModeButton.waitFor({ state: "visible" });
    await tournamentsModeButton.click();

    const newTournamentButton = page.locator("#tournamentModeActionBtn");
    await newTournamentButton.waitFor({ state: "visible" });
    await newTournamentButton.click();

    const basicInfoTab = page.getByRole("tab", { name: "Basic Info" });
    await basicInfoTab.waitFor({ state: "visible" });
    await basicInfoTab.click();

    await expect(page.locator("#tournamentFormHeader")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("button", { name: "Save & Exit" })).toBeVisible(
      { timeout: 10000 },
    );

    const nameField = page.locator("#name");
    await nameField.waitFor({ state: "visible", timeout: 10000 });
    await nameField.fill("Test Tournament");
  });

  test("It should have default title", async ({ page }) => {
    const header = page.locator("#tournamentFormHeader");
    await expect(header).toBeVisible({ timeout: 5000 });
    await expect(header).toContainText("New Tournament: Basic Info", {
      timeout: 5000,
    });
  });

  test("It should prefill tournament host with the logged in user", async ({
    page,
  }) => {
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
  });

  test("It should prefill host email with the logged in user's email", async ({
    page,
  }) => {
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
  });

  test("It should enforce tournament dates and tee time defaults", async ({
    page,
  }) => {
    const startDateInput = page.locator("#startDate");
    const endDateInput = page.locator("#endDate");

    await expect(startDateInput).toHaveAttribute("type", "date");
    await expect(endDateInput).toHaveAttribute("type", "date");

    await startDateInput.fill("2024-04-03");
    await endDateInput.fill("2024-04-05");

    await expect(endDateInput).toHaveAttribute("min", "2024-04-03");

    const teeTimeInputs = page.locator('[id^="teeTime-"]');
    await expect(teeTimeInputs).toHaveCount(3, { timeout: 5000 });

    const expectedLabels = ["04/03/2024:", "04/04/2024:", "04/05/2024:"];

    for (let index = 0; index < expectedLabels.length; index++) {
      const teeTimeInput = teeTimeInputs.nth(index);
      await expect(teeTimeInput).toHaveAttribute("type", "time");
      await expect(teeTimeInput).toHaveValue("07:00");

      const teeTimeLabel = page.locator(`label[for="teeTime-${index}"]`);
      await expect(teeTimeLabel).toHaveText(expectedLabels[index]);
    }

    // Attempt to set an end date before the start date; it should snap back to the start date value
    await endDateInput.fill("2024-04-02");
    await expect(endDateInput).toHaveValue("2024-04-03");

    await expect(teeTimeInputs).toHaveCount(1, { timeout: 5000 });
    await expect(teeTimeInputs.first()).toHaveValue("07:00");
    await expect(page.locator('label[for="teeTime-0"]')).toHaveText(
      "04/03/2024:",
    );
  });

  test("It should upload a tournament logo image", async ({ page }) => {
    const logoInput = page.locator("#logo");
    await expect(logoInput).toHaveAttribute("accept", "image/*");

    const logoBuffer = Buffer.from(LOGO_PNG_BASE64, "base64");
    await logoInput.setInputFiles({
      name: "tournament-logo.png",
      mimeType: "image/png",
      buffer: logoBuffer,
    });

    const logoPreview = page.locator(".logo-image");
    await expect(logoPreview).toBeVisible({ timeout: 5000 });
    await expect(logoPreview).toHaveAttribute("src", /data:image\/png;base64/);
  });

  test("It should upload a tournament rules PDF", async ({ page }) => {
    const pdfInputs = page.locator('input[type="file"][accept=".pdf"]');
    const rulesInput = pdfInputs.nth(0);

    await expect(rulesInput).toHaveAttribute("accept", ".pdf");

    const pdfBuffer = Buffer.from(SAMPLE_PDF_BASE64, "base64");
    await rulesInput.setInputFiles({
      name: "sample-rules.pdf",
      mimeType: "application/pdf",
      buffer: pdfBuffer,
    });

    const rulesNameField = page.locator(
      'input[placeholder="No document uploaded"]',
    );
    await expect(rulesNameField).toHaveValue("sample-rules.pdf");
    await expect(
      page.getByRole("button", { name: "Upload Rules Doc..." }),
    ).toHaveCount(0);
  });

  test("It should allow entering prize descriptions", async ({ page }) => {
    const prizeTextInput = page.locator("#prizeText");
    await prizeTextInput.fill("Winners receive custom medals");
    await expect(prizeTextInput).toHaveValue("Winners receive custom medals");

    await expect(
      page.getByRole("button", { name: "Upload Prizes Doc..." }),
    ).toBeVisible();
  });

  test("It should upload a prize PDF and hide the description input", async ({
    page,
  }) => {
    const pdfInputs = page.locator('input[type="file"][accept=".pdf"]');
    const prizeInput = pdfInputs.nth(1);

    const pdfBuffer = Buffer.from(SAMPLE_PDF_BASE64, "base64");
    await prizeInput.setInputFiles({
      name: "prize-details.pdf",
      mimeType: "application/pdf",
      buffer: pdfBuffer,
    });

    await expect(page.locator("#prizeText")).toHaveCount(0);
    const prizeSection = page.locator("div.mb-3", {
      has: page.locator("text=Prizes:"),
    });
    const prizeDocField = prizeSection.locator("input.form-control").first();
    await expect(prizeDocField).toHaveValue("prize-details.pdf");
    await expect(
      page.getByRole("button", { name: "Upload Prizes Doc..." }),
    ).toHaveCount(0);
  });

  test("It should allow entering additional info text", async ({ page }) => {
    const additionalInfoInput = page.locator("#additionalInfoText");
    await additionalInfoInput.fill("Shotgun start at 9am, lunch provided");
    await expect(additionalInfoInput).toHaveValue(
      "Shotgun start at 9am, lunch provided",
    );

    await expect(
      page.getByRole("button", { name: "Upload Additional Info Doc..." }),
    ).toBeVisible();
  });

  test("It should upload an additional info PDF and hide the text area", async ({
    page,
  }) => {
    const pdfInputs = page.locator('input[type="file"][accept=".pdf"]');
    const addlInfoInput = pdfInputs.nth(2);

    const pdfBuffer = Buffer.from(SAMPLE_PDF_BASE64, "base64");
    await addlInfoInput.setInputFiles({
      name: "additional-info.pdf",
      mimeType: "application/pdf",
      buffer: pdfBuffer,
    });

    await expect(page.locator("#additionalInfoText")).toHaveCount(0);
    const additionalInfoSection = page.locator("div.mb-3", {
      has: page.locator("text=Additional Info:"),
    });
    const additionalDocField = additionalInfoSection
      .locator("input.form-control")
      .first();
    await expect(additionalDocField).toHaveValue("additional-info.pdf");
    await expect(
      page.getByRole("button", { name: "Upload Additional Info Doc..." }),
    ).toHaveCount(0);
  });

  test("It should show one tee time for a single-day tournament", async ({
    page,
  }) => {
    await page.locator("#startDate").fill("2024-04-01");
    await page.locator("#endDate").fill("2024-04-01");

    const teeTimeInputs = page.locator('[id^="teeTime-"]');
    await expect(teeTimeInputs).toHaveCount(1, { timeout: 5000 });
    await expect(teeTimeInputs.first()).toBeVisible();
    await expect(teeTimeInputs.first()).toHaveAttribute("type", "time");
    await expect(teeTimeInputs.first()).toHaveValue("07:00");
    await expect(page.locator('label[for="teeTime-0"]')).toHaveText(
      "04/01/2024:",
    );
  });

  test("It should show tee times for each tournament day", async ({ page }) => {
    await page.locator("#startDate").fill("2024-04-01");
    await page.locator("#endDate").fill("2024-04-04");

    const teeTimeInputs = page.locator('[id^="teeTime-"]');
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
      await expect(page.locator(`label[for="teeTime-${index}"]`)).toHaveText(
        expectedLabels[index],
      );
    }
  });

  test("It should redirect to the '/competitions/' after clicking 'Cancel Changes & Exit'", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Cancel Changes & Exit" }).click();
    await expect(page.url()).toMatch(/competitions\/?$/);
  });
});

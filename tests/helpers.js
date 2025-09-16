import { expect } from "@playwright/test";

const defaultEmail = "test@gmail.com";
const defaultPassword = "Test@1234"

export async function login(page, email = defaultEmail, password = defaultPassword) {
  await expect(page.isVisible("#loginForm")).resolves.toBe(true);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click("#loginBtn");
  await expect(page.isVisible("#feedModeTab")).resolves.toBe(true);
}

export async function createAccount(page, email = defaultEmail, password = defaultPassword) {
    await page.goto("http://localhost:3000/login");
    await expect(page.isVisible("#loginForm")).resolves.toBe(true);
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page.isVisible("#createAccountForm")).resolves.toBe(true);
    await page.fill('#acctEmail', email);
    await page.fill('#acctPassword', password);
    await page.fill('#acctPasswordRepeat', password);
    await page.fill('#userFirstName', 'Create');
    await page.fill('#userLastName', 'Account Test');
    await page.fill('#dob', '2024-04-11');
    await page.selectOption('select#parPreference', 'mens');
    await page.fill("#city","Corvallis");
    await page.fill("#state","Oregon");
    await page.click('#submitCreateAccountBtn')
    await expect(page.getByText("New Account created with email", { exact: true })).toBeVisible();
    await page.getByLabel('close', { exact: true }).click();
}

export async function AddCourse(page, email = "testuser@gmail.com", password = "TestUser123") {
  await expect(page.isVisible("#loginPage")).resolves.toBe(true);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click("#loginBtn");
  await expect(page.isVisible("#feedModeTab")).resolves.toBe(true);
}

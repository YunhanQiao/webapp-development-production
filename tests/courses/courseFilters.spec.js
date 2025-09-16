// @ts-check
const { test, expect } = require('@playwright/test');
const { createAccount, login } = require('../helpers');

test('account create test', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  await createAccount(page);
  await login(page);
  await page.click('#coursesMode');
  await expect(page.isVisible("#coursesModeTab")).resolves.toBe(true);
  
  await page.click('#addCourse');

});

test('get started link', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  // Click the get started link.
  await page.getByRole('link', { name: 'Get started' }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});

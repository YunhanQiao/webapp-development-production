import { test, expect } from '@playwright/test';

test.describe('TournamentColorTheme Component Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/tournament-color-theme');
  });

  test('should ensure all inputs render correctly with default values', async ({ page }) => {
    const colorInputs = await page.$$('[type="text"]');
    expect(colorInputs.length).toBe(13); 

    // Check for default values for a few select fields
    await expect(page.locator('#headerRowBackground')).toHaveValue('#CC2127');
    await expect(page.locator('#titleText')).toHaveValue('#000000');
    await expect(page.locator('#updateButtonBackground')).toHaveValue('#13294E');
  });

  test('should allow color input changes and reflect those changes in state', async ({ page }) => {
    await page.fill('#titleText', '#FF0000'); // Change the title text color
    await expect(page.locator('#titleText')).toHaveValue('#FF0000');
    await page.fill('#headerRowBackground', '#00FF00'); // Change the header row background color
    await expect(page.locator('#headerRowBackground')).toHaveValue('#00FF00');

    // Testing another color field
    await page.fill('#updateButtonBackground', '#0000FF'); // Change the update button background
    await expect(page.locator('#updateButtonBackground')).toHaveValue('#0000FF');
  });

  test('should validate color inputs and enable buttons accordingly', async ({ page }) => {
    await page.fill('#titleText', '#FF0000'); 
    await page.fill('#headerRowBackground', '#FFFFFF'); 
    // Assure that valid color changes enable the Save & Exit button
    const saveExitButton = page.locator('#roundFormSubmitBtnSaveExit');
    await expect(saveExitButton).toBeEnabled();
  });

  test('should handle Save & Exit button click correctly', async ({ page }) => {
    await page.fill('#titleText', '#FF0000'); // Set a valid color to enable the button
    await page.click('#roundFormSubmitBtnSaveExit');
    page.on('dialog', async dialog => {
      await expect(dialog.message()).toContain('Saving color theme');
      await dialog.dismiss();
    });
  });

  test('should reset to initial state when cancel button is clicked', async ({ page }) => {
    await page.fill('#titleText', '#FF0000'); 
    await page.click('#roundsModeLogCancelBtn'); 
    await expect(page.locator('#titleText')).toHaveValue('#000000');
  });

  test('should navigate to the previous page when Previous button is clicked', async ({ page }) => {
    await page.click('#roundFormSubmitBtnPrevious');
    await expect(page).toHaveURL('http://localhost:3000/previous-page-url'); 
  });
});

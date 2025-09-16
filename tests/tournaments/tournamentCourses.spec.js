const { test, expect } = require('@playwright/test');

test.describe('TournamentCourses Component', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://localhost:3000'); // Adjust the URL to your dev server
	});

	test('should search and add a course', async ({ page }) => {
		// Type in the search box
		await page.fill('#courseInputBoxId', 'Trysting Tree');
		await page.waitForTimeout(500); // Wait for the debounce or search result to appear

		// Click on the first search result
		const firstResult = page.locator('button.list-group-item').first();
		await firstResult.click();

		// Check if the course is added to the table
		const courseNameCell = page.locator('table tbody tr td').first();
		await expect(courseNameCell).toContainText('Trysting Tree');
	});

	test('should not add the same course twice', async ({ page }) => {
		// Type in the search box
		await page.fill('#courseInputBoxId', 'Trysting Tree');
		await page.waitForTimeout(500); // Wait for the debounce or search result to appear

		// Click on the first search result
		const firstResult = page.locator('button.list-group-item').first();
		await firstResult.click();
		await firstResult.click(); // Click again to attempt adding the same course

		// Check if the alert was shown
		page.on('dialog', async dialog => {
			expect(dialog.message()).toBe('This course is already added.');
			await dialog.dismiss();
		});
	});

	test('should display course info in a modal', async ({ page }) => {
		// Add a course first
		await page.fill('#courseInputBoxId', 'Trysting Tree');
		await page.waitForTimeout(500); // Wait for the debounce or search result to appear

		const firstResult = page.locator('button.list-group-item').first();
		await firstResult.click();

		// Click the view icon
		const viewIcon = page.locator('i.fa-eye').first();
		await viewIcon.click();

		// Check if the modal is visible
		const modal = page.locator('.modal-dialog');
		await expect(modal).toBeVisible();

		// Check if the modal contains course info
		const courseInfo = page.locator('.modal-dialog .modal-content');
		await expect(courseInfo).toContainText('Trysting Tree');
	});
});

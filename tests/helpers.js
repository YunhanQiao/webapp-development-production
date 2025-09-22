import { expect } from "@playwright/test";

// Use existing user credentials for testing
const defaultEmail = "JohnsonYqiao@gmail.com";
const defaultPassword = "GoodLuck2025!"

/**
 * Login with existing user credentials
 * This is the preferred method for tournament testing
 */
export async function loginWithExistingUser(page, email = defaultEmail, password = defaultPassword) {
  console.log('🔑 Logging in with existing user credentials...');
  
  // Navigate to home page first
  await page.goto("/");
  
  // Click login button to go to login page
  await page.click("#loginBtn");
  
  // Wait for login form to be visible
  await page.waitForSelector("#loginForm", { timeout: 5000 });
  
  // Fill the form
  await page.fill("#email", email);
  await page.fill("#password", password);
  
  // Submit the form and wait for navigation
  const [response] = await Promise.all([
    page.waitForResponse(response => 
      response.url().includes('/auth/login') && 
      response.request().method() === 'POST'
    ),
    page.click('button[type="submit"]') // Use the submit button instead of #loginBtn
  ]);
  
  // Check if login was successful
  if (response.status() === 200) {
    // Wait for redirect to feed page
    await page.waitForURL(/.*\/feed/, { timeout: 10000 });
    
    // Wait for main navigation elements to be visible
    await page.waitForSelector("#tournamentsMode", { timeout: 10000 });
    
    console.log('✅ Successfully logged in with existing user');
  } else {
    console.log('❌ Login failed with status:', response.status());
    await page.screenshot({ path: '/tmp/login-failed.png' });
    throw new Error(`Login failed with status ${response.status()}`);
  }
}

/**
 * Bypass authentication by directly setting up mock user data and JWT token
 * This allows us to focus on tournament creation testing without authentication flow
 */
export async function bypassAuthentication(page) {
  console.log('🔧 Bypassing authentication for tournament testing...');
  
  // Mock user data
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    accountInfo: {
      email: 'test@playwright.com'
    },
    personalInfo: {
      firstName: 'Test',
      lastName: 'User'
    }
  };
  
  // Mock JWT token (this is just for frontend state, backend should handle test auth)
  const mockJwtToken = 'mock-jwt-token-for-testing';
  
  // Navigate to the main app
  await page.goto('/');
  
  // Set up localStorage with mock auth data
  await page.evaluate(([user, token]) => {
    localStorage.setItem('jwtToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    // Set cookie if needed
    document.cookie = `user-cookie=${token}; path=/`;
  }, [mockUser, mockJwtToken]);
  
  // Refresh to apply the auth state
  await page.reload();
  
  // Wait for app to load with authenticated state
  await page.waitForTimeout(2000);
  
  console.log('✅ Authentication bypassed successfully');
}

/**
 * Legacy functions - kept for compatibility but recommend using bypassAuthentication
 */
export async function login(page, email = defaultEmail, password = defaultPassword) {
  console.log('⚠️  Using legacy login - consider using bypassAuthentication() instead');
  await expect(page.isVisible("#loginForm")).resolves.toBe(true);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click("#loginBtn");
  await expect(page.isVisible("#feedModeTab")).resolves.toBe(true);
}

export async function createAccount(page, email = defaultEmail, password = defaultPassword) {
  console.log('⚠️  Using legacy createAccount - consider using bypassAuthentication() instead');
  await page.goto("/login");
  await expect(page.isVisible("#loginForm")).resolves.toBe(true);
  await page.getByText("Create Account").click();
  await expect(page.isVisible("#createAccountForm")).resolves.toBe(true);
  await page.fill('#acctEmail', email);
  await page.fill('#acctPassword', password);
  await page.fill('#acctPasswordRepeat', password);
  await page.fill('#userFirstName', 'Create');
  await page.fill('#userLastName', 'Account Test');
  await page.fill('#dob', '2024-04-11');
  await page.selectOption('select#parPreference', 'mens');
  await page.fill("#city","Corvallis");
  await page.selectOption("#state","Oregon");
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

/**
 * Helper function to create a complete tournament for testing
 * @param {Page} page - Playwright page object
 * @param {Object} tournamentData - Tournament configuration
 * @returns {Object} Tournament creation results including ID
 */
export async function createTournament(page, tournamentData = {}) {
  const defaultData = {
    name: `Test Tournament ${Date.now()}`,
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    prizeText: 'Test prizes',
    additionalInfoText: 'Test additional info',
    regStartDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
    regEndDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    currencyType: 'USD'
  };

  const data = { ...defaultData, ...tournamentData };

  // Login with existing user
  await loginWithExistingUser(page);

  // Navigate to tournament creation
  await page.click('#tournamentsMode');
  await page.click('#tournamentModeActionBtn');
  
  // Wait for tournament creation page to load
  await page.waitForSelector('#tournamentFormHeader', { timeout: 10000 });

  // Fill Basic Info
  await page.locator('#startDate').fill(data.startDate.toISOString().split('T')[0]);
  await page.locator('#endDate').fill(data.endDate.toISOString().split('T')[0]);
  await page.locator('#name').fill(data.name);
  await page.locator('#prizeText').fill(data.prizeText);
  await page.locator('#additionalInfoText').fill(data.additionalInfoText);

  // Submit Basic Info and capture tournament ID
  const [response] = await Promise.all([
    page.waitForResponse(response => 
      response.url().includes('/competition/newCompetition') && 
      response.request().method() === 'POST'
    ),
    page.locator('#basicInfo-footer').getByRole('button', { name: 'Save & Next' }).click()
  ]);

  const responseData = await response.json();
  const tournamentId = responseData.competitionId;

  return {
    tournamentId,
    tournamentData: data,
    response: responseData
  };
}

/**
 * Helper function to add a course to a tournament
 * @param {Page} page - Playwright page object
 * @param {Object} courseData - Course configuration
 * @returns {Promise} Course creation response
 */
export async function addCourseToTournament(page, courseData = {}) {
  const defaultCourse = {
    name: 'Test Golf Course',
    location: 'Test City, Test State',
    description: 'A test golf course'
  };

  const course = { ...defaultCourse, ...courseData };

  // Navigate to courses tab if not already there
  await page.getByRole('tab', { name: 'Courses' }).click();
  
  // Click Add Course button
  await page.getByRole('button', { name: 'Add Course' }).click();
  
  // Fill course details
  await page.locator('#courseName').fill(course.name);
  await page.locator('#location').fill(course.location);
  await page.locator('#description').fill(course.description);
  
  // Submit course
  const [courseResponse] = await Promise.all([
    page.waitForResponse(response => 
      response.url().includes('/courses') && 
      response.request().method() === 'POST'
    ),
    page.getByRole('button', { name: 'Add Course' }).click()
  ]);

  return courseResponse;
}

/**
 * Helper function to add a division to a tournament
 * @param {Page} page - Playwright page object
 * @param {Object} divisionData - Division configuration
 * @returns {Promise} Division creation response
 */
export async function addDivisionToTournament(page, divisionData = {}) {
  const defaultDivision = {
    name: 'Test Division',
    gender: 'men',
    minAge: '18',
    maxAge: '65',
    entryFee: '50'
  };

  const division = { ...defaultDivision, ...divisionData };

  // Navigate to divisions tab if not already there
  await page.getByRole('tab', { name: 'Divisions' }).click();
  
  // Click Add Division button
  await page.getByRole('button', { name: 'Add Division' }).click();
  
  // Fill division details
  await page.locator('#divisionName').fill(division.name);
  await page.locator('#gender').selectOption(division.gender);
  await page.locator('#minAge').fill(division.minAge);
  await page.locator('#maxAge').fill(division.maxAge);
  await page.locator('#entryFee').fill(division.entryFee);
  
  // Submit division
  const [divisionResponse] = await Promise.all([
    page.waitForResponse(response => 
      response.url().includes('/divisions') && 
      response.request().method() === 'POST'
    ),
    page.getByRole('button', { name: 'Save Division' }).click()
  ]);

  return divisionResponse;
}

/**
 * Helper function to verify tournament data in backend
 * @param {APIRequestContext} request - Playwright request context
 * @param {string} tournamentId - Tournament ID to verify
 * @param {string} jwtToken - JWT token for authorization
 * @param {string} apiBaseUrl - Base URL for API
 * @returns {Object} Tournament data from backend
 */
export async function verifyTournamentInBackend(request, tournamentId, jwtToken, apiBaseUrl) {
  const apiResponse = await request.get(`${apiBaseUrl}competition/${tournamentId}`, {
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json'
    }
  });

  expect(apiResponse.status()).toBe(200);
  return await apiResponse.json();
}

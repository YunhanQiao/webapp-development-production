const { devices } = require("@playwright/test");

const config = {
  outputDir: "./test-results",
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    actionTimeout: 15000,
    navigationTimeout: 15000,
    // headless: false,
    // launchOptions: {sloMo: 1000,},
  },
  projects: [
    {
      name: "ChromeDesktop",
      browserName: "chromium",
      use: { ...devices["Desktop Chrome"] },
      viewport: { width: 1024, height: 768 },
    },
  ],
};

module.exports = config;

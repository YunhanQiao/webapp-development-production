const { devices } = require("@playwright/test");

const config = {
  outputDir: "./test-results",
  use: {
    baseURL: "http://localhost:3000",
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

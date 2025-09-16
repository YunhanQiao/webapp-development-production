const{test, expect} = require('@playwright/test')


exports.expect = expect
exports.test = test.extend({
    webapp: async ({ page }, use) => {
        // Navigate to the login page
        await page.goto('https://www.speedscore.org/');
      
          // The account does not exist, so proceed to account cration
          await page.click('#createAccountBtn');
          await page.waitForTimeout(2000);
          // You can further interact with the account creation page, e.g., fill out a form
          await page.fill('#acctEmail', 'chiluksr@speed.org');
          await page.fill('#acctPassword', 'Chiluksr@21');
      
          await page.waitForTimeout(2000); // Wait for 2 seconds
      
          await page.fill('#acctPassword', 'Chiluksr@21');
          await page.fill('#acctPasswordRepeat', 'Chiluksr@21');
          await page.fill('#acctDisplayName', 'Chiluksr');
      
          await page.waitForTimeout(2000); // Wait for 2 seconds
      
          await page.fill('#acctSecurityQuestion', 'What is your pet name?')
          await page.fill('#acctSecurityAnswer','Tommy')
          await page.click('#submitCreateAccountBtn')
      
          await page.waitForTimeout(2000); // Wait for 2 seconds
          // Check if the account creation was successful (you'll need to adapt this assertion based on the actual behavior)
         await use(page);
    }
})
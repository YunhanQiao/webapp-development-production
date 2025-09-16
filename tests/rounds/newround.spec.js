
const { keyboard } = require('@testing-library/user-event/dist/keyboard');
const{test, expect } = require('./testsetup')

test('newround',  async ({ webapp }) => {
  await webapp.fill('#email', 'chiluksr@speed.org');
  await webapp.fill('#password', 'Chiluksr@21');
  await webapp.click("//*[@id='loginBtn']");
  await webapp.waitForTimeout(2000); // Wait for 2 seconds  

  await webapp.click('#roundsMode')
  await webapp.click('#roundsModeActionBtn');
  await webapp.fill('#roundCourse', 'round1');
  await webapp.waitForTimeout(2000);
  await webapp.click("#roundFormSubmitBtnLabel");
  await webapp.waitForTimeout(2000); // Wait for 2 seconds  c

  await webapp.click('#roundsModeActionBtn');
  await webapp.fill('#roundCourse', 'round1');
  await webapp.waitForTimeout(2000);
  await webapp.click("#roundFormSubmitBtnLabel");

await webapp.click('#roundsMode')
    await webapp.click("//*[@id='searchBtn']/span")
    await webapp.fill("//*[@id='searchRounds']",'round1')
    await webapp.keyboard.press('Enter')
    await webapp.waitForTimeout(2000);

    await webapp.close();

});

const {test, expect} = require('@playwright/test');
const{resolve} = require('path');
test('webpage', async({page}) => {

    await page.goto('http://www.speedscore.org')

    const pagetitle = page.title();
    await page.waitForTimeout(2000);

    await page.close();

})
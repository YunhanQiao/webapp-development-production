// Get the current working directory
const cwd = process.cwd();
const urlupdate = require('/Users/srivallychilukuri/Documents/SpeedScore/fall2023/urlupdate.js');

// Get all Playwright files in the folder
const playwrightFiles = fs.readdirSync(cwd).filter(file => file.endsWith('.js') && file !== __filename);

// Update the website URL in all Playwright files
for (const playwrightFile of playwrightFiles) {
  const playwrightFileContent = fs.readFileSync(path.join(cwd, playwrightFile));
  const updatedPlaywrightFileContent = playwrightFileContent.replace(/https:\/\/old-website.com/g, 'https://new-website.com');

  fs.writeFileSync(path.join(cwd, playwrightFile), updatedPlaywrightFileContent);
}

// Log a message to the console
console.log(`Updated the website URL in ${playwrightFiles.length} Playwright files.`);
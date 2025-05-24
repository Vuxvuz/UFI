const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CONCURRENCY = 5;

// Load the original JSON
const inputData = JSON.parse(fs.readFileSync('output.json', 'utf8'));

// Output folders
const OUTPUT_FOLDER = './crawled_data';
if (!fs.existsSync(OUTPUT_FOLDER)) {
  fs.mkdirSync(OUTPUT_FOLDER);
}

const FAILED_LOG = path.join(OUTPUT_FOLDER, 'failed_urls.log');
fs.writeFileSync(FAILED_LOG, ''); // Clear old log

(async () => {
  const pLimit = (await import('p-limit')).default;
  const browser = await chromium.launch();
  const mainPage = await browser.newPage();
  const limit = pLimit(CONCURRENCY);

  for (const item of inputData) {
    console.log(`🔍 Visiting: ${item.url}`);
    await mainPage.goto(item.url, { waitUntil: 'domcontentloaded' });

    const links = await mainPage.$$eval('a', anchors =>
      anchors.map(a => ({ href: a.href, text: a.textContent.trim() }))
    );

    const tasks = links.map((link, index) =>
      limit(async () => {
        if (!link.href || typeof link.href !== 'string' || !link.href.startsWith('http')) {
          console.warn(`⚠️ Skipping invalid URL at index ${index}:`, link);
          fs.appendFileSync(FAILED_LOG, `Invalid URL [${index}]: ${JSON.stringify(link)}\n`);
          return;
        }

        console.log(`   ↪ [${index + 1}/${links.length}] Visiting: ${link.href}`);
        let success = false;

        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const newPage = await browser.newPage();
            const response = await newPage.goto(link.href, { waitUntil: 'domcontentloaded', timeout: 15000 });

            if (!response || !response.ok()) {
              throw new Error(`HTTP status ${response ? response.status() : 'unknown'}`);
            }

            const content = await newPage.evaluate(() => document.body.innerText || '');

            const safeFilename = link.href.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const textFilePath = path.join(OUTPUT_FOLDER, `${safeFilename}.txt`);
            fs.writeFileSync(textFilePath, content);

            const jsonFilePath = path.join(OUTPUT_FOLDER, `${safeFilename}.json`);
            fs.writeFileSync(
              jsonFilePath,
              JSON.stringify({ href: link.href, title: link.text, content }, null, 2)
            );

            await newPage.close();
            success = true;
            break; // Exit retry loop if successful

          } catch (err) {
            console.warn(`⚠️ Attempt ${attempt} failed for ${link.href}: ${err.message}`);
            if (attempt === 2) {
              fs.appendFileSync(FAILED_LOG, `${link.href} -- ${err.message}\n`);
              console.warn(`❌ Logged failure for: ${link.href}`);
            }
          }
        }
      })
    );

    await Promise.all(tasks);
  }

  await browser.close();
  console.log('✅ All done. Files saved in:', OUTPUT_FOLDER);
  console.log('⚠️ Failed URLs logged in:', FAILED_LOG);
})();

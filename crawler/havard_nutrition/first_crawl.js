const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const url = 'https://nutritionsource.hsph.harvard.edu/';
  
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  const data = await page.evaluate(() => {
    const blocks = document.querySelectorAll('.event-block');
    const results = [];
    blocks.forEach(block => {
      const linkEl = block.querySelector('h3 + p a');
      const titleEl = block.querySelector('h4');
      const descEl = titleEl ? titleEl.nextElementSibling : null;

      if (linkEl && titleEl && descEl) {
        results.push({
          title: titleEl.textContent.trim(),
          url: linkEl.href,
          description: descEl.textContent.trim()
        });
      }
    });
    return results;
  });

  fs.writeFileSync('output.json', JSON.stringify(data, null, 2));
  console.log('✅ Data saved to output.json');

  await browser.close();
})();

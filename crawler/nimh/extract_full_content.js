const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');

const CONCURRENCY_LIMIT = 5; // Limit concurrent requests to be respectful
const INPUT_FILE = './content_comparison.csv'; // Your CSV file
const OUTPUT_FILE = './full_content.json'; // Where to save the results

(async () => {
  // Import p-limit dynamically
  const pLimit = (await import('p-limit')).default;
  const limit = pLimit(CONCURRENCY_LIMIT);
  
  console.log(`🚀 Starting content extraction with concurrency limit of ${CONCURRENCY_LIMIT}`);
  
  // Launch browser
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process']
  });
  
  // Read input data from CSV
  let inputData = [];
  try {
    // Read CSV file
    inputData = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(INPUT_FILE)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
    
    console.log(`📚 Loaded ${inputData.length} URLs from ${INPUT_FILE}`);
  } catch (err) {
    console.error(`❌ Failed to read input file: ${err.message}`);
    await browser.close();
    return;
  }
  
  // Process each URL and extract content
  const results = await Promise.all(
    inputData.map(item => 
      limit(async () => {
        console.log(`🔍 Processing: ${item.title}`);
        
        try {
          const page = await browser.newPage();
          await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
          
          // Wait for content to load
          await page.waitForSelector('body', { timeout: 10000 });
          
          // Extract content
          const content = await page.evaluate(() => {
            // Remove scripts, styles, and hidden elements
            document.querySelectorAll('script, style, [style*="display:none"], [style*="display: none"]')
              .forEach(el => el.remove());
            
            // Get main content - adjust selectors based on the website structure
            const mainContent = document.querySelector('main') || 
                                document.querySelector('#content') || 
                                document.querySelector('article') || 
                                document.querySelector('.content') ||
                                document.body;
            
            // Clean up the text
            return mainContent.innerText
              .replace(/\s+/g, ' ')  // Replace multiple spaces with a single space
              .replace(/\n+/g, '\n') // Replace multiple newlines with a single newline
              .trim();
          });
          
          await page.close();
          
          return {
            title: item.title,
            url: item.url,
            content: content,
            contentLength: content.length,
            originalLength: parseInt(item.originalContentLength) || 0,
            crawledLength: parseInt(item.crawledContentLength) || 0,
            contentDiff: content.length - (parseInt(item.originalContentLength) || 0)
          };
        } catch (error) {
          console.error(`❌ Error processing ${item.url}: ${error.message}`);
          return {
            title: item.title,
            url: item.url,
            content: `Error: ${error.message}`,
            contentLength: 0,
            originalLength: parseInt(item.originalContentLength) || 0,
            crawledLength: parseInt(item.crawledContentLength) || 0,
            contentDiff: 0,
            error: error.message
          };
        }
      })
    )
  );
  
  // Save results to file
  try {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
    console.log(`✅ Saved results to ${OUTPUT_FILE}`);
  } catch (err) {
    console.error(`❌ Failed to save results: ${err.message}`);
  }
  
  // Close browser
  await browser.close();
  console.log('🏁 Extraction complete!');
})(); 
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');

const CONCURRENCY_LIMIT = 5;
const INPUT_FILE = './content_comparison.csv';
const OUTPUT_FILE = './formatted_content.json';

(async () => {
  const pLimit = (await import('p-limit')).default;
  const limit = pLimit(CONCURRENCY_LIMIT);
  
  console.log(`🚀 Starting content extraction with concurrency limit of ${CONCURRENCY_LIMIT}`);
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process']
  });
  
  // Read input data from CSV
  let inputData = [];
  try {
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
          await page.goto(item.url, { waitUntil: 'networkidle', timeout: 60000 });
          
          // Wait for content to load
          await page.waitForSelector('body', { timeout: 10000 });
          
          // Extract formatted HTML content
          const htmlContent = await page.evaluate((baseUrl) => {
            // Remove unwanted elements
            const elementsToRemove = [
              'script', 'style', 'iframe', 'nav', 'footer',
              'header:not(article header)', '.sidebar', '.ads', 
              '.comments', '.social-share', '.related-articles',
              'noscript', '.cookie-notice', '.popup',
              '[role="banner"]', '[role="navigation"]',
              '[data-nosnippet]', '[aria-hidden="true"]'
            ];
            
            elementsToRemove.forEach(selector => {
              document.querySelectorAll(selector).forEach(el => el.remove());
            });
            
            // Find the main content container
            const contentSelectors = [
              'article', 'main', '.main-content', '#main-content',
              '.article-content', '.post-content', '.entry-content',
              '#content', '.content'
            ];
            
            let mainContent = null;
            for (const selector of contentSelectors) {
              const element = document.querySelector(selector);
              if (element && element.offsetHeight > 200) { // Only if visible and substantial
                mainContent = element;
                break;
              }
            }
            
            // If no specific content container found, use body
            if (!mainContent) {
              mainContent = document.body;
            }
            
            // Clone the content to avoid modifying the original
            const contentClone = mainContent.cloneNode(true);
            
            // Fix relative URLs to absolute
            contentClone.querySelectorAll('img, a').forEach(el => {
              if (el.tagName === 'IMG' && el.hasAttribute('src')) {
                if (!el.src.startsWith('http')) {
                  el.src = new URL(el.getAttribute('src'), baseUrl).href;
                }
              }
              if (el.tagName === 'A' && el.hasAttribute('href')) {
                if (!el.href.startsWith('http') && !el.href.startsWith('mailto:') && !el.href.startsWith('#')) {
                  el.href = new URL(el.getAttribute('href'), baseUrl).href;
                }
              }
            });
            
            // Add attribution
            const attribution = document.createElement('div');
            attribution.className = 'source-attribution';
            attribution.innerHTML = `<p>Source: <a href="${baseUrl}" target="_blank">${document.title}</a></p>`;
            contentClone.appendChild(attribution);
            
            return contentClone.innerHTML;
          }, item.url);
          
          await page.close();
          
          return {
            title: item.title,
            url: item.url,
            htmlContent: htmlContent,
            contentLength: htmlContent.length,
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          console.error(`❌ Error processing ${item.url}: ${error.message}`);
          return {
            title: item.title,
            url: item.url,
            htmlContent: `<p>Error extracting content: ${error.message}</p>`,
            contentLength: 0,
            error: error.message,
            timestamp: new Date().toISOString()
          };
        }
      })
    )
  );
  
  // Save results to file
  try {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
    console.log(`✅ Saved formatted HTML content to ${OUTPUT_FILE}`);
  } catch (err) {
    console.error(`❌ Failed to save results: ${err.message}`);
  }
  
  // Close browser
  await browser.close();
  console.log('🏁 Extraction complete!');
})(); 
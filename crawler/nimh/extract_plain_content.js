const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');

const CONCURRENCY_LIMIT = 5;
const INPUT_FILE = './content_comparison.csv';
const OUTPUT_FILE = './plain_content.json';

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
          
          // Extract formatted plain text content
          const plainContent = await page.evaluate(() => {
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
            
            // Function to get text with proper paragraph breaks
            const getFormattedText = (element) => {
              // Clone the element to avoid modifying the original
              const clone = element.cloneNode(true);
              
              // Replace headings with formatted text
              clone.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
                const level = heading.tagName.substring(1);
                const text = heading.textContent.trim();
                // Add double newlines before headings for separation
                const replacement = document.createTextNode(`\n\n${text}\n`);
                heading.parentNode.replaceChild(replacement, heading);
              });
              
              // Add newlines after paragraphs
              clone.querySelectorAll('p, div > br').forEach(p => {
                const nextNode = document.createTextNode('\n\n');
                if (p.nextSibling) {
                  p.parentNode.insertBefore(nextNode, p.nextSibling);
                } else {
                  p.parentNode.appendChild(nextNode);
                }
              });
              
              // Format lists
              clone.querySelectorAll('li').forEach(li => {
                const listMarker = document.createTextNode('• ');
                li.insertBefore(listMarker, li.firstChild);
                const lineBreak = document.createTextNode('\n');
                if (li.nextSibling) {
                  li.parentNode.insertBefore(lineBreak, li.nextSibling);
                } else {
                  li.parentNode.appendChild(lineBreak);
                }
              });
              
              // Get the text content with formatting
              let text = clone.textContent || '';
              
              // Clean up excessive whitespace while preserving paragraph breaks
              text = text.replace(/\n\s+\n/g, '\n\n')  // Remove space-only lines
                        .replace(/\n{3,}/g, '\n\n')    // Limit to max 2 consecutive newlines
                        .replace(/[ \t]+/g, ' ')       // Normalize spaces
                        .trim();
              
              return text;
            };
            
            return getFormattedText(mainContent);
          });
          
          await page.close();
          
          return {
            title: item.title,
            url: item.url,
            content: plainContent,
            contentLength: plainContent.length,
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          console.error(`❌ Error processing ${item.url}: ${error.message}`);
          return {
            title: item.title,
            url: item.url,
            content: `Error extracting content: ${error.message}`,
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
    console.log(`✅ Saved plain text content to ${OUTPUT_FILE}`);
    
    // Also save as individual text files for easier inspection
    const outputDir = './extracted_content';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    results.forEach(item => {
      if (!item.error) {
        const safeFilename = item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        fs.writeFileSync(
          path.join(outputDir, `${safeFilename}.txt`),
          item.content
        );
      }
    });
    console.log(`✅ Also saved individual text files to ${outputDir}/`);
  } catch (err) {
    console.error(`❌ Failed to save results: ${err.message}`);
  }
  
  // Close browser
  await browser.close();
  console.log('🏁 Extraction complete!');
})(); 
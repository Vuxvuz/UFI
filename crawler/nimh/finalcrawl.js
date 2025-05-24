const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');

const CONCURRENCY_LIMIT = 10;
const INPUT_FILE = './content_comparison.csv';
const OUTPUT_FILE = './updated_content.json';

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
    
    console.log(`📚 Loaded ${inputData.length} articles from ${INPUT_FILE}`);
  } catch (err) {
    console.error(`❌ Failed to read input file: ${err.message}`);
    await browser.close();
    return;
  }
  
  const result = [];
  let failedArticles = [];
  let processedCount = 0;
  
  async function processArticle(article) {
    const page = await browser.newPage();
    try {
      console.log(`🔍 Visiting: ${article.title}`);
      await page.goto(article.url, { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });
      
      // Try multiple selectors to extract content, starting with the most specific ones
      let content = '';
      
      // First try specific article content selectors
      try {
        content = await page.$$eval('main article, main, article, .main-content, #main-content', 
          elements => {
            // Get all paragraph and list elements within the main content
            const textElements = Array.from(elements[0].querySelectorAll('p, li, h1, h2, h3, h4, h5, h6'));
            
            // Filter out very short elements and those likely to be navigation or footer
            return textElements
              .map(el => el.textContent.trim())
              .filter(text => text.length > 20)  // Filter out very short paragraphs
              .filter(text => !text.includes('Last Reviewed') && !text.includes('Privacy Policy'))
              .join('\n');
          }
        );
      } catch (error) {
        // Continue if this selector fails
        console.warn(`⚠️ First content extraction method failed: ${error.message}`);
      }
      
      // If no content found, try more generic content selectors
      if (!content || content.length < 100) {
        try {
          content = await page.$$eval('div.content, div.body, div[role="main"], #content, .article-body', 
            elements => {
              if (elements.length === 0) return '';
              
              const textElements = Array.from(elements[0].querySelectorAll('p, li'));
              return textElements
                .map(el => el.textContent.trim())
                .filter(text => text.length > 20)
                .join('\n');
            }
          );
        } catch (error) {
          console.warn(`⚠️ Second content extraction method failed: ${error.message}`);
        }
      }
      
      // If still no content, try to get all paragraphs but filter out very short ones
      if (!content || content.length < 100) {
        try {
          content = await page.$$eval('p', ps =>
            ps.map(p => p.textContent.trim())
              .filter(text => text.length > 30) // Filter out short paragraphs
              .join('\n')
          );
        } catch (error) {
          content = 'No content found';
          console.warn(`⚠️ Last resort content extraction failed: ${error.message}`);
        }
      }
      
      result.push({
        title: article.title,
        url: article.url,
        content: content,
        contentLength: content.length,
        originalLength: parseInt(article.originalContentLength, 10),
        crawledLength: parseInt(article.crawledContentLength, 10) || 0,
        contentDiff: content.length - parseInt(article.originalContentLength, 10)
      });
      
      processedCount++;
      const progressPercent = Math.round((processedCount / inputData.length) * 100);
      console.log(`✅ Done: ${article.title} (${processedCount}/${inputData.length}, ${progressPercent}%)`);
    } catch (err) {
      console.warn(`⚠️ Failed to process ${article.title}: ${err.message}`);
      failedArticles.push(article);
    } finally {
      await page.close();
    }
  }
  
  // --- First run ---
  console.log(`🔄 Starting first processing run for ${inputData.length} articles...`);
  const promises = inputData.map(article =>
    limit(() => processArticle(article))
  );
  
  await Promise.allSettled(promises);
  
  // --- Retry 1 ---
  if (failedArticles.length > 0) {
    console.log(`🔁 Retry 1: ${failedArticles.length} articles`);
    const retryList = failedArticles;
    failedArticles = [];
    
    const retryPromises = retryList.map(article =>
      limit(() => processArticle(article))
    );
    
    await Promise.allSettled(retryPromises);
  }
  
  // --- Final failed list ---
  if (failedArticles.length > 0) {
    console.log(`❌ Final failed articles (${failedArticles.length}):`);
    failedArticles.forEach(article => {
      console.log(`- ${article.title}: ${article.url}`);
    });
    
    // Save failed articles to a separate file for later processing
    fs.writeFileSync('crawler/nimh/failed_articles.json', JSON.stringify(failedArticles, null, 2));
    console.log(`💾 Failed articles saved to crawler/nimh/failed_articles.json`);
  }
  
  // Create output directory if it doesn't exist
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir) && outputDir !== '') {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Save the results
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
  console.log(`✅ All articles processed and saved to ${OUTPUT_FILE}`);
  console.log(`📊 Summary: Total: ${inputData.length}, Successful: ${result.length}, Failed: ${failedArticles.length}`);
  
  // Generate a new comparison CSV
  const comparisonData = result.map(item => {
    return {
      title: item.title,
      url: item.url,
      originalLength: item.originalLength,
      newContentLength: item.contentLength,
      contentLengthDiff: item.contentDiff,
      status: item.contentLength > 0 ? 'Success' : 'Failed'
    };
  });
  
  // Convert to CSV
  const { parse } = require('json2csv');
  const csv = parse(comparisonData);
  fs.writeFileSync('crawler/nimh/updated_comparison.csv', csv);
  console.log(`✅ Updated comparison CSV created at crawler/nimh/updated_comparison.csv`);
  
  await browser.close();
})().catch(err => {
  console.error(`❌ Unhandled error: ${err.message}`);
  process.exit(1);
});
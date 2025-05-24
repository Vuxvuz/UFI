const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CONCURRENCY_LIMIT = 10;
const INPUT_FILE = 'nimh_full_articles.json';
const OUTPUT_FILE = 'nimh_articles_content.json';

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
  
  // Read input data
  let inputData;
  try {
    inputData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
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
        content = await page.$$eval('article p, .main-content p, #main-content p, .article-body p', ps =>
          ps.map(p => p.textContent.trim()).join('\n')
        );
      } catch (error) {
        // Continue if this selector fails
      }
      
      // If no content found, try more generic content selectors
      if (!content) {
        try {
          content = await page.$$eval('div.content p, div.body p, div[role="main"] p', ps =>
            ps.map(p => p.textContent.trim()).join('\n')
          );
        } catch (error) {
          // Continue if this selector fails
        }
      }
      
      // If still no content, try to get all paragraphs but filter out very short ones
      if (!content) {
        try {
          content = await page.$$eval('p', ps =>
            ps.map(p => p.textContent.trim())
              .filter(text => text.length > 30) // Filter out short paragraphs
              .join('\n')
          );
        } catch (error) {
          content = 'No content found';
        }
      }

      result.push({
        title: article.title,
        url: article.url,
        content_en: content
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
  if (!Array.isArray(inputData)) {
    console.error("❌ Input data is not an array. Please check the input file.");
    await browser.close();
    return;
  }

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
    fs.writeFileSync('failed_articles.json', JSON.stringify(failedArticles, null, 2));
    console.log(`💾 Failed articles saved to failed_articles.json`);
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

  await browser.close();
})().catch(err => {
  console.error(`❌ Unhandled error: ${err.message}`);
  process.exit(1);
});
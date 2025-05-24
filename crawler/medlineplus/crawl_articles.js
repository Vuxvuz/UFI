const { chromium } = require('playwright');
const fs = require('fs');

const CONCURRENCY_LIMIT = 10;
const INPUT_FILE = 'nimh_full_articles.json';
const OUTPUT_FILE = 'nimh_articles_content.json';

(async () => {
  const pLimit = (await import('p-limit')).default;
  const browser = await chromium.launch({ headless: true });
  const limit = pLimit(CONCURRENCY_LIMIT);

  const inputData = JSON.parse(fs.readFileSync(INPUT_FILE));
  const result = [];
  let failedArticles = [];

  async function processArticle(article) {
    const page = await browser.newPage();
    try {
      console.log(`🔍 Visiting: ${article.title}`);
      await page.goto(article.url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      const content = await page.$$eval('article p, .main-content p', ps =>
        ps.map(p => p.textContent.trim()).join('\n')
      );

      result.push({
        title: article.title,
        url: article.url,
        content_en: content
      });

      console.log(`✅ Done: ${article.title}`);
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
    return;
  }

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

  // --- Retry 2 ---
  if (failedArticles.length > 0) {
    console.log(`🔁 Retry 2: ${failedArticles.length} articles`);
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
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
  console.log(`✅ All articles processed and saved to ${OUTPUT_FILE}`);

  await browser.close();
})();
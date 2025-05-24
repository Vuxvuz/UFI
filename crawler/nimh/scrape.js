const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const baseUrl = "https://www.nimh.nih.gov";
  await page.goto(`${baseUrl}/health/topics`, { waitUntil: "domcontentloaded" });

  const topicLinks = await page.$$eval("a[href^='/health/topics/']", els =>
    Array.from(new Set(
      els.map(a => a.href).filter(href =>
        href.includes("/health/topics/") && !href.includes("#")
      )
    ))
  );

  console.log("🧠 Found", topicLinks.length, "topic pages.");

  const articles = [];

  for (const link of topicLinks) {
    console.log("🔍 Visiting:", link);
    try {
      await page.goto(link, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForSelector("h1", { timeout: 5000 });

      const title = await page.$eval("h1", el => el.textContent.trim());

      const contentBlocks = await page.$$eval("#main-content p, #main-content ul", nodes =>
        nodes.map(n => n.innerText.trim()).filter(t => t.length > 50)
      );

      if (contentBlocks.length === 0) {
        console.log("⚠️ No real content. Skipping...");
        continue;
      }

      articles.push({
        title,
        url: link,
        content: contentBlocks.join("\n\n")
      });

    } catch (err) {
      console.warn("❌ Failed:", link, "| Reason:", err.message);
    }
  }

  fs.writeFileSync("nimh_full_articles.json", JSON.stringify(articles, null, 2));
  console.log("✅ Done! Articles saved:", articles.length);

  await browser.close();
})();

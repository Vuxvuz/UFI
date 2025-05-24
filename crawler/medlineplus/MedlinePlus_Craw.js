const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const baseUrl = "https://medlineplus.gov";
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

  const topics = await page.$$eval("a.link-large.category-nav-link", anchors =>
    anchors.slice(0, 6).map(a => ({
      topic: a.childNodes[0].textContent.trim(),
      url: a.href
    }))
  );

  const result = [];

  for (const t of topics) {
    console.log("🔍 Visiting topic:", t.topic);
    await page.goto(t.url, { waitUntil: "domcontentloaded" });

    // --- Group 1: Card-style layout (Genetics + Healthy Recipes)
    if (["Genetics", "Healthy Recipes"].includes(t.topic)) {
      try {
        await page.waitForSelector(".mp-content a[href]", { timeout: 10000 });

        const cards = await page.$$eval(".mp-content a[href]", links =>
          links.map(link => {
            const title = link.querySelector("h2.gen-h2")?.textContent.trim()
              || link.querySelector("h2")?.textContent.trim()
              || link.textContent.trim();

            const description = link.querySelector("span.gen-blacktext")?.textContent.trim()
              || link.querySelector("p")?.textContent.trim()
              || "";

            const href = link.getAttribute("href");
            const url = new URL(href, location.href).href;

            const cover = link.querySelector("img")?.src || "";

            return { title, url, description, cover };
          })
        );

        result.push({ topic: t.topic, url: t.url, articles: cards });
        console.log(`✅ Found ${cards.length} articles in ${t.topic}`);
      } catch (err) {
        console.warn(`⚠️ Skipping ${t.topic}: selector not found or timed out`);
        result.push({ topic: t.topic, url: t.url, articles: [], error: err.message });
      }
      continue;
    }

    // --- Group 2A: Drugs & Supplements → A-Z crawling
    // --- Group 2A: Drugs & Supplements → A-Z crawling with fix
    if (t.topic === "Drugs & Supplements" ) {
        try {
          // Wait for the A-Z navigation links
          await page.waitForSelector(".alphanav .alpha-links li a", { timeout: 15000 });
  
          const azLinks = await page.$$eval(".alphanav .alpha-links li a", links =>
            links.map(link => ({
              letter: link.textContent.trim(),
              url: new URL(link.getAttribute("href") || "", location.href).href
            }))
          );
  
          const allDrugs = [];
  
          for (const az of azLinks) {
            console.log(`🔤 Crawling Drugs A-Z: ${az.letter}`);
            try {
              await page.goto(az.url, { waitUntil: "domcontentloaded" });
  
              // Wait for the drug index list
              await page.waitForSelector("ul#index", { timeout: 10000 });
  
              const items = await page.$$eval("ul#index li a", links =>
                links.map(link => ({
                  title: link.textContent.trim(),
                  url: new URL(link.getAttribute("href") || "", location.href).href
                }))
              );
  
              if (items.length === 0) {
                console.warn(`⚠️ No items found for ${az.letter}.`);
              }
  
              allDrugs.push(...items.map(d => ({ ...d, source: az.letter })));
              console.log(`✅ ${items.length} drugs from ${az.letter}`);
  
            } catch (innerErr) {
              console.warn(`⚠️ Skipped ${az.letter}: ${innerErr.message}`);
            }
          }
  
          result.push({ topic: t.topic, url: t.url, articles: allDrugs });
          console.log(`✅ Total drugs collected: ${allDrugs.length}`);
        } catch (err) {
          console.warn(`❌ Skipping ${t.topic}: ${err.message}`);
          result.push({ topic: t.topic, url: t.url, articles: [], error: err.message });
        }
        continue;
      }
  

//medical test

if (t.topic === "Medical Tests") {
    try {
      await page.waitForSelector(".alphanav .alpha-links li a", { timeout: 10000 });
  
      const azLinks = await page.$$eval(".alphanav .alpha-links li a", links =>
        links.map(link => {
          const letter = link.getAttribute("data-alpha").trim();
          let sectionId;
  
          if (letter === "0-9") sectionId = "section_0-9";
          else if (letter === "XYZ") sectionId = "XYZ"; // handle later
          else sectionId = `section_${letter}`;
  
          return { letter, sectionId };
        })
      );
  
      const allTests = [];
  
      for (const { letter, sectionId } of azLinks) {
        if (letter === "XYZ") {
          for (const sub of ["X", "Y", "Z"]) {
            const subSection = `section_${sub}`;
            try {
              await page.waitForSelector(`#${subSection} ul li a`, { timeout: 2000 });
              const tests = await page.$$eval(`#${subSection} ul li a`, anchors =>
                anchors.map(a => ({
                  title: a.textContent.trim(),
                  url: new URL(a.getAttribute("href"), location.href).href
                }))
              );
              allTests.push(...tests);
              console.log(`✅ Collected ${tests.length} from ${sub}`);
            } catch (e) {
              console.warn(`⚠️ Skipped ${sub}: ${e.message}`);
            }
          }
          continue;
        }
  
        try {
          console.log(`🔤 Parsing Medical Tests under ${letter}`);
          await page.waitForSelector(`#${sectionId} ul li a`, { timeout: 3000 });
          const tests = await page.$$eval(`#${sectionId} ul li a`, anchors =>
            anchors.map(a => ({
              title: a.textContent.trim(),
              url: new URL(a.getAttribute("href"), location.href).href
            }))
          );
          allTests.push(...tests);
          console.log(`✅ Collected ${tests.length} from ${letter}`);
        } catch (err) {
          console.warn(`⚠️ Skipped ${letter}: ${err.message}`);
        }
      }
  
      result.push({ topic: t.topic, url: t.url, articles: allTests });
      console.log(`✅ Total medical tests collected: ${allTests.length}`);
    } catch (err) {
      console.warn(`❌ Skipping ${t.topic}: ${err.message}`);
      result.push({ topic: t.topic, url: t.url, articles: [], error: err.message });
    }
    continue;
  }
  
  

    // --- Group 2B: Medical Encyclopedia
    if (t.topic === "Medical Encyclopedia") {
      try {
        await page.waitForSelector(".alpha-links li a", { timeout: 10000 });

        const azLinks = await page.$$eval(".alpha-links li a", links =>
          links.map(link => ({
            letter: link.textContent.trim(),
            url: new URL(link.getAttribute("href"), location.href).href
          }))
        );

        const allArticles = [];

        for (const az of azLinks) {
          console.log(`📘 Crawling encyclopedia: ${az.letter}`);
          try {
            await page.goto(az.url, { waitUntil: "domcontentloaded" });

            const articles = await page.$$eval("ul li a", anchors =>
              anchors
                .filter(a => a.href && a.textContent.trim().length > 0)
                .map(a => ({
                  title: a.textContent.trim(),
                  url: new URL(a.getAttribute("href"), location.href).href
                }))
            );

            allArticles.push(...articles);
          } catch (err) {
            console.warn(`⚠️ Skipped letter ${az.letter}: ${err.message}`);
          }
        }

        result.push({ topic: t.topic, url: t.url, articles: allArticles });
        console.log(`✅ Found ${allArticles.length} encyclopedia entries`);
      } catch (err) {
        console.warn(`⚠️ Skipping ${t.topic}: ${err.message}`);
        result.push({ topic: t.topic, url: t.url, articles: [], error: err.message });
      }
      continue;
    }

    // --- Fallback: Health Topics
    const defaultSelector = ".section-body ul.indent li a";
    try {
      await page.waitForSelector(defaultSelector, { timeout: 10000 });

      const articles = await page.$$eval(defaultSelector, anchors =>
        anchors.map(a => ({
          title: a.textContent.trim(),
          url: new URL(a.getAttribute("href"), location.href).href
        }))
      );

      result.push({ topic: t.topic, url: t.url, articles });
      console.log(`✅ Found ${articles.length} articles in ${t.topic}`);
    } catch (err) {
      console.warn(`⚠️ Skipping ${t.topic}: selector not found or timed out`);
      result.push({ topic: t.topic, url: t.url, articles: [], error: err.message });
    }
  }

  fs.writeFileSync("medlineplus_topic_articles.json", JSON.stringify(result, null, 2));
  console.log("✅ DONE. Topics crawled:", result.length);

  await browser.close();
})();

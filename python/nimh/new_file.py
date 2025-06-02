import json
import os
import re
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright

BASE_URL = "https://www.nimh.nih.gov"
START_URL = f"{BASE_URL}/health/topics"
OUTPUT_FILE = "nimh_step1_articles.json"


def clean_text(text):
    text = re.sub(r"[\t\n\r]+", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def run():
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print(f"🔍 Visiting start page: {START_URL}")
        page.goto(START_URL, wait_until="domcontentloaded")

        topic_links = page.eval_on_selector_all(
            "a[href^='/health/topics/']",
            "els => Array.from(new Set(els.map(a => a.href).filter(href => href.includes('/health/topics/') && !href.includes('#'))))"
        )

        print(f"🧠 Found {len(topic_links)} topic pages.")

        for link in topic_links:
            print("🔍 Visiting:", link)
            try:
                page.goto(link, wait_until="domcontentloaded", timeout=20000)
                page.wait_for_selector("h1", timeout=5000)

                title = page.query_selector("h1").inner_text().strip()

                blocks = page.query_selector_all("#main-content p, #main-content ul")
                content_parts = [clean_text(b.inner_text()) for b in blocks if len(b.inner_text().strip()) > 50]

                if not content_parts:
                    print("⚠️ No meaningful content, skipping...")
                    continue

                results.append({
                    "title": title,
                    "url": link,
                    "content": "\n\n".join(content_parts)
                })
            except Exception as e:
                print(f"❌ Failed to extract {link} | {e}")

        print(f"💾 Saving {len(results)} articles to {OUTPUT_FILE}")
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)

        browser.close()


if __name__ == "__main__":
    run()

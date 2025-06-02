#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MedlinePlus Recursive Crawler - Thu thập và xử lý dữ liệu từ MedlinePlus
- Crawl đệ quy để thu thập tất cả URL và sub-link
- Lấy category từ cấu trúc URL (website/category/*)
- Đầu ra JSON: title, url, content, category
- Tạo summary CSV và log tiến trình
- Thêm log cho việc loại bỏ URL trùng lặp
"""

import json
import re
import os
import time
import random
import csv
from urllib.parse import urlparse, urljoin
from playwright.sync_api import sync_playwright
from datetime import datetime
from collections import defaultdict, deque
import logging

# ===== CONFIGURATION =====
OUTPUT_DIR = "output"
FINAL_OUTPUT_FILE = os.path.join(OUTPUT_DIR, "medlineplus_final_processed_recursive.json")
LOG_FILE = os.path.join(OUTPUT_DIR, "url_collector_recursive.log")
CHECKPOINT_FILE = os.path.join(OUTPUT_DIR, "url_checkpoint_recursive.json")
DETAILED_REMOVAL_LOG = os.path.join(OUTPUT_DIR, "detailed_removal_recursive.log")
CATEGORY_STATS_CSV = os.path.join(OUTPUT_DIR, "category_statistics_recursive.csv")
PROCESSING_LOG = os.path.join(OUTPUT_DIR, "post_processing_recursive.log")
DUPLICATE_URL_LOG = os.path.join(OUTPUT_DIR, "duplicate_url_log_recursive.log")

# Crawl settings
BASE_DOMAIN = "https://medlineplus.gov"
START_URL = BASE_DOMAIN
SKIP_KEYWORDS = {
    "about", "policies", "disclaimer", "copyright", "accessibility", "privacy",
    "site", "subscribers", "blog", "medlineplus", "newsroom", "contact",
    "spanish", "rss", "feed", "sitemap", "search", "admin"
}
TRASH_URL_PATTERNS = [r'/about', r'/rss', r'/feed', r'/contact', r'/sitemap']
MAX_RETRIES = 2
CRAWL_DELAY = 5.0  # Giảm áp lực lên server
MAX_DEPTH = 3  # Giới hạn độ sâu crawl để tránh quá tải
REQUEST_TIMEOUT = 30000  # milliseconds
BATCH_SIZE = 100  # Lưu kết quả sau mỗi 100 bài

# Initialize output directory
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ==== STATS ====
stats = {
    'total_urls_collected': 0,
    'processed_articles': 0,
    'removed_articles': 0,
    'removed_by_trash_url': 0,
    'removed_by_duplicate': 0,
    'category_counts': defaultdict(int)
}

# ==== LOGGING FOR PROCESSING ====
def log_message(message):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {message}"
    print(line)
    with open(PROCESSING_LOG, "a", encoding="utf-8") as f:
        f.write(line + "\n")

def log_removal(title, url, reason):
    with open(DETAILED_REMOVAL_LOG, "a", encoding="utf-8") as f:
        f.write(f"Removed: {title} | URL: {url} | Reason: {reason}\n")

def log_duplicate(url):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(DUPLICATE_URL_LOG, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}] Duplicate URL removed: {url}\n")

# ==== FILTER TRASH URL ====
def is_trash_url(url):
    return any(re.search(p, url, flags=re.IGNORECASE) for p in TRASH_URL_PATTERNS)

# ==== EXTRACT CATEGORY FROM URL ====
def extract_category_from_url(url):
    parsed = urlparse(url)
    path_parts = [p for p in parsed.path.strip("/").split("/") if p]
    if len(path_parts) > 0:
        category = path_parts[0]
        category = re.sub(r'\.html?$', '', category, flags=re.IGNORECASE)
        category = re.sub(r'\.php$', '', category, flags=re.IGNORECASE)
        category = re.sub(r'[^a-zA-Z0-9\-_\s]', '', category)
        category = re.sub(r'\s+', '-', category)
        return category.lower().strip('-')
    return "general"

# ==== SAVE CATEGORY STATS ====
def save_category_statistics():
    sorted_cats = sorted(stats['category_counts'].items(), key=lambda x: x[1], reverse=True)
    with open(CATEGORY_STATS_CSV, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Category', 'Count'])
        for cat, count in sorted_cats:
            writer.writerow([cat, count])
        writer.writerow(['TOTAL', stats['processed_articles']])
    log_message(f"📊 Saved category stats to {CATEGORY_STATS_CSV}")

class URLCollector:
    def __init__(self):
        self.visited_urls = set()
        self.results = []
        self.failed_urls = []
        self.browser = None
        self.context = None
        self.load_checkpoint()

    def load_checkpoint(self):
        if os.path.exists(CHECKPOINT_FILE):
            try:
                with open(CHECKPOINT_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                self.visited_urls = set(data.get("visited_urls", []))
                logger.info(f"📂 Loaded checkpoint with {len(self.visited_urls)} visited URLs")
            except Exception as e:
                logger.error(f"❌ Error loading checkpoint: {e}")

    def is_valid_url(self, url):
        if not url or not url.startswith(BASE_DOMAIN):
            return False
        if '/spanish/' in url.lower():
            return False
        parsed = urlparse(url)
        path = parsed.path.lower().strip("/")
        if path.endswith((".pdf", ".jpg", ".png", ".gif", ".css", ".js", ".xml")):
            return False
        path_parts = path.split("/")
        if any(keyword in path_parts for keyword in SKIP_KEYWORDS):
            return False
        return True

    def setup_browser(self):
        try:
            self.playwright = sync_playwright().start()
            self.browser = self.playwright.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-dev-shm-usage']
            )
            self.context = self.browser.new_context()
            logger.info("✅ Browser initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize browser: {e}")
            raise

    def cleanup(self):
        try:
            if self.context:
                self.context.close()
            if self.browser and hasattr(self.browser, 'is_connected') and self.browser.is_connected():
                self.browser.close()
            if hasattr(self, 'playwright'):
                try:
                    self.playwright.stop()
                except:
                    pass
            logger.info("✅ Browser cleanup completed")
        except Exception as e:
            logger.warning(f"⚠️ Error during cleanup, but continuing: {e}")

    def extract_page_content(self, page):
        try:
            content_elements = page.query_selector_all(
                "article p, .main-content p, main p, article div, #topic-summary p"
            )
            content_parts = [el.inner_text().strip() for el in content_elements if el.inner_text().strip()]
            content = "\n".join(content_parts)
            return content if content else "No content available."
        except Exception as e:
            logger.error(f"❌ Error extracting content: {e}")
            return "Failed to extract content."

    def extract_links(self, page, base_url):
        try:
            links = page.query_selector_all("a[href]")
            urls = set()
            for link in links:
                href = link.get_attribute("href")
                if href:
                    absolute_url = urljoin(base_url, href)
                    if self.is_valid_url(absolute_url) and absolute_url not in self.visited_urls:
                        urls.add(absolute_url)
                    elif absolute_url in self.visited_urls:
                        log_duplicate(absolute_url)
                        stats['removed_by_duplicate'] += 1
            return list(urls)
        except Exception as e:
            logger.error(f"❌ Error extracting links: {e}")
            return []

    def process_article(self, url, depth):
        page = None
        try:
            page = self.context.new_page()
            page.goto(url, wait_until="domcontentloaded", timeout=REQUEST_TIMEOUT)
            title = page.title().strip() or "Untitled"
            content = self.extract_page_content(page)
            category = extract_category_from_url(url)
            article = {
                'title': title,
                'url': url,
                'content': content,
                'category': category
            }
            new_urls = []
            if depth < MAX_DEPTH:
                new_urls = self.extract_links(page, url)
            if not is_trash_url(url):
                stats['processed_articles'] += 1
                stats['category_counts'][category] += 1
                return article, new_urls
            else:
                log_removal(title, url, "trash_url")
                stats['removed_articles'] += 1
                stats['removed_by_trash_url'] += 1
                return None, new_urls
        except Exception as e:
            logger.error(f"❌ Error processing {url}: {e}")
            self.failed_urls.append((url, depth))
            return None, []
        finally:
            if page:
                page.close()

    def crawl(self):
        log_message("🚀 Starting recursive URL collection and processing from MedlinePlus")
        self.setup_browser()

        try:
            url_queue = deque([(START_URL, 0)])
            self.visited_urls.add(START_URL)

            while url_queue:
                current_url, depth = url_queue.popleft()
                logger.info(f"📍 Crawling: {current_url} (Depth: {depth})")

                result, new_urls = self.process_article(current_url, depth)
                if result:
                    self.results.append(result)
                    stats['total_urls_collected'] += 1
                    logger.info(f"✅ Processed: {result['title']}")

                for new_url in new_urls:
                    if new_url not in self.visited_urls:
                        self.visited_urls.add(new_url)
                        url_queue.append((new_url, depth + 1))

                if len(self.results) % BATCH_SIZE == 0 and len(self.results) > 0:
                    self.save_results()
                    self.save_checkpoint()
                    log_message(f"📊 Progress: {len(self.results)} articles processed")

                time.sleep(CRAWL_DELAY + random.uniform(0, 0.5))

            if self.failed_urls:
                for retry in range(MAX_RETRIES):
                    log_message(f"🔁 Retry {retry + 1}: {len(self.failed_urls)} articles")
                    temp_failed = []
                    for url, depth in self.failed_urls:
                        result, new_urls = self.process_article(url, depth)
                        if result:
                            self.results.append(result)
                            stats['total_urls_collected'] += 1
                            logger.info(f"✅ Retried: {result['title']}")
                            for new_url in new_urls:
                                if new_url not in self.visited_urls:
                                    self.visited_urls.add(new_url)
                                    url_queue.append((new_url, depth + 1))
                        else:
                            temp_failed.append((url, depth))
                        time.sleep(CRAWL_DELAY + random.uniform(0, 0.5))
                    self.failed_urls = temp_failed
                    if not self.failed_urls:
                        break

            self.results.sort(key=lambda x: x['title'])
            self.save_results()
            self.save_checkpoint()
            save_category_statistics()

            log_message(f"🏁 Collection and processing completed!")
            log_message(f"📊 Statistics:")
            log_message(f"   - Total URLs collected: {stats['total_urls_collected']}")
            log_message(f"   - Total articles processed: {stats['processed_articles']}")
            log_message(f"   - Total articles removed: {stats['removed_articles']} (by trash URL: {stats['removed_by_trash_url']}, by duplicate: {stats['removed_by_duplicate']})")
            log_message(f"   - Output saved to: {FINAL_OUTPUT_FILE}")
            if self.failed_urls:
                log_message(f"❌ Final failed URLs ({len(self.failed_urls)}):")
                for url, depth in self.failed_urls:
                    log_message(f"   - {url} (Depth: {depth})")

        except Exception as e:
            logger.error(f"❌ Unexpected error: {e}")
        finally:
            self.cleanup()

    def save_results(self):
        try:
            with open(FINAL_OUTPUT_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.results, f, indent=2, ensure_ascii=False)
            log_message(f"💾 Saved {len(self.results)} articles to {FINAL_OUTPUT_FILE}")
        except Exception as e:
            logger.error(f"❌ Error saving results: {e}")

    def save_checkpoint(self):
        try:
            checkpoint_data = {
                "visited_urls": list(self.visited_urls),
                "results_count": len(self.results),
                "timestamp": datetime.now().isoformat()
            }
            with open(CHECKPOINT_FILE, 'w', encoding='utf-8') as f:
                json.dump(checkpoint_data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"❌ Error saving checkpoint: {e}")

def main():
    collector = URLCollector()
    collector.crawl()

if __name__ == "__main__":
    main()
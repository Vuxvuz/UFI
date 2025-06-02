#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
crawler.py

MedlinePlus Recursive Crawler (Phần 1):
- Cào đệ quy (max_depth=3) để thu thập: title, url, content, category
- Đồng thời giới hạn 5 page cùng lúc (semaphore concurrency = 5)
- Lưu kết quả tạm thời (checkpoint) sau mỗi 100 record
- Cuối cùng ghi toàn bộ ra file JSON (“medlineplus_raw_recursive.json”)
- Log chi tiết tiến trình vào “url_collector_recursive.log”
"""

import os
import re
import json
import time
import random
import logging
from datetime import datetime
from urllib.parse import urlparse, urljoin
from collections import defaultdict, deque
from playwright.sync_api import sync_playwright
from threading import Semaphore, Lock

# ===== CẤU HÌNH =====
OUTPUT_DIR = "output"
RAW_OUTPUT_FILE = os.path.join(OUTPUT_DIR, "medlineplus_raw_recursive.json")
LOG_FILE = os.path.join(OUTPUT_DIR, "url_collector_recursive.log")
CHECKPOINT_FILE = os.path.join(OUTPUT_DIR, "url_checkpoint_recursive.json")
CATEGORY_STATS_CSV = os.path.join(OUTPUT_DIR, "category_statistics_recursive.csv")

BASE_DOMAIN = "https://medlineplus.gov"
START_URL = BASE_DOMAIN
SKIP_KEYWORDS = {
    "about", "policies", "disclaimer", "copyright", "accessibility", "privacy",
    "site", "subscribers", "blog", "medlineplus", "newsroom", "contact",
    "spanish", "rss", "feed", "sitemap", "search", "admin"
}
TRASH_URL_PATTERNS = [r'/about', r'/rss', r'/feed', r'/contact', r'/sitemap']
MAX_DEPTH = 3
CRAWL_DELAY = 1.0     # delay giữa mỗi request (giảm áp lực)
REQUEST_TIMEOUT = 30000
BATCH_SIZE = 100      # Lưu checkpoint mỗi 100 record
CONCURRENCY_LIMIT = 5 # đồng thời tối đa 5 page

# ===== Khởi tạo thư mục & logging =====
os.makedirs(OUTPUT_DIR, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ===== Thống kê =====
stats = {
    'total_urls_collected': 0,
    'processed_articles': 0,
    'removed_trash_url': 0,
    'category_counts': defaultdict(int)
}

# ===== Hàm logging phụ trợ =====
def log_message(msg: str):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}"
    print(line)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")

def log_removal(title: str, url: str, reason: str):
    with open(os.path.join(OUTPUT_DIR, "detailed_removal_recursive.log"), "a", encoding="utf-8") as f:
        f.write(f"Removed: {title} | URL: {url} | Reason: {reason}\n")

# ===== Kiểm tra URL rác (trash) =====
def is_trash_url(url: str) -> bool:
    return any(re.search(p, url, flags=re.IGNORECASE) for p in TRASH_URL_PATTERNS)

# ===== Lấy category từ URL =====
def extract_category_from_url(url: str) -> str:
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

# ===== Lưu thống kê category =====
def save_category_statistics():
    sorted_cats = sorted(stats['category_counts'].items(), key=lambda x: x[1], reverse=True)
    with open(CATEGORY_STATS_CSV, 'w', encoding='utf-8', newline='') as f:
        import csv
        writer = csv.writer(f)
        writer.writerow(['Category', 'Count'])
        for cat, count in sorted_cats:
            writer.writerow([cat, count])
        writer.writerow(['TOTAL', stats['processed_articles']])
    log_message(f"📊 Saved category stats to {CATEGORY_STATS_CSV}")

# ===== Class URLCollector =====
class URLCollector:
    def __init__(self):
        self.visited_urls = set()
        self.results = []
        self.failed_urls = []
        self.semaphore = Semaphore(CONCURRENCY_LIMIT)
        self.lock = Lock()
        self.load_checkpoint()

    def load_checkpoint(self):
        if os.path.exists(CHECKPOINT_FILE):
            try:
                with open(CHECKPOINT_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                self.visited_urls = set(data.get("visited_urls", []))
                self.results = data.get("results", [])
                log_message(f"📂 Loaded checkpoint: {len(self.visited_urls)} URLs, {len(self.results)} results")
            except Exception as e:
                logger.error(f"❌ Error loading checkpoint: {e}")

    def save_checkpoint(self):
        try:
            checkpoint_data = {
                "visited_urls": list(self.visited_urls),
                "results": self.results
            }
            with open(CHECKPOINT_FILE, 'w', encoding='utf-8') as f:
                json.dump(checkpoint_data, f, indent=2, ensure_ascii=False)
            log_message("💾 Saved checkpoint.")
        except Exception as e:
            logger.error(f"❌ Error saving checkpoint: {e}")

    def save_results(self):
        try:
            with open(RAW_OUTPUT_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.results, f, indent=2, ensure_ascii=False)
            log_message(f"💾 Saved {len(self.results)} articles to {RAW_OUTPUT_FILE}")
        except Exception as e:
            logger.error(f"❌ Error saving results: {e}")

    def is_valid_url(self, url: str) -> bool:
        if not url.startswith(BASE_DOMAIN):
            return False
        parsed = urlparse(url)
        path = parsed.path.lower().strip("/")
        if path.endswith((".pdf", ".jpg", ".png", ".gif", ".css", ".js", ".xml")):
            return False
        parts = path.split("/")
        if any(kw in parts for kw in SKIP_KEYWORDS):
            return False
        if '/spanish/' in url.lower():
            return False
        return True

    def extract_page_content(self, page) -> str:
        try:
            content_elements = page.query_selector_all(
                "article p, .main-content p, main p, article div, #topic-summary p"
            )
            content_parts = []
            for el in content_elements:
                txt = el.inner_text().strip()
                if txt:
                    content_parts.append(txt)
            return "\n".join(content_parts) if content_parts else "No content available."
        except Exception as e:
            logger.error(f"❌ Error extracting content: {e}")
            return "Failed to extract content."

    def extract_links(self, page, base_url) -> list:
        urls = []
        try:
            link_elements = page.query_selector_all("a[href]")
            for link in link_elements:
                href = link.get_attribute("href")
                if not href:
                    continue
                abs_url = urljoin(base_url, href)
                abs_url = abs_url.split('#')[0]  # bỏ phần anchor
                if self.is_valid_url(abs_url):
                    with self.lock:
                        if abs_url not in self.visited_urls:
                            urls.append(abs_url)
            return urls
        except Exception as e:
            logger.error(f"❌ Error extracting links: {e}")
            return []

    def process_article(self, context, url: str, depth: int):
        """
        - Mở page
        - Lấy title, content, category
        - Nếu depth < MAX_DEPTH: extract thêm links
        - Nếu URL là trash => bỏ, else: thêm vào results
        """
        page = None
        try:
            page = context.new_page()
            page.goto(url, wait_until="domcontentloaded", timeout=REQUEST_TIMEOUT)
            title = page.title().strip() or "Untitled"
            content = self.extract_page_content(page)
            category = extract_category_from_url(url)

            # Nếu rác: log và skip
            if is_trash_url(url):
                log_removal(title, url, "trash_url")
                with self.lock:
                    stats['removed_trash_url'] += 1
                new_links = self.extract_links(page, url) if depth < MAX_DEPTH else []
                return None, new_links

            # Khỏi rác: đóng gói kết quả
            article_obj = {
                'title': title,
                'url': url,
                'content': content,
                'category': category
            }
            new_links = self.extract_links(page, url) if depth < MAX_DEPTH else []

            with self.lock:
                self.results.append(article_obj)
                stats['total_urls_collected'] += 1
                stats['processed_articles'] += 1
                stats['category_counts'][category] += 1

            log_message(f"✅ [{depth}] Processed: {title}")
            return article_obj, new_links

        except Exception as e:
            logger.error(f"❌ Error processing {url}: {e}")
            with self.lock:
                self.failed_urls.append((url, depth))
            return None, []
        finally:
            if page:
                page.close()

    def crawl(self):
        """
        Dùng BFS (deque) để cào đệ quy, độ sâu tối đa = MAX_DEPTH
        Giới hạn đồng thời 5 browser pages.
        """
        log_message("🚀 Starting crawl…")
        playwright = sync_playwright().start()
        browser = playwright.chromium.launch(headless=True, args=['--no-sandbox'])
        context = browser.new_context()
        queue = deque([(START_URL, 0)])
        self.visited_urls.add(START_URL)

        try:
            while queue:
                url, depth = queue.popleft()
                self.semaphore.acquire()
                try:
                    article, new_urls = self.process_article(context, url, depth)
                    if new_urls:
                        for u in new_urls:
                            with self.lock:
                                if u not in self.visited_urls:
                                    self.visited_urls.add(u)
                                    queue.append((u, depth + 1))
                finally:
                    self.semaphore.release()
                    time.sleep(CRAWL_DELAY + random.uniform(0, 0.5))

                if len(self.results) % BATCH_SIZE == 0 and len(self.results) > 0:
                    self.save_results()
                    self.save_checkpoint()
                    log_message(f"📊 Progress: {len(self.results)} articles processed so far")

            log_message("✅ Crawl finished, retrying failed URLs…")
            for retry in range(2):
                if not self.failed_urls:
                    break
                log_message(f"🔁 Retry {retry+1} for {len(self.failed_urls)} failed URLs")
                temp_failed = []
                for u, d in self.failed_urls:
                    self.semaphore.acquire()
                    try:
                        article, new_urls = self.process_article(context, u, d)
                        if new_urls:
                            for nu in new_urls:
                                with self.lock:
                                    if nu not in self.visited_urls:
                                        self.visited_urls.add(nu)
                                        queue.append((nu, d+1))
                    finally:
                        self.semaphore.release()
                        time.sleep(CRAWL_DELAY + random.uniform(0, 0.5))

                    if article is None:
                        temp_failed.append((u, d))

                self.failed_urls = temp_failed

            self.results.sort(key=lambda x: x['title'])
            self.save_results()
            self.save_checkpoint()
            save_category_statistics()

            log_message("🏁 All done!")
            log_message(f"📊 Stats: total collected={stats['total_urls_collected']}, processed={stats['processed_articles']}, removed_trash={stats['removed_trash_url']}")
        except Exception as e:
            logger.error(f"❌ Unexpected error during crawl: {e}")
        finally:
            context.close()
            browser.close()
            playwright.stop()

def main():
    collector = URLCollector()
    collector.crawl()

if __name__ == "__main__":
    main()

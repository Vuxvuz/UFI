import json
import csv
import re
import os
import time
import logging
from urllib.parse import urljoin, urlparse
from playwright.sync_api import sync_playwright
from collections import Counter, defaultdict

# Cấu hình logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# File cấu hình đầu ra
OUTPUT_JSON = "finalcrawl_step2_output.json"
ERROR_LOG = "crawl_errors.csv"
VISITED_LOG = "visited_links.csv"
CATEGORY_LOG = "category_log.csv"
INPUT_FILE = "nimh_step1_articles.json"

# Cấu hình
BASE_URL = "https://www.nimh.nih.gov"
TIMEOUT = 30000  # 30 giây
DELAY_BETWEEN_REQUESTS = 1  # 1 giây delay giữa các request

class WebCrawler:
    def __init__(self):
        self.visited = set()
        self.results = []
        self.errors = []
        self.visited_log = []
        self.category_map = {}
        
    def clean_text(self, text):
        """Làm sạch văn bản"""
        if not text:
            return ""
        # Loại bỏ ký tự xuống dòng, tab và khoảng trắng thừa
        text = re.sub(r"[\t\n\r]+", " ", text)
        text = re.sub(r"\s+", " ", text)
        return text.strip()
    
    def is_valid_detail_url(self, url):
        """Kiểm tra URL có hợp lệ không"""
        try:
            parsed = urlparse(url)
            path_parts = parsed.path.strip("/").split("/")
            return (len(path_parts) >= 2 and 
                   parsed.netloc == "www.nimh.nih.gov" and
                   "health" in parsed.path.lower())
        except Exception:
            return False
    
    def extract_detail_page(self, page, url, category):
        """Trích xuất nội dung từ trang chi tiết"""
        try:
            logger.info(f"Crawling: {url}")
            
            # Navigate to page với retry mechanism
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    page.goto(url, timeout=self.TIMEOUT, wait_until="domcontentloaded")
                    break
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise e
                    logger.warning(f"Retry {attempt + 1} for {url}: {str(e)}")
                    time.sleep(2)
            
            # Đợi trang load hoàn toàn
            page.wait_for_load_state("networkidle", timeout=10000)
            
            # Trích xuất title
            title = page.title()
            if not title:
                title_elem = page.query_selector("h1")
                title = title_elem.inner_text() if title_elem else "No Title"
            
            # Trích xuất content từ nhiều selector khác nhau
            content = ""
            content_selectors = [
                "article",
                ".content-area", 
                ".main-content",
                ".page-content",
                "main",
                "#content"
            ]
            
            for selector in content_selectors:
                content_elem = page.query_selector(selector)
                if content_elem:
                    content = self.clean_text(content_elem.inner_text())
                    break
            
            # Nếu không tìm thấy content, lấy toàn bộ body
            if not content:
                body_elem = page.query_selector("body")
                if body_elem:
                    content = self.clean_text(body_elem.inner_text())
            
            # Đảm bảo có nội dung trước khi lưu
            if content and len(content.strip()) > 50:  # Ít nhất 50 ký tự
                result = {
                    "title": self.clean_text(title),
                    "url": url,
                    "content": content,
                    "category": category if category else "unknown"
                }
                self.results.append(result)
                self.visited_log.append({"url": url, "status": "success"})
                logger.info(f"✅ Successfully crawled: {title[:50]}...")
            else:
                logger.warning(f"⚠️ No sufficient content found for: {url}")
                self.errors.append({
                    "url": url, 
                    "error": "No sufficient content found",
                    "category": category
                })
                
        except Exception as e:
            error_msg = str(e)
            logger.error(f"❌ Error crawling {url}: {error_msg}")
            self.errors.append({
                "url": url, 
                "error": error_msg,
                "category": category
            })
    
    def load_input_data(self):
        """Đọc file đầu vào từ bước 1"""
        try:
            if not os.path.exists(INPUT_FILE):
                logger.error(f"❌ Input file not found: {INPUT_FILE}")
                return []
                
            with open(INPUT_FILE, 'r', encoding='utf-8') as file:
                articles = json.load(file)
                
            logger.info(f"✅ Loaded {len(articles)} articles from {INPUT_FILE}")
            return articles
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON in input file: {e}")
            return []
        except Exception as e:
            logger.error(f"❌ Error reading input file: {e}")
            return []
    
    def save_results(self):
        """Lưu kết quả vào các file output"""
        try:
            # Lưu kết quả chính vào JSON
            with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
                json.dump(self.results, f, indent=2, ensure_ascii=False)
            logger.info(f"✅ Saved {len(self.results)} results to {OUTPUT_JSON}")
            
            # Lưu log lỗi
            if self.errors:
                with open(ERROR_LOG, 'w', newline='', encoding='utf-8') as f:
                    fieldnames = ['url', 'error', 'category']
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    writer.writerows(self.errors)
                logger.info(f"✅ Saved {len(self.errors)} errors to {ERROR_LOG}")
            
            # Lưu log visited
            if self.visited_log:
                with open(VISITED_LOG, 'w', newline='', encoding='utf-8') as f:
                    fieldnames = ['url', 'status']
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    writer.writerows(self.visited_log)
                logger.info(f"✅ Saved visited log to {VISITED_LOG}")
            
            # Thống kê danh mục
            if self.results:
                category_stats = Counter(result['category'] for result in self.results)
                with open(CATEGORY_LOG, 'w', newline='', encoding='utf-8') as f:
                    fieldnames = ['category', 'count']
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    for category, count in category_stats.items():
                        writer.writerow({"category": category, "count": count})
                logger.info(f"✅ Saved category statistics to {CATEGORY_LOG}")
                
        except Exception as e:
            logger.error(f"❌ Error saving results: {e}")
    
    def run(self):
        """Chạy toàn bộ quy trình crawling"""
        logger.info("🚀 Starting web crawling process...")
        
        # Bước 1: Đọc dữ liệu đầu vào
        articles = self.load_input_data()
        if not articles:
            logger.error("❌ No input data found. Exiting...")
            return
        
        # Cấu hình Playwright
        try:
            with sync_playwright() as p:
                # Khởi tạo browser với cấu hình tối ưu
                browser = p.chromium.launch(
                    headless=True,
                    args=[
                        '--no-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu',
                        '--disable-extensions'
                    ]
                )
                
                context = browser.new_context(
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                )
                
                page = context.new_page()
                
                # Bước 2: Crawl từng bài viết
                total_articles = len(articles)
                for i, article in enumerate(articles, 1):
                    try:
                        url = article.get('url', '').strip()
                        category = article.get('category', 'unknown')
                        
                        if not url:
                            logger.warning(f"⚠️ Article {i}/{total_articles}: No URL found")
                            continue
                            
                        if url in self.visited:
                            logger.info(f"⏭️ Article {i}/{total_articles}: Already visited {url}")
                            continue
                            
                        self.visited.add(url)
                        logger.info(f"🔄 Processing article {i}/{total_articles}: {url}")
                        
                        # Crawl trang
                        self.extract_detail_page(page, url, category)
                        
                        # Delay giữa các request để tránh bị block
                        if i < total_articles:
                            time.sleep(DELAY_BETWEEN_REQUESTS)
                            
                    except Exception as e:
                        logger.error(f"❌ Error processing article {i}: {e}")
                        continue
                
                browser.close()
                
        except Exception as e:
            logger.error(f"❌ Browser error: {e}")
            return
        
        # Bước 3: Lưu kết quả
        self.save_results()
        
        # Thống kê cuối cùng
        logger.info("="*50)
        logger.info("📊 CRAWLING SUMMARY")
        logger.info("="*50)
        logger.info(f"✅ Total articles processed: {len(articles)}")
        logger.info(f"✅ Successfully crawled: {len(self.results)}")
        logger.info(f"❌ Errors encountered: {len(self.errors)}")
        
        if self.results:
            category_stats = Counter(result['category'] for result in self.results)
            logger.info("📈 Results by category:")
            for category, count in category_stats.most_common():
                logger.info(f"   - {category}: {count}")
        
        logger.info("🎉 Crawling process completed!")

def main():
    """Hàm main"""
    crawler = WebCrawler()
    crawler.TIMEOUT = TIMEOUT
    crawler.run()

if __name__ == '__main__':
    main()
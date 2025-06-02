#!/usr/bin/env python3
"""
Verywell Mind Crawler - Phase 1: Thu thập danh sách các chủ đề
"""

import json
import logging
import asyncio
from urllib.parse import urljoin, urlparse
from playwright.async_api import async_playwright
import time

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('crawl_phase1.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class VerywellMindCrawler:
    def __init__(self):
        self.base_url = 'https://www.verywellmind.com/'
        self.results = []
        self.stats = {
            'total_items': 0,
            'tag_items': 0,
            'alphabetical_items': 0,
            'errors': 0,
            'start_time': None,
            'end_time': None
        }

    async def crawl_categories(self):
        """Thu thập tất cả các danh mục từ trang chủ"""
        logger.info("🚀 Bắt đầu thu thập danh sách chủ đề từ Verywell Mind")
        self.stats['start_time'] = time.time()
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            try:
                logger.info(f"📖 Truy cập trang chủ: {self.base_url}")
                await page.goto(self.base_url, wait_until='domcontentloaded', timeout=30000)
                
                # Thu thập các chủ đề theo tag
                await self._crawl_tag_categories(page)
                
                # Thu thập các chủ đề theo bảng chữ cái
                await self._crawl_alphabetical_categories(page)
                
            except Exception as e:
                logger.error(f"❌ Lỗi khi truy cập trang chủ: {str(e)}")
                self.stats['errors'] += 1
            finally:
                await browser.close()
        
        self.stats['end_time'] = time.time()
        self._save_results()
        self._print_summary()

    async def _crawl_tag_categories(self, page):
        """Thu thập các chủ đề dựa trên tag"""
        logger.info("🏷️  Thu thập các chủ đề theo tag...")
        
        try:
            # Tìm các phần tử tag
            tag_selectors = [
                '[class*="grid-nav-list"] li a',
                '.grid-nav-list li a',
                '[data-testid="grid-nav"] li a'
            ]
            
            tag_items = []
            for selector in tag_selectors:
                try:
                    items = await page.query_selector_all(selector)
                    if items:
                        tag_items = items
                        logger.info(f"✅ Tìm thấy {len(items)} tag items với selector: {selector}")
                        break
                except:
                    continue
            
            if not tag_items:
                logger.warning("⚠️ Không tìm thấy tag items, thử selector khác...")
                # Fallback selectors
                fallback_selectors = [
                    'nav a[href*="/"]',
                    '.nav-list a',
                    '[role="navigation"] a'
                ]
                for selector in fallback_selectors:
                    try:
                        items = await page.query_selector_all(selector)
                        if len(items) > 5:  # Chỉ lấy nếu có đủ items
                            tag_items = items[:20]  # Giới hạn số lượng
                            logger.info(f"✅ Sử dụng fallback selector: {selector}")
                            break
                    except:
                        continue
            
            for item in tag_items:
                try:
                    # Lấy title từ nhiều nguồn khác nhau
                    title = None
                    title_selectors = ['h3', 'h2', 'span', '.title']
                    
                    for sel in title_selectors:
                        try:
                            title_elem = await item.query_selector(sel)
                            if title_elem:
                                title = await title_elem.text_content()
                                title = self._clean_text(title)
                                if title:
                                    break
                        except:
                            continue
                    
                    # Nếu không tìm thấy title trong các element con, lấy text của chính item
                    if not title:
                        title = await item.text_content()
                        title = self._clean_text(title)
                    
                    # Lấy URL
                    url = await item.get_attribute('href')
                    if url:
                        url = urljoin(self.base_url, url)
                        
                        # Validate URL
                        parsed = urlparse(url)
                        if parsed.netloc and 'verywellmind.com' in parsed.netloc:
                            self.results.append({
                                'type': 'tag',
                                'title': title or 'Untitled',
                                'url': url,
                                'category': self._determine_category(title, url)
                            })
                            
                            self.stats['tag_items'] += 1
                            logger.info(f"✅ Thu thập tag: {title} -> {url}")
                        else:
                            logger.warning(f"⚠️ URL không hợp lệ: {url}")
                    
                except Exception as e:
                    logger.warning(f"⚠️ Bỏ qua một tag item: {str(e)}")
                    self.stats['errors'] += 1
            
            logger.info(f"🏷️  Hoàn thành thu thập {self.stats['tag_items']} tag items")
            
        except Exception as e:
            logger.error(f"❌ Lỗi khi thu thập tag categories: {str(e)}")
            self.stats['errors'] += 1

    async def _crawl_alphabetical_categories(self, page):
        """Thu thập các chủ đề theo bảng chữ cái"""
        logger.info("🔤 Thu thập các chủ đề theo bảng chữ cái...")
        
        try:
            alpha_selectors = [
                '[class*="alphabetical-nav-list"] li a',
                '.alphabetical-nav-list li a',
                '[data-testid="alphabetical-nav"] li a'
            ]
            
            alpha_items = []
            for selector in alpha_selectors:
                try:
                    items = await page.query_selector_all(selector)
                    if items:
                        alpha_items = items
                        logger.info(f"✅ Tìm thấy {len(items)} alphabetical items")
                        break
                except:
                    continue
            
            for item in alpha_items:
                try:
                    letter = await item.text_content()
                    letter = self._clean_text(letter)
                    
                    url = await item.get_attribute('href')
                    if url:
                        if not url.startswith('http'):
                            url = urljoin(self.base_url, url)
                        
                        self.results.append({
                            'type': 'alphabetical',
                            'title': f"Topics - {letter}",
                            'url': url,
                            'category': 'alphabetical'
                        })
                        
                        self.stats['alphabetical_items'] += 1
                        logger.info(f"✅ Thu thập alphabetical: {letter} -> {url}")
                
                except Exception as e:
                    logger.warning(f"⚠️ Bỏ qua một alphabetical item: {str(e)}")
                    self.stats['errors'] += 1
            
            logger.info(f"🔤 Hoàn thành thu thập {self.stats['alphabetical_items']} alphabetical items")
            
        except Exception as e:
            logger.error(f"❌ Lỗi khi thu thập alphabetical categories: {str(e)}")
            self.stats['errors'] += 1

    def _clean_text(self, text):
        """Làm sạch text, xử lý ký tự đặc biệt"""
        if not text:
            return ""
        
        # Xử lý các ký tự đặc biệt
        text = text.replace('\t', ' ')  # Tab thành space
        text = text.replace('\n', ' ')  # Newline thành space
        text = text.replace('\r', ' ')  # Carriage return thành space
        text = text.replace('\u00a0', ' ')  # Non-breaking space
        
        # Loại bỏ khoảng trắng thừa
        text = ' '.join(text.split())
        
        return text.strip()

    def _determine_category(self, title, url):
        """Xác định category dựa trên title và URL"""
        if not title and not url:
            return 'unknown'
        
        text_to_check = f"{title} {url}".lower()
        
        categories = {
            'therapy': ['therapy', 'treatment', 'counseling', 'psychotherapy'],
            'conditions': ['conditions', 'disorders', 'symptoms', 'diagnosis'],
            'psychology': ['psychology', 'behavior', 'cognitive', 'mental'],
            'wellness': ['wellness', 'self-care', 'healthy', 'lifestyle'],
            'relationships': ['relationships', 'family', 'couples', 'social'],
            'living': ['living', 'daily', 'work', 'stress']
        }
        
        for category, keywords in categories.items():
            if any(keyword in text_to_check for keyword in keywords):
                return category
        
        return 'general'

    def _save_results(self):
        """Lưu kết quả vào file JSON"""
        self.stats['total_items'] = len(self.results)
        
        output_data = {
            'metadata': {
                'crawl_date': time.strftime('%Y-%m-%d %H:%M:%S'),
                'total_items': self.stats['total_items'],
                'stats': self.stats
            },
            'data': self.results
        }
        
        try:
            with open('verywellmind_data.json', 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=2, ensure_ascii=False)
            logger.info(f"💾 Đã lưu {self.stats['total_items']} items vào verywellmind_data.json")
        except Exception as e:
            logger.error(f"❌ Lỗi khi lưu file: {str(e)}")

    def _print_summary(self):
        """In tóm tắt kết quả"""
        duration = self.stats['end_time'] - self.stats['start_time']
        
        logger.info("\n" + "="*60)
        logger.info("📊 TÓM TẮT KẾT QUẢ CRAWL PHASE 1")
        logger.info("="*60)
        logger.info(f"⏱️  Thời gian thực hiện: {duration:.2f} giây")
        logger.info(f"📈 Tổng số items: {self.stats['total_items']}")
        logger.info(f"🏷️  Tag items: {self.stats['tag_items']}")
        logger.info(f"🔤 Alphabetical items: {self.stats['alphabetical_items']}")
        logger.info(f"❌ Số lỗi: {self.stats['errors']}")
        
        # Thống kê theo category
        category_stats = {}
        for item in self.results:
            cat = item.get('category', 'unknown')
            category_stats[cat] = category_stats.get(cat, 0) + 1
        
        logger.info("\n📊 PHÂN BỐ THEO CATEGORY:")
        for category, count in sorted(category_stats.items()):
            logger.info(f"   {category}: {count} items")
        
        logger.info("="*60)

async def main():
    crawler = VerywellMindCrawler()
    await crawler.crawl_categories()

if __name__ == "__main__":
    asyncio.run(main())
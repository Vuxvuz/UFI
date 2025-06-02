#!/usr/bin/env python3
"""
Verywell Mind Crawler - Phase 2: Thu thập nội dung chi tiết từ các bài viết
"""

import json
import logging
import asyncio
import aiofiles
import re
import os
from urllib.parse import urljoin, urlparse
from playwright.async_api import async_playwright
import time
from pathlib import Path

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('crawl_phase2.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ContentCrawler:
    def __init__(self):
        self.input_file = './verywellmind_data.json'
        self.output_json = './verywellmind_full_content.json'
        self.output_text_dir = './verywellmind_texts'
        self.concurrency = 5
        self.results = []
        self.stats = {
            'total_main_pages': 0,
            'total_sub_articles': 0,
            'successful_pages': 0,
            'failed_pages': 0,
            'start_time': None,
            'end_time': None,
            'category_stats': {}
        }

    async def crawl_content(self):
        """Thu thập nội dung chi tiết từ tất cả các trang"""
        logger.info("🚀 Bắt đầu Phase 2: Thu thập nội dung chi tiết")
        self.stats['start_time'] = time.time()
        
        # Tạo thư mục output
        Path(self.output_text_dir).mkdir(exist_ok=True)
        
        # Đọc dữ liệu input
        input_data = await self._load_input_data()
        if not input_data:
            return
        
        # Crawl với concurrency control
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            )
            
            # Tạo semaphore để control concurrency
            semaphore = asyncio.Semaphore(self.concurrency)
            
            # Tạo tasks cho tất cả main pages
            tasks = [
                self._process_main_page(context, item, semaphore) 
                for item in input_data
            ]
            
            # Chạy tất cả tasks
            await asyncio.gather(*tasks, return_exceptions=True)
            
            await browser.close()
        
        self.stats['end_time'] = time.time()
        await self._save_results()
        self._print_summary()

    async def _load_input_data(self):
        """Đọc dữ liệu từ file input"""
        try:
            async with aiofiles.open(self.input_file, 'r', encoding='utf-8') as f:
                content = await f.read()
                data = json.loads(content)
                
                # Xử lý cả format cũ và mới
                if isinstance(data, dict) and 'data' in data:
                    input_data = data['data']
                else:
                    input_data = data
                
                self.stats['total_main_pages'] = len(input_data)
                logger.info(f"📖 Đã tải {len(input_data)} main pages từ {self.input_file}")
                return input_data
                
        except Exception as e:
            logger.error(f"❌ Không thể đọc file input {self.input_file}: {str(e)}")
            return None

    async def _process_main_page(self, context, item, semaphore):
        """Xử lý một main page và tất cả sub-articles của nó"""
        async with semaphore:
            page_title = item.get('title', 'Unknown')
            page_url = item.get('url', '')
            page_category = item.get('category', 'general')
            
            logger.info(f"🔍 Đang xử lý: {page_title} ({page_category})")
            
            page = await context.new_page()
            try:
                await page.goto(page_url, wait_until='domcontentloaded', timeout=30000)
                
                # Tìm tất cả các article links trong trang
                sub_links = await self._extract_article_links(page, page_url)
                logger.info(f"   📄 Tìm thấy {len(sub_links)} sub-articles")
                
                sub_articles = []
                for link in sub_links:
                    sub_content = await self._crawl_article_content(context, link, page_category)
                    if sub_content:
                        sub_articles.append(sub_content)
                
                # Lưu kết quả cho main page này
                result = {
                    'title': page_title,
                    'url': page_url,
                    'category': page_category,
                    'sub_articles': sub_articles,
                    'total_sub_articles': len(sub_articles)
                }
                
                self.results.append(result)
                self.stats['successful_pages'] += 1
                self.stats['total_sub_articles'] += len(sub_articles)
                
                # Cập nhật category stats
                if page_category not in self.stats['category_stats']:
                    self.stats['category_stats'][page_category] = {'pages': 0, 'articles': 0}
                self.stats['category_stats'][page_category]['pages'] += 1
                self.stats['category_stats'][page_category]['articles'] += len(sub_articles)
                
                logger.info(f"✅ Hoàn thành {page_title}: {len(sub_articles)} articles")
                
            except Exception as e:
                logger.error(f"❌ Lỗi khi xử lý {page_url}: {str(e)}")
                self.stats['failed_pages'] += 1
            finally:
                await page.close()

    async def _extract_article_links(self, page, base_url):
        """Trích xuất tất cả article links từ một trang"""
        try:
            # Tìm tất cả links trong trang
            all_links = await page.evaluate("""
                () => {
                    const links = Array.from(document.querySelectorAll('a[href]'));
                    return links.map(a => a.href).filter(href => 
                        href && 
                        href.startsWith('https://www.verywellmind.com') && 
                        !href.includes('#') &&
                        !href.includes('?') &&
                        href !== window.location.href
                    );
                }
            """)
            
            # Loại bỏ duplicates và filter
            unique_links = list(set(all_links))
            
            # Filter các link không phải article
            filtered_links = []
            for link in unique_links:
                if self._is_article_link(link):
                    filtered_links.append(link)
            
            return filtered_links[:50]  # Giới hạn số lượng để tránh quá tải
            
        except Exception as e:
            logger.warning(f"⚠️ Lỗi khi extract links: {str(e)}")
            return []

    def _is_article_link(self, url):
        """Kiểm tra xem URL có phải là article link không"""
        # Loại bỏ các URL không phải article
        exclude_patterns = [
            '/about-us/', '/privacy-policy/', '/terms-of-service/',
            '/newsletter/', '/contact/', '/careers/', '/advertise/',
            '/crisis-support/', '/review-board/', '/editorial-process/',
            '/authors/', '/fact-checking/', '/medical-review-board/'
        ]
        
        url_lower = url.lower()
        for pattern in exclude_patterns:
            if pattern in url_lower:
                return False
        
        # Chỉ lấy các URL có pattern như article
        article_patterns = [
            r'/[a-zA-Z0-9-]+\d+$',  # URL kết thúc bằng số (thường là article ID)
            r'/[a-zA-Z0-9-]+-\d+$',  # URL có pattern name-id
        ]
        
        for pattern in article_patterns:
            if re.search(pattern, url):
                return True
        
        # Nếu URL có độ dài hợp lý và chứa từ khóa article
        if len(url.split('/')) >= 4 and any(keyword in url_lower for keyword in [
            'anxiety', 'depression', 'stress', 'therapy', 'mental', 'health',
            'psychology', 'wellness', 'condition', 'symptom', 'treatment'
        ]):
            return True
        
        return False

    async def _crawl_article_content(self, context, url, category):
        """Thu thập nội dung từ một article"""
        page = await context.new_page()
        try:
            logger.info(f"   ↪ Đang crawl: {url}")
            await page.goto(url, wait_until='domcontentloaded', timeout=30000)
            
            # Trích xuất nội dung article
            content_data = await page.evaluate("""
                () => {
                    // Tìm element chứa nội dung chính
                    const selectors = [
                        'article',
                        '.article-content',
                        '.content',
                        '[data-testid="article-content"]',
                        '.post-content',
                        'main'
                    ];
                    
                    let content = '';
                    let title = '';
                    
                    // Lấy title
                    const titleSelectors = ['h1', '.article-title', '.post-title', 'title'];
                    for (const sel of titleSelectors) {
                        const elem = document.querySelector(sel);
                        if (elem && elem.textContent.trim()) {
                            title = elem.textContent.trim();
                            break;
                        }
                    }
                    
                    // Lấy content
                    for (const sel of selectors) {
                        const elem = document.querySelector(sel);
                        if (elem) {
                            content = elem.innerText || elem.textContent || '';
                            if (content.length > 200) {  // Chỉ lấy nếu có đủ content
                                break;
                            }
                        }
                    }
                    
                    // Fallback: lấy từ body
                    if (!content || content.length < 200) {
                        content = document.body.innerText || document.body.textContent || '';
                    }
                    
                    return {
                        title: title,
                        content: content.trim()
                    };
                }
            """)
            
            if content_data['content'] and len(content_data['content']) > 100:
                # Làm sạch content
                cleaned_content = self._clean_content(content_data['content'])
                
                # Tạo tên file an toàn
                safe_filename = self._create_safe_filename(url)
                text_file_path = os.path.join(self.output_text_dir, f"{safe_filename}.txt")
                
                # Lưu file text
                async with aiofiles.open(text_file_path, 'w', encoding='utf-8') as f:
                    await f.write(cleaned_content)
                
                return {
                    'title': content_data['title'] or 'Untitled',
                    'url': url,
                    'content': cleaned_content,
                    'category': category,
                    'word_count': len(cleaned_content.split()),
                    'text_file': text_file_path
                }
            else:
                logger.warning(f"⚠️ Nội dung quá ngắn hoặc trống: {url}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Lỗi khi crawl article {url}: {str(e)}")
            return None
        finally:
            await page.close()

    def _clean_content(self, content):
        """Làm sạch nội dung, xử lý ký tự đặc biệt"""
        if not content:
            return ""
        
        # Xử lý các ký tự đặc biệt
        content = content.replace('\t', ' ')  # Tab -> space
        content = content.replace('\r\n', '\n')  # Windows line endings
        content = content.replace('\r', '\n')  # Mac line endings
        content = content.replace('\u00a0', ' ')  # Non-breaking space
        content = content.replace('\u2019', "'")  # Smart apostrophe
        content = content.replace('\u2018', "'")  # Smart apostrophe
        content = content.replace('\u201c', '"')  # Smart quote
        content = content.replace('\u201d', '"')  # Smart quote
        content = content.replace('\u2013', '-')  # En dash
        content = content.replace('\u2014', '-')  # Em dash
        
        # Loại bỏ multiple spaces và newlines
        content = re.sub(r' +', ' ', content)  # Multiple spaces -> single space
        content = re.sub(r'\n{3,}', '\n\n', content)  # Multiple newlines -> double newline
        
        return content.strip()

    def _create_safe_filename(self, url):
        """Tạo tên file an toàn từ URL"""
        # Lấy phần cuối của URL
        filename = url.split('/')[-1]
        if not filename:
            filename = url.split('/')[-2]
        
        # Loại bỏ ký tự không hợp lệ
        filename = re.sub(r'[^\w\-_.]', '_', filename)
        filename = re.sub(r'_+', '_', filename)  # Multiple underscores -> single
        
        # Giới hạn độ dài
        if len(filename) > 100:
            filename = filename[:100]
        
        return filename.lower()

    async def _save_results(self):
        """Lưu kết quả vào file JSON"""
        try:
            output_data = {
                'metadata': {
                    'crawl_date': time.strftime('%Y-%m-%d %H:%M:%S'),
                    'total_main_pages': len(self.results),
                    'total_sub_articles': self.stats['total_sub_articles'],
                    'stats': self.stats
                },
                'data': self.results
            }
            
            async with aiofiles.open(self.output_json, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(output_data, indent=2, ensure_ascii=False))
            
            logger.info(f"💾 Đã lưu kết quả vào {self.output_json}")
        except Exception as e:
            logger.error(f"❌ Lỗi khi lưu kết quả: {str(e)}")

    def _print_summary(self):
        """In tóm tắt kết quả"""
        duration = self.stats['end_time'] - self.stats['start_time']
        
        logger.info("\n" + "="*60)
        logger.info("📊 TÓM TẮT KẾT QUẢ CRAWL PHASE 2")
        logger.info("="*60)
        logger.info(f"⏱️  Thời gian thực hiện: {duration:.2f} giây")
        logger.info(f"📄 Tổng main pages: {self.stats['total_main_pages']}")
        logger.info(f"✅ Thành công: {self.stats['successful_pages']}")
        logger.info(f"❌ Thất bại: {self.stats['failed_pages']}")
        logger.info(f"📰 Tổng sub-articles: {self.stats['total_sub_articles']}")
        
        logger.info("\n📊 THỐNG KÊ THEO CATEGORY:")
        for category, stats in self.stats['category_stats'].items():
            logger.info(f"   {category}: {stats['pages']} pages, {stats['articles']} articles")
        
        logger.info(f"\n📁 File texts đã lưu trong: {self.output_text_dir}")
        logger.info("="*60)

async def main():
    crawler = ContentCrawler()
    await crawler.crawl_content()

if __name__ == "__main__":
    asyncio.run(main())
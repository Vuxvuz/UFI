#!/usr/bin/env python3
"""
Verywell Mind Crawler - Phase 3: Xử lý và làm sạch dữ liệu cuối cùng
"""

import json
import logging
import re
import time
from pathlib import Path
import aiofiles
import asyncio
from collections import Counter

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('crawl_phase3.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DataProcessor:
    def __init__(self):
        self.input_file = './verywellmind_full_content.json'
        self.output_file = './verywellmind_cleaned_content.json'
        self.final_output_file = './verywellmind_final_data.json'
        self.stats = {
            'input_articles': 0,
            'processed_articles': 0,
            'removed_articles': 0,
            'total_words': 0,
            'avg_words_per_article': 0,
            'category_distribution': {},
            'quality_stats': {
                'high_quality': 0,
                'medium_quality': 0,
                'low_quality': 0,
            },
            'start_time': None,
            'end_time': None
        }

        self.trash_patterns = [
            "SKIP TO CONTENT", "Conditions A-Z", "Therapy", "Living Well",
            "Relationships", "Psychology", "Trending", "About Us", "Search",
            "Daily Tips for a Healthy Mind to Your Inbox", "SIGN UP",
            "Meet Our Review Board", "Privacy Policy", "In the News", "Advertise",
            "Terms of Service", "Careers", "Contact", "Crisis Support", "Follow Us",
            "Verywell Mind's content is for informational and educational purposes only",
            "Ⓒ 2025 Dotdash Media, Inc.", "Verywell Mind is part of the Dotdash Meredith",
            "Subscribe", "Newsletter", "Related Articles", "Was this page helpful?",
            "Thanks for your feedback!", "Share", "Print", "Email", "Facebook",
            "Twitter", "Pinterest", "LinkedIn", "Copy Link", "Cite this Article"
        ]
        self.trash_regex = re.compile(
            '|'.join(re.escape(pattern) for pattern in self.trash_patterns),
            re.IGNORECASE
        )

    async def process_data(self):
        logger.info("🚀 Bắt đầu Phase 3: Xử lý và làm sạch dữ liệu")
        self.stats['start_time'] = time.time()

        raw_data = await self._load_input_data()
        if not raw_data:
            return

        cleaned_data = await self._process_all_articles(raw_data)
        final_data = await self._create_final_output(cleaned_data)
        await self._save_results(cleaned_data, final_data)

        self.stats['end_time'] = time.time()
        self._print_summary()

    async def _load_input_data(self):
        try:
            async with aiofiles.open(self.input_file, 'r', encoding='utf-8') as f:
                content = await f.read()
                data = json.loads(content)
                return data.get('data') if isinstance(data, dict) else data
        except Exception as e:
            logger.error(f"❌ Không thể đọc file input {self.input_file}: {str(e)}")
            return None

    async def _process_all_articles(self, raw_data):
        logger.info("🔄 Bắt đầu xử lý và làm sạch articles...")
        cleaned_results = []

        for entry in raw_data:
            processed_entry = {
                'title': self._sanitize_text(entry.get('title', 'Untitled')),
                'url': entry.get('url', ''),
                'category': entry.get('category', 'general'),
                'sub_articles': []
            }

            sub_articles = entry.get('sub_articles', [])
            for sub_article in sub_articles:
                processed_article = await self._process_single_article(sub_article)
                if processed_article:
                    processed_entry['sub_articles'].append(processed_article)
                    self.stats['processed_articles'] += 1
                else:
                    self.stats['removed_articles'] += 1

            if processed_entry['sub_articles']:
                cleaned_results.append(processed_entry)

        return cleaned_results

    async def _process_single_article(self, article):
        try:
            original_content = article.get('content', '')
            if not original_content or len(original_content.strip()) < 50:
                return None

            cleaned_content = self._sanitize_text(original_content)
            if len(cleaned_content.strip()) < 100:
                return None

            word_count = len(cleaned_content.split())
            self.stats['total_words'] += word_count

            if word_count > 500:
                self.stats['quality_stats']['high_quality'] += 1
                quality = 'high'
            elif word_count >= 200:
                self.stats['quality_stats']['medium_quality'] += 1
                quality = 'medium'
            else:
                self.stats['quality_stats']['low_quality'] += 1
                quality = 'low'

            category = article.get('category', 'general')
            self.stats['category_distribution'][category] = \
                self.stats['category_distribution'].get(category, 0) + 1

            return {
                'title': self._sanitize_text(article.get('title', 'Untitled')),
                'url': article.get('url', ''),
                'content': cleaned_content,
                'category': category,
                'word_count': word_count,
                'quality': quality,
                'text_file': article.get('text_file', '')
            }

        except Exception as e:
            logger.warning(f"⚠️ Lỗi khi xử lý article: {str(e)}")
            return None

    def _sanitize_text(self, text):
        if not text:
            return ""
        text = self._normalize_special_characters(text)
        text = text.replace('\t', ' ').replace('\r', ' ').replace('\n', ' ').replace('/', ' ').replace('\"', ' ')
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def _normalize_special_characters(self, text):
        char_map = {
            '\u00a0': ' ', '\u2019': "'", '\u2018': "'", '\u201c': '"',
            '\u201d': '"', '\u2013': '-', '\u2014': '-', '\u2026': '...',
            '\u00b7': '·', '\u2022': '•'
        }
        for old_char, new_char in char_map.items():
            text = text.replace(old_char, new_char)
        return text

    async def _create_final_output(self, cleaned_data):
        logger.info("📝 Tạo output cuối cùng với format yêu cầu...")
        final_articles = []
        for entry in cleaned_data:
            for sub_article in entry['sub_articles']:
                final_articles.append({
                    'title': sub_article['title'],
                    'url': sub_article['url'],
                    'content': sub_article['content'],
                    'category': sub_article['category']
                })
        logger.info(f"📄 Đã tạo {len(final_articles)} articles cho output cuối cùng")
        return final_articles

    async def _save_results(self, cleaned_data, final_data):
        try:
            if self.stats['processed_articles'] > 0:
                self.stats['avg_words_per_article'] = \
                    self.stats['total_words'] / self.stats['processed_articles']

            cleaned_output = {
                'metadata': {
                    'process_date': time.strftime('%Y-%m-%d %H:%M:%S'),
                    'total_entries': len(cleaned_data),
                    'total_articles': self.stats['processed_articles'],
                    'stats': self.stats
                },
                'data': cleaned_data
            }

            async with aiofiles.open(self.output_file, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(cleaned_output, indent=2, ensure_ascii=False))

            async with aiofiles.open(self.final_output_file, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(final_data, indent=2, ensure_ascii=False))

            logger.info(f"💾 Đã lưu cleaned data vào {self.output_file}")
            logger.info(f"💾 Đã lưu final data vào {self.final_output_file}")

        except Exception as e:
            logger.error(f"❌ Lỗi khi lưu kết quả: {str(e)}")

    def _print_summary(self):
        duration = self.stats['end_time'] - self.stats['start_time']
        logger.info("\n" + "="*70)
        logger.info("📊 TÓM TẮT KẾT QUẢ CRAWL PHASE 3 - DATA PROCESSING")
        logger.info("="*70)
        logger.info(f"⏱️  Thời gian xử lý: {duration:.2f} giây")
        logger.info(f"✅ Articles đã xử lý: {self.stats['processed_articles']}")
        logger.info(f"🗑️  Articles đã loại bỏ: {self.stats['removed_articles']}")
        logger.info(f"📝 Tổng số từ: {self.stats['total_words']:,}")
        logger.info(f"📊 Trung bình từ/article: {self.stats['avg_words_per_article']:.1f}")

        logger.info("\n📈 PHÂN BỐ CHẤT LƯỢNG:")
        for level, count in self.stats['quality_stats'].items():
            logger.info(f"   {level.capitalize()}: {count}")

        logger.info("\n📊 PHÂN BỐ THEO CATEGORY:")
        for category, count in self.stats['category_distribution'].items():
            logger.info(f"   {category}: {count}")

        logger.info("\n🎉 HOÀN THÀNH TẤT CẢ PHASE 3!")
        logger.info("="*70)

async def main():
    processor = DataProcessor()
    await processor.process_data()

if __name__ == "__main__":
    asyncio.run(main())

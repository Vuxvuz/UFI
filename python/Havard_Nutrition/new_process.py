# File: new_process.py - Cập nhật và làm sạch nội dung từ Harvard Nutrition
import json
import asyncio
import time
import re
import os
import unicodedata
import csv
from collections import Counter, defaultdict
from urllib.parse import urlparse
from playwright.async_api import async_playwright
from datetime import datetime
from typing import Dict, List, Set, Tuple, Any, Optional

# Cấu hình files
OUTPUT_FOLDER = './final_output'
INPUT_FILE = f'{OUTPUT_FOLDER}/cleaned_output.json'
OUTPUT_FILE = f'{OUTPUT_FOLDER}/updated_content.json'
CHECKPOINT_FILE = f'{OUTPUT_FOLDER}/crawler_checkpoint.json'
REMOVED_SENTENCES_FILE = f'{OUTPUT_FOLDER}/removed_sentences.csv'

# Cấu hình crawl
MAX_WORKERS = 5
MAX_RETRIES = 3
RETRY_DELAY = 2
PAGE_LOAD_TIMEOUT = 30000
BATCH_SIZE = 20

# Cấu hình xử lý nội dung
MIN_SENTENCE_LENGTH = 20
MAX_REPETITION_COUNT = 3
HEADER_CHECK_SENTENCES = 5  # Số câu đầu tiên kiểm tra header spam

# Đảm bảo thư mục output tồn tại
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Danh sách lưu các câu bị loại bỏ và lý do
removed_sentences = []

def log_message(message):
    """Ghi log ra console với timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")

def clean_text_minimal(text):
    """Làm sạch text cơ bản"""
    if not text:
        return ""
    text = re.sub(r'[\t\n\r]+', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def preserve_layout_text(text):
    """Giữ cấu trúc và làm sạch text"""
    if not text:
        return ""
    
    # Loại bỏ khoảng trắng thừa
    text = re.sub(r'[ \t]+', ' ', text)
    
    # Chuẩn hóa các dòng trống
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    return text.strip()

def split_into_sentences(text):
    """Tách văn bản thành các câu"""
    if not text:
        return []
    
    # Sử dụng regex để tách câu
    sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    return sentences

def clean_header_spam(sentences):
    """Loại bỏ nội dung header spam ở đầu văn bản"""
    if not sentences or len(sentences) < 2:
        return sentences, 0
    
    header_removed = 0
    header_check_range = min(HEADER_CHECK_SENTENCES, len(sentences))
    
    # Kiểm tra các câu đầu tiên
    for i in range(header_check_range):
        if '>' in sentences[i]:
            # Lưu câu bị loại bỏ
            for j in range(i+1):
                removed_sentences.append({
                    'sentence': sentences[j],
                    'reason': 'Truncated all content before last >'
                })
            
            # Chỉ giữ lại nội dung từ câu hiện tại trở đi
            header_removed = i + 1
            return sentences[i+1:], header_removed
    
    return sentences, header_removed

def detect_repeated_sentences(sentences):
    """Phát hiện và loại bỏ các câu lặp lại quá nhiều lần"""
    if not sentences:
        return sentences, 0
    
    # Đếm số lần xuất hiện của mỗi câu
    sentence_counts = Counter(sentences)
    
    # Danh sách câu sau khi lọc
    filtered_sentences = []
    repetition_removed = 0
    
    # Tập hợp các câu đã được xử lý
    processed_sentences = set()
    
    for sentence in sentences:
        # Bỏ qua câu quá ngắn
        if len(sentence) < MIN_SENTENCE_LENGTH:
            continue
            
        # Nếu câu xuất hiện quá nhiều lần, chỉ giữ lại một số lượng nhất định
        if sentence_counts[sentence] > MAX_REPETITION_COUNT:
            if sentence not in processed_sentences:
                # Thêm vào câu bị loại bỏ với lý do
                removed_sentences.append({
                    'sentence': sentence,
                    'reason': 'Repeated >3 times'
                })
                
                # Thêm vào tập hợp câu đã xử lý
                processed_sentences.add(sentence)
                
                # Chỉ giữ lại MAX_REPETITION_COUNT câu
                for _ in range(MAX_REPETITION_COUNT):
                    filtered_sentences.append(sentence)
                
                # Đếm số câu bị loại
                repetition_removed += sentence_counts[sentence] - MAX_REPETITION_COUNT
        else:
            filtered_sentences.append(sentence)
    
    return filtered_sentences, repetition_removed

def convert_to_markdown():
    """Trả về mã JavaScript để chuyển đổi HTML sang Markdown"""
    js_convert_to_markdown = """
    (() => {
        function htmlToMarkdown(html) {
            let markdown = html;
            
            // Remove script and style tags
            markdown = markdown.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            markdown = markdown.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
            
            // Headings
            markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\\n\\n');
            markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\\n\\n');
            markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\\n\\n');
            markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\\n\\n');
            markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\\n\\n');
            markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\\n\\n');
            
            // Paragraph
            markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\\n\\n');
            
            // Bold and Italic
            markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
            markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
            markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
            markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
            
            // Links
            markdown = markdown.replace(/<a[^>]*href="(.*?)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
            
            // Images
            markdown = markdown.replace(/<img[^>]*src="(.*?)"[^>]*alt="(.*?)"[^>]*>/gi, '![$2]($1)');
            markdown = markdown.replace(/<img[^>]*alt="(.*?)"[^>]*src="(.*?)"[^>]*>/gi, '![$1]($2)');
            markdown = markdown.replace(/<img[^>]*src="(.*?)"[^>]*>/gi, '![]($1)');
            
            // Lists
            markdown = markdown.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, function(match, content) {
                let listItems = '';
                content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, function(match, item) {
                    listItems += '- ' + item.trim() + '\\n';
                    return '';
                });
                return listItems + '\\n';
            });
            
            markdown = markdown.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, function(match, content) {
                let listItems = '';
                let index = 1;
                content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, function(match, item) {
                    listItems += index + '. ' + item.trim() + '\\n';
                    index++;
                    return '';
                });
                return listItems + '\\n';
            });
            
            // Blockquotes
            markdown = markdown.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '> $1\\n\\n');
            
            // Code blocks
            markdown = markdown.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\\n$1\\n```\\n\\n');
            
            // Inline code
            markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
            
            // Horizontal rule
            markdown = markdown.replace(/<hr[^>]*>/gi, '---\\n\\n');
            
            // Tables
            markdown = markdown.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, function(match, tableContent) {
                let mdTable = '';
                
                // Process header row
                mdTable += tableContent.replace(/<thead[^>]*>([\s\S]*?)<\/thead>/gi, function(match, headContent) {
                    let header = '';
                    header += headContent.replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, function(match, rowContent) {
                        let headerRow = '';
                        let separatorRow = '';
                        
                        rowContent.replace(/<th[^>]*>(.*?)<\/th>/gi, function(match, cellContent) {
                            headerRow += '| ' + cellContent.trim() + ' ';
                            separatorRow += '| --- ';
                            return '';
                        });
                        
                        headerRow += '|\\n';
                        separatorRow += '|\\n';
                        
                        return headerRow + separatorRow;
                    });
                    
                    return header;
                });
                
                // Process table body
                mdTable += tableContent.replace(/<tbody[^>]*>([\s\S]*?)<\/tbody>/gi, function(match, bodyContent) {
                    let bodyRows = '';
                    bodyRows += bodyContent.replace(/<tr[^>]*>(.*?)<\/tr>/gis, function(match, rowContent) {
                        let row = '';
                        row += rowContent.replace(/<td[^>]*>(.*?)<\/td>/gi, '$1 | ').trim();
                        row = '| ' + row + '\\n';
                        return row;
                    });
                    return bodyRows;
                });
                
                return mdTable + '\\n';
            });
            
            // Clean up HTML entities
            markdown = markdown.replace(/&nbsp;/g, ' ');
            markdown = markdown.replace(/&lt;/g, '<');
            markdown = markdown.replace(/&gt;/g, '>');
            markdown = markdown.replace(/&amp;/g, '&');
            markdown = markdown.replace(/&quot;/g, '"');
            
            // Clean up extra whitespace and newlines
            markdown = markdown.replace(/\\n\\s*\\n\\s*\\n/g, '\\n\\n');
            
            return markdown;
        }
        
        // Get the main content
        let content = document.body.innerHTML;
        
        // Try to find the main content container
        const possibleContainers = [
            document.querySelector('article'),
            document.querySelector('main'),
            document.querySelector('.content'),
            document.querySelector('.post-content'),
            document.querySelector('.entry-content'),
            document.querySelector('#content')
        ];
        
        for (const container of possibleContainers) {
            if (container) {
                content = container.innerHTML;
                break;
            }
        }
        
        return htmlToMarkdown(content);
    })();
    """
    
    return js_convert_to_markdown

async def extract_content(page):
    """Trích xuất nội dung từ trang web và chuyển đổi sang Markdown"""
    try:
        # Chuyển đổi HTML sang Markdown
        markdown_content = await page.evaluate(convert_to_markdown())
        
        # Làm sạch nội dung Markdown
        cleaned_content = preserve_layout_text(markdown_content)
        
        # Chia thành các câu
        sentences = split_into_sentences(cleaned_content)
        
        # Loại bỏ header spam
        cleaned_sentences, header_removed = clean_header_spam(sentences)
        
        # Loại bỏ câu lặp lại
        cleaned_sentences, repetition_removed = detect_repeated_sentences(cleaned_sentences)
        
        # Ghép lại các câu thành nội dung hoàn chỉnh
        final_content = ' '.join(cleaned_sentences)
        
        return {
            'content': final_content,
            'removed_count': header_removed + repetition_removed
        }
        
    except Exception as e:
        log_message(f"⚠️ Lỗi khi trích xuất nội dung: {str(e)}")
        return {
            'content': '',
            'removed_count': 0
        }

async def process_article(context, entry, semaphore):
    """Xử lý một bài viết và trích xuất nội dung"""
    url = entry.get('url', '')
    title = entry.get('title', '')
    category = entry.get('category', '')
    
    # Tạo bản sao của entry để cập nhật
    updated_entry = entry.copy()
    
    if not url:
        log_message(f"⚠️ Bỏ qua mục không có URL: {title}")
        return updated_entry
    
    # Sử dụng semaphore để giới hạn số lượng request đồng thời
    async with semaphore:
        # Kiểm tra URL hợp lệ
        parsed_url = urlparse(url)
        if not parsed_url.scheme or not parsed_url.netloc:
            log_message(f"⚠️ URL không hợp lệ: {url}")
            return updated_entry
        
        retries = 0
        while retries < MAX_RETRIES:
            try:
                log_message(f"🔍 Đang xử lý: {title} ({url})")
                
                # Tạo page mới
                page = await context.new_page()
                
                try:
                    # Thiết lập timeout
                    page.set_default_timeout(PAGE_LOAD_TIMEOUT)
                    
                    # Truy cập URL
                    await page.goto(url, wait_until='domcontentloaded')
                    
                    # Đợi trang tải xong
                    await page.wait_for_load_state('networkidle')
                    
                    # Trích xuất nội dung
                    result = await extract_content(page)
                    content = result['content']
                    removed_count = result['removed_count']
                    
                    if content:
                        log_message(f"✅ Đã trích xuất nội dung ({len(content)} ký tự, loại bỏ {removed_count} câu): {title}")
                        updated_entry['content'] = content
                        updated_entry['last_updated'] = datetime.now().isoformat()
                        updated_entry['removed_sentences_count'] = removed_count
                    else:
                        log_message(f"⚠️ Không thể trích xuất nội dung: {title}")
                    
                    # Đóng page
                    await page.close()
                    
                    # Trả về kết quả
                    return updated_entry
                    
                except Exception as e:
                    # Đóng page nếu có lỗi
                    await page.close()
                    raise e
                
            except Exception as e:
                retries += 1
                log_message(f"⚠️ Lỗi khi xử lý {url} (lần {retries}/{MAX_RETRIES}): {str(e)}")
                
                if retries < MAX_RETRIES:
                    log_message(f"🔄 Thử lại sau {RETRY_DELAY} giây...")
                    await asyncio.sleep(RETRY_DELAY)
                else:
                    log_message(f"❌ Đã vượt quá số lần thử lại cho {url}")
                    return updated_entry

async def main():
    """Hàm chính thực hiện quá trình cập nhật nội dung"""
    log_message("🚀 Bắt đầu quá trình cập nhật nội dung...")
    start_time = time.time()
    
    try:
        # Đọc dữ liệu đầu vào
        log_message(f"📖 Đọc dữ liệu từ {INPUT_FILE}...")
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        log_message(f"📊 Đã đọc {len(data)} bản ghi.")
        
        # Khởi tạo playwright
        log_message("🔧 Khởi tạo trình duyệt...")
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                viewport={'width': 1280, 'height': 800},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            )
            
            # Chia thành các batch để xử lý
            batches = [data[i:i+BATCH_SIZE] for i in range(0, len(data), BATCH_SIZE)]
            total_batches = len(batches)
            
            # Thiết lập semaphore để giới hạn số lượng request đồng thời
            semaphore = asyncio.Semaphore(MAX_WORKERS)
            
            updated_data = []
            
            for batch_idx, batch in enumerate(batches):
                log_message(f"🔄 Đang xử lý batch {batch_idx+1}/{total_batches}...")
                
                # Xử lý song song các URL trong batch
                tasks = [process_article(context, entry, semaphore) for entry in batch]
                batch_results = await asyncio.gather(*tasks)
                
                # Thêm vào kết quả
                updated_data.extend(batch_results)
                
                # Lưu checkpoint
                with open(CHECKPOINT_FILE, 'w', encoding='utf-8') as f:
                    checkpoint_data = {
                        'processed_count': len(updated_data),
                        'total_count': len(data),
                        'last_batch': batch_idx,
                        'timestamp': datetime.now().isoformat()
                    }
                    json.dump(checkpoint_data, f, ensure_ascii=False, indent=2)
                
                # Delay giữa các batch để giảm tải cho server
                if batch_idx < total_batches - 1:
                    await asyncio.sleep(1)
            
            await browser.close()
        
        # Lưu kết quả cuối cùng
        log_message("💾 Lưu kết quả cập nhật...")
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(updated_data, f, indent=2, ensure_ascii=False)
        
        # Lưu log các câu bị loại bỏ
        log_message(f"📝 Lưu log các câu bị loại bỏ vào {REMOVED_SENTENCES_FILE}...")
        with open(REMOVED_SENTENCES_FILE, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['sentence', 'reason'])
            for item in removed_sentences:
                writer.writerow([item['sentence'], item['reason']])
        
        # Tổng kết
        total_removed = sum(entry.get('removed_sentences_count', 0) for entry in updated_data)
        elapsed_time = time.time() - start_time
        log_message(f"✅ Quá trình cập nhật hoàn tất trong {elapsed_time:.2f} giây ({elapsed_time/60:.2f} phút)")
        log_message(f"📊 Tổng kết:")
        log_message(f"   - Tổng số bản ghi đã xử lý: {len(updated_data)}")
        log_message(f"   - Tổng số câu bị loại bỏ: {total_removed}")
        log_message(f"   - Kết quả đã lưu vào: {OUTPUT_FILE}")
        log_message(f"   - Log câu bị loại bỏ: {REMOVED_SENTENCES_FILE}")
        
    except Exception as e:
        log_message(f"❌ Lỗi không xử lý được: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
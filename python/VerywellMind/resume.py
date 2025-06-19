#!/usr/bin/env python3
"""
Medical Content Processor - Enhanced Resume Logic with Robust Timeout Handling
Handles resuming processing with improved timeout logic and error recovery.
"""

import json
import ijson
import requests
import logging
import glob
import signal
import sys
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from datetime import datetime
import os
import time

# === Constants ===
API_URL = "http://localhost:1234/v1/completions"
MAX_TOKENS = 7300
CHARS_PER_TOKEN = 4
INPUT_FILE = "verywellmind_final_data.json"
OUTPUT_FILE = "verywellmind_enhanced_structured.json"
SAVE_INTERVAL = 3  # Save checkpoint more frequently
REQUEST_TIMEOUT = 120  # Reduced timeout for faster retry
LOG_FILE = f"logs/processing_log_resume_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
MAX_RETRIES_PER_ARTICLE = 4  # Increased retries per article
MAX_API_RETRIES = 2  # Increased retries for API calls
CHECKPOINT_FILE = "processing_checkpoint.json"

# === Global variables for graceful shutdown ===
should_stop = False
current_index = 0

def signal_handler(signum, frame):
    global should_stop
    print(f"\n🛑 Nhận tín hiệu dừng (signal {signum}). Đang lưu checkpoint...")
    should_stop = True

# Register signal handlers
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# === Setup logging ===
def setup_logging(log_file: str) -> logging.Logger:
    os.makedirs(os.path.dirname(log_file), exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s",
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )
    return logging.getLogger(__name__)

logger = setup_logging(LOG_FILE)

# === Estimate tokens ===
def estimate_tokens(text: str) -> int:
    return len(text) // CHARS_PER_TOKEN

# === Check if content is already in Markdown format ===
def is_markdown_content(content: str) -> bool:
    content = content.strip()
    return content.startswith("```markdown\n") and content.endswith("\n```markdown")

# === Split content into chunks ===
def split_into_chunks(content: str) -> list:
    max_chars_per_chunk = (MAX_TOKENS - 1000) * CHARS_PER_TOKEN
    chunks = []
    current_chunk = ""
    for paragraph in content.split("\n"):
        if estimate_tokens(current_chunk + paragraph + "\n") > max_chars_per_chunk:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = paragraph + "\n"
        else:
            current_chunk += paragraph + "\n"
    if current_chunk:
        chunks.append(current_chunk.strip())
    return chunks

# === Call LM Studio API with improved error handling ===
@retry(
    stop=stop_after_attempt(MAX_API_RETRIES),
    wait=wait_exponential(multiplier=1, min=2, max=6),
    retry=retry_if_exception_type((
        requests.exceptions.RequestException,
        requests.exceptions.Timeout,
        requests.exceptions.ConnectionError
    ))
)
def call_llama(prompt: str) -> str:
    global should_stop
    if should_stop:
        raise KeyboardInterrupt("Processing stopped by user")
    
    payload = {
        "model": "meta-llama-3.1-8b-instruct",
        "prompt": prompt,
        "max_tokens": 1500,
        "temperature": 0.7,
        "top_p": 0.9
    }
    
    try:
        response = requests.post(API_URL, json=payload, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        result = response.json().get("choices", [])[0].get("text", "").strip()
        return result
    except requests.exceptions.Timeout:
        logger.error("API request timeout after {} seconds".format(REQUEST_TIMEOUT))
        raise
    except requests.exceptions.ConnectionError:
        logger.error("Connection error to LM Studio")
        raise
    except Exception as e:
        logger.error(f"API call error: {e}")
        raise

# === Process a single chunk ===
def process_chunk(chunk: str, chunk_index: int, total_chunks: int, title: str) -> str:
    global should_stop
    if should_stop:
        return chunk
    
    already_markdown = is_markdown_content(chunk)
    action = "paraphrase only" if already_markdown else "paraphrase and add Markdown formatting"

    if already_markdown:
        chunk = chunk[len("```markdown\n"):-len("\n```markdown")]

    prompt = (
        f"You are a psychologist and an expert in healthcare and social sciences, "
        f"as well as a skilled writer. This is chunk {chunk_index}/{total_chunks} of an article titled '{title}'.\n"
        f"\n"
        f"IMPORTANT: Do NOT add any explanations, rules, code snippets, commentary, or any content not present in the original text. "
        f"Read carefully and think deeply about the content before applying Markdown formatting to avoid missing any details. "
        f"Do NOT include this instruction in your response. Return only the content, either verbatim or paraphrased, "
        f"using the following formatting guidelines exactly:\n"
        f"- Write clear, concise sentences so that readers can easily follow the structure and flow of the text.\n"
        f"- Use bold section headers (e.g., **Title**, **Overview**, **Recommendations**, **Nutrition Facts**, etc.).\n"
        f"- Separate each section with a blank line.\n"
        f"- Use bullet points:\n  * for unordered lists, one item per line.\n"
        f"- Numbered items (e.g., 1., 2.1, 3.1) must each appear on their own separate line without combining with adjacent text.\n"
        f"- Preserve or add Markdown headings and list structure exactly as shown in the example below.\n"
        f"\n"
        f"Example:\n"
        f"**Title**\n"
        f"The Kid's Healthy Eating Plate\n"
        f"\n"
        f"**Overview**\n"
        f"The Kid's Healthy Eating Plate provides a blueprint to help us make the best eating choices.\n"
        f"\n"
        f"*   Fill half of our plate with colorful vegetables and fruits (and choose them as snacks)\n"
        f"*   Split the other half between whole grains and healthy protein\n"
        f"*   The more veggies – and the greater the variety – the better\n"
        f"\n"
        f"**Recommendations**\n"
        f"\n"
        f"*   Choose whole fruits or sliced fruits (rather than fruit juices; limit fruit juice to one small glass per day)\n"
        f"*   Go for whole grains or foods made with minimally processed whole grains\n"
        f"*   Limit red meat (beef, pork, lamb) and avoid processed meats (bacon, deli meats, hot dogs, sausages)\n"
        f"*   Use healthy oils from plants like extra virgin olive, canola, corn, sunflower, and peanut oil in cooking, on salads and vegetables, and at the table\n"
        f"*   Limit butter to occasional use\n"
        f"\n"
        f"**Nutrition Facts**\n"
        f"\n"
        f"*   Choose beans and peas, nuts, seeds, and other plant-based healthy protein options, as well as fish, eggs, and poultry\n"
        f"*   Dairy foods are needed in smaller amounts than other foods on our plate:\n    *   Choose unflavored milk, plain yogurt, small amounts of cheese, and other unsweetened dairy foods\n"
        f"\n"
        f"Action: {action}\n"
        f"\n"
        f"Content:\n"
        f"{chunk}"
    )
    try:
        result = call_llama(prompt)
        return result
    except Exception as e:
        logger.error(f"Error processing chunk {chunk_index}/{total_chunks} for '{title}': {e}")
        return chunk  # Fallback to original content

# === Process entire content of an article ===
def process_content(content: str, title: str) -> str:
    global should_stop
    if should_stop:
        return content
    
    chunks = split_into_chunks(content)
    if not chunks:
        return ""
    
    processed_chunks = []
    total_chunks = len(chunks)
    
    for i, chunk in enumerate(chunks, 1):
        if should_stop:
            processed_chunks.append(chunk)
            break
        processed_chunks.append(process_chunk(chunk, i, total_chunks, title))
    
    result = "\n\n".join(processed_chunks)
    if is_markdown_content(content):
        return f"```markdown\n{result}\n```markdown"
    return result

# === Classify category ===
def classify_category(processed_content: str, title: str) -> str:
    global should_stop
    if should_stop:
        return "general"
    
    content_for_classification = processed_content
    if is_markdown_content(processed_content):
        content_for_classification = processed_content[len("```markdown\n"):-len("\n```markdown")]

    category_prompt = (
        f"You are an expert in content classification. Based on the following content from article titled '{title}', "
        f"classify it into one of three categories: 'health', 'mental', or 'general'. Return only the category name, without any explanation or additional content. "
        f"Do NOT include this instruction in your response.\n\n"
        f"Content:\n{content_for_classification}"
    )
    try:
        category = call_llama(category_prompt).strip().lower()
        return category if category in ["health", "mental", "general"] else "general"
    except Exception as e:
        logger.error(f"Error classifying category for '{title}': {e}")
        return "general"

# === Process a single article with retry logic ===
def process_article_with_retry(article: dict) -> dict:
    global should_stop
    if should_stop:
        return article
    
    title = article.get("title", "No Title")
    content = article.get("content", "")

    for attempt in range(1, MAX_RETRIES_PER_ARTICLE + 1):
        if should_stop:
            return article
        
        try:
            logger.debug(f"Attempt {attempt}/{MAX_RETRIES_PER_ARTICLE} - '{title}'")
            processed_content = process_content(content, title)
            category = classify_category(processed_content, title)
            return {
                "title": title,
                "url": article.get("url", ""),
                "content": processed_content,
                "category": category
            }
        except KeyboardInterrupt:
            logger.info("Processing interrupted by user")
            return article
        except Exception as e:
            logger.error(f"Attempt {attempt} failed for '{title}': {e}")
            if attempt == MAX_RETRIES_PER_ARTICLE:
                logger.warning(f"Skipping '{title}' after {MAX_RETRIES_PER_ARTICLE} attempts")
                return article
            time.sleep(1.5)
    return article

# === Save checkpoint ===
def save_checkpoint(index: int, processed_count: int):
    checkpoint_data = {
        "last_processed_index": index,
        "processed_count": processed_count,
        "timestamp": datetime.now().isoformat()
    }
    with open(CHECKPOINT_FILE, "w", encoding="utf-8") as f:
        json.dump(checkpoint_data, f, ensure_ascii=False, indent=2)
    logger.info(f"💾 Checkpoint saved at index {index}")

# === Load checkpoint ===
def load_checkpoint() -> tuple:
    if not os.path.exists(CHECKPOINT_FILE):
        return 0, 0
    
    try:
        with open(CHECKPOINT_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data.get("last_processed_index", 0), data.get("processed_count", 0)
    except Exception as e:
        logger.error(f"Error loading checkpoint: {e}")
        return 0, 0

# === Find the last resume index (legacy support) ===
def find_last_resume_index() -> int:
    files = glob.glob("temp_output_*.json")
    if not files:
        return 0
    indices = []
    for fname in files:
        try:
            num = int(os.path.basename(fname).split("_")[-1].split(".")[0])
            indices.append(num)
        except:
            pass
    return max(indices) if indices else 0

# === Save temporary results ===
def save_temp_results(index: int):
    temp_file = f"temp_output_{index}.json"
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump({"processed_up_to": index, "timestamp": datetime.now().isoformat()}, f, ensure_ascii=False, indent=2)
    logger.info(f"📋 Temp marker saved: {temp_file}")

# === Main processing function ===
def run_processor():
    global should_stop, current_index
    
    print("🚀 Medical Content Processor - Enhanced Resume Logic with Timeout Handling")
    print(f"📁 Input file: {INPUT_FILE}")
    print(f"💾 Output file: {OUTPUT_FILE}")
    print(f"🔗 LM Studio URL: {API_URL}")
    print(f"🤖 Model: meta-llama-3.1-8b-instruct")
    print(f"⚙️ Max tokens: {MAX_TOKENS}")
    print(f"📦 Batch size: {SAVE_INTERVAL}")
    print(f"🔄 Chunk size: {(MAX_TOKENS - 1000) * CHARS_PER_TOKEN:,} chars")
    print(f"⏱️ Request timeout: {REQUEST_TIMEOUT}s")
    print("-" * 60)

    # 1) Load checkpoint (priority) or temp files (legacy)
    checkpoint_index, processed_count = load_checkpoint()
    legacy_index = find_last_resume_index()
    resume_from = max(checkpoint_index, legacy_index)
    
    if resume_from > 0:
        print(f"🔄 Resuming từ bài #{resume_from + 1} (đã hoàn thành {resume_from} bài trước đó)")
    else:
        print("▶️ Bắt đầu xử lý từ đầu")

    logger.info(f"Starting processing: {INPUT_FILE} (resume_from={resume_from})")
    start_time = time.time()
    processed_count = max(processed_count, resume_from)
    skipped_articles = 0

    try:
        # 2) Setup output file
        if resume_from == 0:
            if os.path.exists(OUTPUT_FILE):
                os.remove(OUTPUT_FILE)
            out_mode = "w"
            prefix = "[\n"
        else:
            if os.path.exists(OUTPUT_FILE):
                with open(OUTPUT_FILE, "rb+") as f:
                    try:
                        f.seek(-1, os.SEEK_END)
                        last_char = f.read(1)
                        if last_char == b"]":
                            f.seek(-1, os.SEEK_END)
                            f.truncate()
                    except OSError:
                        pass
            out_mode = "a"
            prefix = ""

        # 3) Count total articles for progress tracking
        try:
            total_articles = sum(
                1 for _ in ijson.items(open(INPUT_FILE, "r", encoding="utf-8"), "item")
            )
            print(f"📊 Tổng số bài: {total_articles}")
        except Exception:
            total_articles = None

        # 4) Process articles
        with open(OUTPUT_FILE, out_mode, encoding="utf-8") as out_f:
            out_f.write(prefix)
            first_item = (resume_from == 0)

            with open(INPUT_FILE, "r", encoding="utf-8") as f_in:
                for idx, article in enumerate(ijson.items(f_in, "item"), start=1):
                    if should_stop:
                        logger.info("Processing stopped by user signal")
                        break
                    
                    current_index = idx
                    
                    # Skip processed articles
                    if idx <= resume_from:
                        continue

                    # Process article
                    if not isinstance(article, dict) or "title" not in article or "content" not in article:
                        logger.warning(f"⚠️  Bỏ qua article không hợp lệ (index={idx})")
                        line = json.dumps(article, ensure_ascii=False)
                        skipped_articles += 1
                    else:
                        # Show progress
                        if total_articles:
                            print(f"📝 Xử lý bài {idx}/{total_articles}: {article.get('title', 'No Title')[:50]}...")
                        else:
                            print(f"📝 Xử lý bài {idx}: {article.get('title', 'No Title')[:50]}...")
                        
                        processed_article = process_article_with_retry(article)
                        line = json.dumps(processed_article, ensure_ascii=False)
                        processed_count += 1

                    # Write to output file
                    if first_item:
                        out_f.write(line)
                        first_item = False
                    else:
                        out_f.write(",\n" + line)
                    
                    out_f.flush()  # Ensure data is written immediately

                    # Save checkpoint more frequently
                    if idx % SAVE_INTERVAL == 0:
                        save_checkpoint(idx, processed_count)
                        save_temp_results(idx)
                        print(f"💾 Checkpoint saved at article {idx}")

            # Close JSON array
            out_f.write("\n]")

    except KeyboardInterrupt:
        logger.info("Processing interrupted by user")
        save_checkpoint(current_index, processed_count)
        print(f"\n🛑 Đã dừng và lưu checkpoint tại bài {current_index}")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        save_checkpoint(current_index, processed_count)
        raise
    finally:
        # Final summary
        total_time = time.time() - start_time
        print(f"\n📊 Tóm tắt:")
        print(f"📁 File đầu ra: {OUTPUT_FILE}")
        print(f"⏱️ Tổng thời gian: {total_time:.2f} giây")
        print(f"📊 Articles đã xử lý: {processed_count}")
        print(f"⏭️ Articles bỏ qua: {skipped_articles}")
        if processed_count > 0:
            avg_time = total_time / max(1, processed_count - resume_from)
            print(f"⚡ Thời gian trung bình/bài: {avg_time:.2f} giây")
        
        logger.info(f"Done. Processed {processed_count} articles, skipped {skipped_articles}.")

# === Main entry point ===
if __name__ == "__main__":
    run_processor()
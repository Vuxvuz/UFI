#!/usr/bin/env python3
"""
Medical Content Processor - Optimized for Large Data (Revised)
Handles large JSON files with efficient streaming, robust error handling, and simplified output logic.
"""

import json
import ijson
import requests
import logging
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from datetime import datetime
import os
import sys
import time

# === Constants ===
API_URL = "http://localhost:1234/v1/completions"  # LM Studio endpoint
MAX_TOKENS = 7300  # Safe token limit (below 8,000 max)
CHARS_PER_TOKEN = 4  # Average estimation for English (~4 chars/token)
INPUT_FILE = "verywellmind_final_data.json"
OUTPUT_FILE = "verywellmind_enhanced_structured.json"
SAVE_INTERVAL = 10  # Save after every 10 articles as a temp file
REQUEST_TIMEOUT = 120  # Timeout for API calls (seconds)
LOG_FILE = f"logs/processing_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
MAX_RETRIES_PER_ARTICLE = 2  # Max retries per article
MAX_API_RETRIES = 2  # Max retries for API calls

# === Setup logging ===
def setup_logging(log_file: str) -> logging.Logger:
    os.makedirs(os.path.dirname(log_file), exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
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
    max_chars_per_chunk = (MAX_TOKENS - 1000) * CHARS_PER_TOKEN  # Reserve 1000 tokens for prompt
    chunks = []
    current_chunk = ""
    for paragraph in content.split("\n"):
        if estimate_tokens(current_chunk + paragraph + '\n') > max_chars_per_chunk:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = paragraph + '\n'
        else:
            current_chunk += paragraph + '\n'
    if current_chunk:
        chunks.append(current_chunk.strip())
    return chunks

# === Call LM Studio API with retries ===
@retry(
    stop=stop_after_attempt(MAX_API_RETRIES),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    retry=retry_if_exception_type((requests.exceptions.RequestException,))
)
def call_llama(prompt: str) -> str:
    payload = {
        "model": "meta-llama-3.1-8b-instruct",
        "prompt": prompt,
        "max_tokens": 1500,
        "temperature": 0.7,
        "top_p": 0.9
    }
    response = requests.post(API_URL, json=payload, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    result = response.json().get("choices", [])[0].get("text", "").strip()
    return result

# === Process a single chunk ===
def process_chunk(chunk: str, chunk_index: int, total_chunks: int, title: str) -> str:
    already_markdown = is_markdown_content(chunk)
    action = "paraphrase only" if already_markdown else "paraphrase and add Markdown formatting"

    if already_markdown:
        chunk = chunk[len("```markdown\n"):-len("\n```markdown")]

    prompt = (
        f"You are a psychologist and an expert in healthcare and social sciences, "
        f"as well as a skilled writer. This is chunk {chunk_index}/{total_chunks} of an article titled '{title}'.\n"
        f"\n"
        f"IMPORTANT: Do NOT add any explanations, rules, code snippets, commentary, or any content not present in the original text. Read carefully and think deeply about the content before applying Markdown formatting to avoid missing any details. "
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
        return chunk  # Fallback

# === Process entire content of an article ===
def process_content(content: str, title: str) -> str:
    chunks = split_into_chunks(content)
    if not chunks:
        return ""
    processed_chunks = []
    total_chunks = len(chunks)
    for i, chunk in enumerate(chunks, 1):
        processed_chunks.append(process_chunk(chunk, i, total_chunks, title))
    result = "\n\n".join(processed_chunks)
    if is_markdown_content(content):
        return f"```markdown\n{result}\n```markdown"
    return result

# === Classify category ===
def classify_category(processed_content: str, title: str) -> str:
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
    title = article.get("title", "No Title")
    content = article.get("content", "")

    for attempt in range(1, MAX_RETRIES_PER_ARTICLE + 1):
        try:
            logger.debug(f"Attempt {attempt}/{MAX_RETRIES_PER_ARTICLE} - '{title}'")
            processed_content = process_content(content, title)
            category = classify_category(processed_content, title)
            return {"title": title, "url": article.get("url", ""), "content": processed_content, "category": category}
        except Exception as e:
            logger.error(f"Attempt {attempt} failed for '{title}': {e}")
            if attempt == MAX_RETRIES_PER_ARTICLE:
                logger.warning(f"Skipping '{title}' after {MAX_RETRIES_PER_ARTICLE} attempts")
                return article
            time.sleep(2)
    return article

# === Save temporary results ===
def save_temp_results(processed_data: list, index: int):
    temp_file = f"temp_output_{index}.json"
    with open(temp_file, 'w', encoding='utf-8') as f:
        json.dump(processed_data, f, ensure_ascii=False, indent=2)
    logger.info(f"Saved temporary results to {temp_file} for {index} articles")

# === Main processing function ===
def run_processor():
    print("🚀 Medical Content Processor - Optimized for Large Data")
    print(f"📁 Input file: {INPUT_FILE}")
    print(f"💾 Output file: {OUTPUT_FILE}")
    print(f"🔗 LM Studio URL: {API_URL}")
    print(f"🤖 Model: meta-llama-3.1-8b-instruct")
    print(f"⚙️ Max tokens: {MAX_TOKENS}")
    print(f"📦 Batch size: {SAVE_INTERVAL}")
    print(f"🔄 Chunk size: {(MAX_TOKENS - 1000) * CHARS_PER_TOKEN:,} chars")
    print("-" * 60)

    logger.info(f"Starting processing: {INPUT_FILE}")
    start_time = time.time()
    processed_data_batch = []
    processed_count = 0
    skipped_articles = 0

    # Ensure output file is fresh
    if os.path.exists(OUTPUT_FILE):
        os.remove(OUTPUT_FILE)

    first_item = True
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as out_f:
        out_f.write('[\n')

        try:
            with open(INPUT_FILE, 'r', encoding='utf-8') as f:
                total_articles = sum(1 for _ in ijson.items(open(INPUT_FILE, 'r', encoding='utf-8'), 'item'))
                logger.info(f"Total articles: {total_articles}")
                print(f"📊 Total articles to process: {total_articles}")

                for idx, article in enumerate(ijson.items(f, 'item'), 1):
                    if not isinstance(article, dict) or 'title' not in article or 'content' not in article:
                        logger.warning(f"Skipping invalid article at index {idx}")
                        out_f.write(json.dumps(article, ensure_ascii=False) + (',\n' if not first_item else '\n'))
                        skipped_articles += 1
                        first_item = False
                        continue

                    processed_article = process_article_with_retry(article)
                    if processed_article is article:
                        skipped_articles += 1
                    json_line = json.dumps(processed_article, ensure_ascii=False)
                    if not first_item:
                        out_f.write(',\n' + json_line)
                    else:
                        out_f.write(json_line)
                        first_item = False

                    processed_data_batch.append(processed_article)
                    processed_count += 1

                    if idx % SAVE_INTERVAL == 0:
                        elapsed = time.time() - start_time
                        rate = idx / elapsed if elapsed > 0 else 0
                        print(f"📊 Processed {idx}/{total_articles} articles (skipped {skipped_articles}) - {rate:.1f} art/sec")
                        logger.info(f"Processed {idx}/{total_articles} (skipped {skipped_articles})")
                        save_temp_results(processed_data_batch, idx)
                        processed_data_batch.clear()

                out_f.write('\n]')

        except Exception as e:
            logger.error(f"Error processing file: {e}")
            print(f"❌ Error: {e}")
            out_f.write('\n]')
            sys.exit(1)

    total_time = time.time() - start_time
    print(f"\n✅ Processing completed!")
    print(f"📁 Output saved to: {OUTPUT_FILE}")
    print(f"⏱️ Total time: {total_time:.2f} seconds")
    print(f"📊 Articles processed: {processed_count}")
    print(f"⏭️ Articles skipped: {skipped_articles}")
    if processed_count > 0:
        avg_time = total_time / processed_count
        print(f"⚡ Avg time per article: {avg_time:.2f} seconds")
    logger.info(f"Done. Processed {processed_count} articles, skipped {skipped_articles}.")

# === Main entry point ===
if __name__ == "__main__":
    run_processor()

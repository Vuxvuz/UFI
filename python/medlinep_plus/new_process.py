#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Content Post-Processing Tool - Strict Per Original User Instructions
"""

import json
import re
import csv
from collections import defaultdict
from datetime import datetime

# ==== CONFIG ====
INPUT_FILE = "output/medlineplus_content_cleaned.json"
OUTPUT_FILE = "output/medlineplus_final_processed.json"
DETAILED_REMOVAL_LOG = "output/detailed_removal.log"
CATEGORY_STATS_CSV = "output/category_statistics.csv"
PROCESSING_LOG = "output/post_processing.log"

# ==== STATS ====
stats = {
    'total_articles': 0,
    'processed_articles': 0,
    'removed_articles': 0,
    'removed_by_trash_url': 0,
    'category_counts': defaultdict(int)
}

# ==== LOGGING ====
def log_message(message):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {message}"
    print(line)
    with open(PROCESSING_LOG, "a", encoding="utf-8") as f:
        f.write(line + "\n")

def log_removal(title, url, reason):
    with open(DETAILED_REMOVAL_LOG, "a", encoding="utf-8") as f:
        f.write(f"Removed: {title} | URL: {url} | Reason: {reason}\n")

# ==== STEP 1: FILTER TRASH URL ====
def is_trash_url(url):
    patterns = [r'/about', r'/rss', r'/feed', r'/contact', r'/sitemap']
    return any(re.search(p, url, flags=re.IGNORECASE) for p in patterns)

# ==== STEP 2: CLEAN CONTENT ====
def clean_content_cut_after_html(content):
    """
    Find first *.html or *.htm and cut everything before (keep after).
    If no match, keep entire content.
    """
    if not content:
        return ""
    match = re.search(r'/[^\s]*\.html?', content, flags=re.IGNORECASE)
    if match:
        pos = match.end()
        content = content[pos:]
    return content.strip()

# ==== STEP 3: CLEAN CATEGORY ====
def clean_category(category):
    if not category:
        return ""
    category = category.strip()
    category = re.sub(r'\.html?$', '', category, flags=re.IGNORECASE)
    category = re.sub(r'\.php$', '', category, flags=re.IGNORECASE)
    category = re.sub(r'[^a-zA-Z0-9\-_\s]', '', category)
    category = re.sub(r'\s+', '-', category)
    return category.lower().strip('-')

# ==== PROCESS EACH ARTICLE ====
def process_single_article(article):
    title = article.get('title', '').strip()
    url = article.get('url', '').strip()
    content = article.get('content', '').strip()
    category = article.get('category', '').strip()

    # Step 1: Remove by trash URL
    if is_trash_url(url):
        log_removal(title, url, "trash_url")
        stats['removed_articles'] += 1
        stats['removed_by_trash_url'] += 1
        return None

    # Step 2: Clean content by cutting after *.html
    cleaned_content = clean_content_cut_after_html(content)
    cleaned_category = clean_category(category)

    # Step 3: Count processed
    stats['processed_articles'] += 1
    stats['category_counts'][cleaned_category] += 1

    return {
        'title': title,
        'url': url,
        'content': cleaned_content,
        'category': cleaned_category
    }

# ==== SAVE CATEGORY STATS ====
def save_category_statistics():
    sorted_cats = sorted(stats['category_counts'].items(), key=lambda x: x[1], reverse=True)
    with open(CATEGORY_STATS_CSV, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Category', 'Count'])
        for cat, count in sorted_cats:
            writer.writerow([cat, count])
        writer.writerow(['TOTAL', stats['processed_articles']])

# ==== MAIN RUN ====
def main():
    log_message("🚀 Starting post-processing...")
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        log_message(f"📖 Loaded {len(data)} articles from {INPUT_FILE}")
    except Exception as e:
        log_message(f"❌ Failed to read input file: {str(e)}")
        return

    stats['total_articles'] = len(data)
    processed_articles = []

    for i, article in enumerate(data):
        if i % 100 == 0:
            log_message(f"🔄 Processing article {i+1}/{len(data)}...")
        result = process_single_article(article)
        if result:
            processed_articles.append(result)

    # Sort alphabetically by title
    processed_articles.sort(key=lambda x: x['title'])

    # Save cleaned output
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(processed_articles, f, indent=2, ensure_ascii=False)

    save_category_statistics()

    # Summary
    log_message(f"✅ Total input articles: {stats['total_articles']}")
    log_message(f"✅ Total processed articles: {stats['processed_articles']}")
    log_message(f"❌ Total removed articles: {stats['removed_articles']} (by trash URL: {stats['removed_by_trash_url']})")
    log_message(f"✅ Saved cleaned output to {OUTPUT_FILE}")
    log_message(f"✅ Saved category stats to {CATEGORY_STATS_CSV}")
    log_message(f"✅ See detailed removals in {DETAILED_REMOVAL_LOG}")

if __name__ == "__main__":
    main()


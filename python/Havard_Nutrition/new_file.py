import asyncio
from playwright.async_api import async_playwright
import aiohttp
import re
import json
from tqdm import tqdm
import os

OUTPUT_FOLDER = './final_output'
OUTPUT_FILE = f'{OUTPUT_FOLDER}/final_output.json'
REMOVED_FILE = f'{OUTPUT_FOLDER}/removed_records.csv'
DUPLICATE_FILE = f'{OUTPUT_FOLDER}/duplicate_content_log.csv'
CONCURRENCY = 5
TIMEOUT_MS = 20000

if not os.path.exists(OUTPUT_FOLDER):
    os.makedirs(OUTPUT_FOLDER)

def clean_special(text):
    return re.sub(r'\s+', ' ', text.replace('\t', ' ').replace('\n', ' ')).strip()

async def load_robots_txt(base_url):
    parsed = re.match(r'(https?://[^/]+)', base_url)
    if not parsed:
        return None
    robots_url = parsed.group(1) + '/robots.txt'
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(robots_url) as resp:
                body = await resp.text()
                print(f"🤖 Loaded robots.txt from {robots_url}")
                return body
    except:
        print("⚠️ Failed to load robots.txt, continuing without it.")
        return None

async def main():
    base_url = 'https://nutritionsource.hsph.harvard.edu/'
    seen_titles = set()
    seen_path_title = set()
    content_map = {}
    cleaned_results = []
    removed_records = []
    duplicate_log = []

    robots_txt = await load_robots_txt(base_url)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto(base_url, timeout=TIMEOUT_MS)
        print(f"🔍 Starting crawl at {base_url}")

        top_links = await page.evaluate('''() => {
            const blocks = document.querySelectorAll('.event-block');
            const results = [];
            blocks.forEach(block => {
                const linkEl = block.querySelector('h3 + p a');
                const titleEl = block.querySelector('h4');
                if (linkEl && titleEl) {
                    results.push({
                        title: titleEl.textContent.trim(),
                        url: linkEl.href
                    });
                }
            });
            return results;
        }''')

        print(f"📦 Found {len(top_links)} top-level links.")

        sem = asyncio.Semaphore(CONCURRENCY)
        tasks = []

        async def process_link(link):
            async with sem:
                if not link['href']:
                    removed_records.append({'url': '[empty]', 'reason': 'Empty href'})
                    return
                if any(pat in link['href'].lower() for pat in ['about', 'privacy', 'policy', 'terms', 'contact', 'subscribe']):
                    removed_records.append({'url': link['href'], 'reason': 'Skipped by pattern'})
                    return
                sub_page = await browser.new_page()
                try:
                    resp = await sub_page.goto(link['href'], timeout=TIMEOUT_MS)
                    if not resp or resp.status != 200:
                        raise Exception('Bad HTTP response')

                    raw_content = clean_special(await sub_page.evaluate('document.body.innerText || ""'))
                    h1_title = await sub_page.evaluate('''
                        () => {
                            const h1 = document.querySelector('h1');
                            return h1 ? h1.innerText.trim() : '';
                        }
                    ''')
                    final_title = h1_title or link['text']
                    path_key = re.sub(r'/$', '', re.match(r'(https?://[^?#]+)', link['href']).group(1))
                    path_title_key = f"{path_key}__{final_title}"

                    if path_title_key in seen_path_title:
                        removed_records.append({'url': link['href'], 'reason': 'Duplicate by path and title'})
                        return
                    seen_path_title.add(path_title_key)

                    if raw_content in content_map:
                        duplicate_log.append({
                            'duplicate': {'title': final_title, 'url': link['href']},
                            'original': content_map[raw_content]
                        })
                    else:
                        content_map[raw_content] = {'title': final_title, 'url': link['href']}

                    if final_title not in seen_titles:
                        seen_titles.add(final_title)
                        cleaned_results.append({
                            'title': final_title,
                            'url': link['href'],
                            'content': raw_content
                        })
                except Exception as e:
                    removed_records.append({'url': link['href'], 'reason': f'Error: {str(e)}'})
                finally:
                    await sub_page.close()

        for item in tqdm(top_links, desc="Processing links"):
            await page.goto(item['url'], timeout=TIMEOUT_MS)
            child_links = await page.evaluate('''() => {
                return Array.from(document.querySelectorAll('a')).map(a => ({
                    href: a.href,
                    text: a.textContent.trim()
                }));
            }''')
            for child in child_links:
                tasks.append(process_link(child))

        await asyncio.gather(*tasks)

        await browser.close()

    # Write results
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(cleaned_results, f, indent=2)
    print(f"✅ Final JSON saved: {OUTPUT_FILE}")

    with open(REMOVED_FILE, 'w') as f:
        f.write('url,reason\n')
        for r in removed_records:
            f.write(f"\"{r['url']}\",\"{r['reason'].replace('\"', '\'')}\"\n")
    print(f"✅ Removed records saved: {REMOVED_FILE}")

    with open(DUPLICATE_FILE, 'w') as f:
        f.write('duplicate_title,duplicate_url,matches,original_title,original_url\n')
        for d in duplicate_log:
            f.write(f"\"{d['duplicate']['title']}\",\"{d['duplicate']['url']}\",\"matches\",\"{d['original']['title']}\",\"{d['original']['url']}\"\n")
    print(f"✅ Duplicate content log saved: {DUPLICATE_FILE}")

    print(f"📊 Summary Report:\n✔ Unique titles saved: {len(cleaned_results)}\n❌ Removed/skipped: {len(removed_records)}")

asyncio.run(main())

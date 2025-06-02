#!/usr/bin/env python3
import json
import ijson
import requests
import re
from tqdm import tqdm
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# API endpoint của LM Studio
LM_STUDIO_API = "http://127.0.0.1:1234/v1/completions"

# Các category hợp lệ (đã thêm 'recipes')
VALID_CATEGORIES = {"recipes", "drug&supplement", "mental", "healthylife", "nutrition", "general"}

# Cập nhật prompt: chuyên gia y tế/dinh dưỡng, biết paraphrase,
# và đảm bảo output + prompt < 6500 tokens
PROMPT = """
You are an expert in health, nutrition, mental well-being, and medical topics. You also know how to paraphrase while preserving meaning. Given raw English text containing an article (including its HTML tags), extract and return ONLY the cleaned, formatted main content—no explanations, no commentary, no notes whatsoever. Use your medical expertise to identify relevant sections, preserve important details, and paraphrase where needed to maintain clarity without losing accuracy. Follow these rules:

1. Identify content based on category:
   - If category is "recipes" or "drug&supplement", extract:
     - **Title**
     - Brief introduction (if directly related)
     - **Ingredients** or supplement details (dose, constituents)
     - **Preparation** instructions or usage guidelines
     - **Nutrition Facts** or health benefits (if available)
   - If category is "nutrition" or "healthylife", extract:
     - **Title**
     - **Overview** (context/background)
     - **Recommendations** or guidelines (serving sizes, habits)
     - **Nutrition Facts** (macro/micronutrients) if available
   - If category is "mental", extract:
     - **Title**
     - **Recommendations** or strategies (techniques, exercises)
     - Supporting details (examples, studies, tips)
   - If category is "general" or cannot be determined, extract:
     - **Title**
     - Main body content (key points and details)

2. Remove only obvious noise but preserve medically relevant information:
   - Code blocks (```python```, ```javascript```, ```markdown```: remove entire block)
   - Full advertisements/disclaimers (e.g., “Sponsored by …”, “Click here …”, “Subscribe now …”, “Buy now …”)
   - Long disclaimers (“The Nutrition Source does not recommend or endorse any products”, “The contents of this website are for educational purposes”)
   - Any standalone URL (http://… or https://…): remove the URL text but keep any existing `<a href="…">…</a>` tags

   (Do NOT remove any other HTML tags: keep `<div>`, `<ul>`, `<li>`, `<br>`, etc.)

3. Format for React:
   - Use bold headings exactly like **Title**, **Overview**, **Ingredients**, **Preparation**, **Nutrition Facts**, **Recommendations**
   - Use bullet points (*) for lists (ingredients, recommendations…)
   - Separate each section with two line breaks (`\n\n`)

IMPORTANT: Use your expertise to keep medically important sentences intact. Paraphrase where needed. Output EXACTLY the cleaned and formatted content and NOTHING else. Do NOT add notes, commentary, or apologies.

Category: {category}

Raw text:
{content}

Cleaned and formatted output:
"""

# Tạo session với cơ chế retry
session = requests.Session()
retries = Retry(
    total=3,
    backoff_factor=1,
    status_forcelist=[429, 500, 502, 503, 504]
)
session.mount('http://', HTTPAdapter(max_retries=retries))


def preprocess_text(text: str) -> str:
    """
    Tiền xử lý văn bản:
      - Giữ nguyên tất cả thẻ HTML ngoài khối code.
      - Loại bỏ code blocks, quảng cáo/disclaimer rõ ràng.
      - Loại bỏ standalone URLs.
    """
    if not text or not isinstance(text, str):
        return ""

    # 1. Loại bỏ code blocks: ```python```, ```javascript```, ```markdown```
    text = re.sub(r'```(?:python|javascript|markdown).*?```', '', text, flags=re.DOTALL)

    # 2. Loại bỏ hoàn chỉnh quảng cáo/disclaimer
    patterns_to_remove = [
        r'Sponsored by.*?(?=\n|$)',
        r'Click here.*?(?=\n|$)',
        r'Subscribe now.*?(?=\n|$)',
        r'Buy now.*?(?=\n|$)',
        r'Support The Nutrition Source.*?(?=\n|$)',
        r'Make a Gift.*?(?=\n|$)',
        r'Get Our Newsletter.*?(?=\n|$)',
        r'SIGN UP.*?(?=\n|$)',
        r'The Nutrition Source does not recommend or endorse any products\.',
        r'The contents of this website are for educational purposes.*?(?=\n|$)'
    ]
    for p in patterns_to_remove:
        text = re.sub(p, '', text, flags=re.IGNORECASE)

    # 3. Loại bỏ standalone URLs (không nằm trong thẻ <a>)
    text = re.sub(r'(?<!href=")https?://\S+', '', text)

    # 4. Gộp các dòng trống liên tiếp thành 1 dòng trống
    text = re.sub(r'\n\s*\n', '\n', text).strip()

    return text


def correct_category(item: dict) -> str:
    """
    Sửa category dựa trên URL trước, sau đó dựa trên tiêu đề và nội dung.
    Ưu tiên URL chứa '/recipe' => 'recipes'. Nếu category không hợp lệ => 'general'.
    """
    url = item.get('url', '') or ''
    title = item.get('title', '') or ''
    content = item.get('content', '') or ''
    current = item.get('category', '') or ''

    # 1. Nếu URL chứa '/recipe'
    if '/recipe' in url.lower():
        return 'recipes'

    # 2. Nếu category hiện tại hợp lệ, giữ nguyên (với ngoại lệ mental -> general nếu thấy từ khóa bệnh)
    if current in VALID_CATEGORIES:
        tl = title.lower()
        cl = content.lower()
        if current == 'mental' and ('disease' in tl or 'heart' in tl or 'stroke' in cl):
            return 'general'
        return current

    # 3. Nếu category không hợp lệ, phân loại theo tiêu đề/nội dung
    tl = title.lower()
    cl = content.lower()
    if 'recipe' in tl or 'ingredients' in cl:
        return 'recipes'
    if 'mental' in tl or 'stress' in cl:
        return 'mental'
    if 'nutrition' in tl or 'diet' in cl or 'healthy eating' in cl:
        return 'nutrition'
    if 'lifestyle' in tl or 'active' in cl or 'habits' in cl:
        return 'healthylife'
    if 'supplement' in tl or 'drug' in cl or 'vitamin' in cl:
        return 'drug&supplement'
    return 'general'


def call_model(chunk: str, category: str) -> str:
    """
    Gửi một chunk tới LM Studio, trả về phần cleaned + paraphrased.
    """
    prompt = PROMPT.format(content=chunk, category=category) + "\n<END>"
    payload = {
        "prompt": prompt,
        "temperature": 0.0,
        "max_tokens": 2048,   # Giữ khoảng ≤ 2048 tokens output
        "stop": ["<END>"]
    }
    resp = session.post(LM_STUDIO_API, json=payload, timeout=180)
    resp.raise_for_status()
    text_out = resp.json().get('choices', [{}])[0].get('text', '').strip()
    return re.split(r"<END>", text_out)[0].strip()


def clean_large_content(text: str, category: str) -> str:
    """
    Chia text thành các chunk ~18 000 ký tự (~4 500 tokens):
    - Prompt + chunk ≈ 4 700 tokens, output ≤ 2 048 tokens ⇒ tổng < 6 500.
    Gọi call_model() cho mỗi chunk, ghép kết quả.
    """
    cleaned = preprocess_text(text)
    paras = [p.strip() for p in cleaned.split('\n\n') if p.strip()]
    chunks = []
    current = ""

    for p in paras:
        # Giới hạn chunk ~18 000 ký tự
        if len(current) + len(p) + 2 <= 18000:
            current += p + "\n\n"
        else:
            if current:
                chunks.append(current.strip())
            current = p + "\n\n"
    if current:
        chunks.append(current.strip())

    result_parts = []
    for idx, chunk in enumerate(chunks, start=1):
        tqdm.write(f"[CALL_MODEL] chunk #{idx}: {len(chunk)} chars → Gửi API…")
        try:
            cleaned_chunk = call_model(chunk, category)
            if cleaned_chunk:
                result_parts.append(cleaned_chunk)
        except requests.exceptions.HTTPError as he:
            tqdm.write(f"[HTTP ERROR] chunk #{idx} ({len(chunk)} chars) → {he}. Bỏ chunk này.")
            try:
                tqdm.write(f"   => Response body: {he.response.json()}")
            except:
                tqdm.write(f"   => Response text: {he.response.text}")
        except Exception as e:
            tqdm.write(f"[ERROR] chunk #{idx}: {e}")

    return "\n\n".join(result_parts).strip()


def process_file(input_file: str, output_file: str):
    """
    Đọc từng mục trong input_file, làm sạch content thành chunks ~18 000 ký tự,
    gán category (ưu tiên URL), và lưu kết quả vào output_file.
    """
    try:
        with open(input_file, 'r', encoding='utf-8') as f_in, \
             open(output_file, 'w', encoding='utf-8') as f_out:

            f_out.write('[')
            first = True

            items = ijson.items(f_in, 'item')
            for item in tqdm(items, desc="Đang xử lý các mục JSON"):
                orig_content = item.get('content', '') or ''
                if not orig_content.strip():
                    tqdm.write(f"Bỏ qua mục không có content: {item.get('title','Unknown')}")
                    continue

                # 1. Gán category ưu tiên theo URL hoặc tiêu đề/nội dung
                cat = correct_category(item)
                item['category'] = cat

                # 2. Làm sạch và paraphrase content qua API
                new_content = clean_large_content(orig_content, cat)
                item['content'] = new_content

                # 3. Chuẩn bị object đầu ra
                output_item = {
                    'title': item.get('title', ''),
                    'url': item.get('url', ''),
                    'content': new_content,
                    'category': cat
                }

                # 4. Ghi object vào JSON đầu ra
                if not first:
                    f_out.write(',')
                json.dump(output_item, f_out, ensure_ascii=False)
                f_out.flush()
                first = False

            f_out.write(']')

        print(f"[DONE] Kết quả đã lưu vào: {output_file}")
    except FileNotFoundError:
        print(f"❌ File '{input_file}' không tồn tại. Vui lòng kiểm tra lại đường dẫn.")
    except Exception as e:
        print(f"❌ Lỗi không xác định: {e}")


if __name__ == "__main__":
    INPUT_FILE = 'havard_nutrition.json'
    OUTPUT_FILE = 'cleaned_havard_nutrition2.json'

    # Kiểm tra và in số mục trong JSON đầu vào
    try:
        count = 0
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            for _ in ijson.items(f, 'item'):
                count += 1
        print(f"Số mục trong {INPUT_FILE}: {count}")
    except FileNotFoundError:
        print(f"❌ File '{INPUT_FILE}' không tìm thấy.")
        exit(1)
    except Exception as e:
        print(f"❌ Lỗi khi đếm mục: {e}")
        exit(1)

    # Thực thi quá trình clean/paraphrase và ghi đè file đầu ra
    process_file(INPUT_FILE, OUTPUT_FILE)

import json
import re

# ---------- Cấu hình mapping ----------
# Những key gốc nào sẽ được bỏ qua hoàn toàn (tiếng Latin, “rác”, không phải category hữu dụng)
BLACKLIST = {
    'give', 'giving', 'signup', 'copyright-issue', 'wp-content',
    # Nếu cần bỏ thêm các key khác, add vào đây
}

# Nhóm web-cate để gán lại
WEB_CATEGORIES = {
    'drug&supplement': [
        'vitamin', 'supplement', 'supplements', 'calcium', 'vitamin-d',
        'chloride', 'iodine', 'potassium', 'alcohol', 'workout-supplements'
    ],
    'mental health': [
        'stress', 'sleep', 'mental', 'mindful', 'longevity',
        'disease-prevention'
    ],
    'recipes': [
        'recipe', 'recipes', 'soup', 'salad', 'hummus', 'stew', 'crisp',
        'burger', 'pie', 'pesto', 'stir-fried', 'rigatoni', 'quinoa',
        'arugula', 'corn', 'almond', 'shiitake', 'tomatoes', 'wild',
        'barley', 'farro', 'oatmeal', 'vegetable', 'aquatic', 'brussels',
        'chia', 'chickpeas', 'dark-chocolate', 'eggs', 'seaweed',
        'sweet-potatoes', 'vinegar', 'winter-squash', 'shrimp', 'olive-oil'
    ],
    'nutrition': [
        'nutrition', 'eating', 'carbohydrates', 'healthy-eating',
        'healthy-weight', 'obesity', 'healthy-drinks', 'sports-drinks',
        'energy-drinks', 'salt-and-sodium', 'precision-nutrition',
        'nutrition-and-immunity', 'clean-eating', 'gluten', 'gluten-free',
        'dash-diet', 'intermittent-fasting', 'kale', 'yogurt', 'superfoods',
        'avocados', 'legumes-pulses', 'dairy', 'fish', 'nuts-for-the-heart',
        'milk'
    ],
    'general': [
        'news', 'resources', 'content', 'articles', 'process', 'core', 'pmc',
        'lancet-commission', 'frequently-asked-questions'
    ],
    'healthy life': [
        'staying-active', 'sustainability', 'healthy-longevity',
        'oral-health', 'healthy-food-environment', 'healthy-child-care',
        'healthy-schools', 'healthy-youth-spaces', 'healthy-workplaces',
        'healthy-health-care'
    ]
}

# ---------- Cấu hình lọc URL ----------
URL_BLOCK_PATTERNS = [
    'nutrition-news',    # skip nếu URL chứa 'nutrition-news'
    '#site-content',     # skip nếu URL chứa '#site-content'
    'translation',       # skip nếu chứa 'translation'
    'translate',         # skip nếu chứa 'translate'
    'about',             # skip nếu chứa 'about'
    'giving',            # skip nếu chứa 'giving'
    'sign in'            # skip nếu chứa 'sign in'
]

def is_blocked_url(url: str) -> bool:
    """
    Trả về True nếu URL chứa bất kỳ pattern nào trong URL_BLOCK_PATTERNS.
    """
    if not isinstance(url, str):
        return False
    lower = url.lower()
    for pat in URL_BLOCK_PATTERNS:
        if pat in lower:
            return True
    return False

# ---------- Cấu hình lọc category  ----------
# Đoạn footer/giới thiệu không liên quan trong category cần xoá
FOOTER_SNIPPET = (
    "Support The Nutrition Source Thank you for supporting our mission of translating food and nutrition knowledge into daily practice! "
    "MAKE A GIFT Get Our Newsletter A monthly update filled with nutrition news and tips from Harvard experts—all designed to help you eat healthier. "
    "SIGN UP Harvard Chan Home Harvard University Home Make a Gift Privacy Policy Report Copyright Violation Accessibility "
    "Copyright © 2025 The President and Fellows of Harvard College Terms of Use "
    "The contents of this website are for educational purposes and are not intended to offer personal medical advice. "
    "You should seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. "
    "Never disregard professional medical advice or delay in seeking it because of something you have read on this website. "
    "The Nutrition Source does not recommend or endorse any products."
)

# Nếu category chứa FOOTER_SNIPPET, sẽ xoá đoạn này
def clean_category_text(cat: str) -> str:
    """
    Xóa bỏ FOOTER_SNIPPET nếu có, trim khoảng trắng.
    """
    if not isinstance(cat, str):
        return cat
    return cat.replace(FOOTER_SNIPPET, '').strip()

def assign_web_category(orig_key: str) -> str | None:
    """
    Nhận tên category gốc (đã clean), trả về tên nhóm web-cate mới.
    Trả về None nếu:
      - category rỗng
      - nằm trong BLACKLIST
      - là năm (4 chữ số)
      - không khớp keyword nào (xem như meaningless)
    """
    key = orig_key.lower().strip()
    if not key:
        return None
    # Bỏ qua nếu thuộc blacklist
    if key in BLACKLIST:
        return None
    # Nếu là 4 chữ số (năm), trả về 'general'
    if re.fullmatch(r'\d{4}', key):
        return 'general'
    # Gán category dựa trên từ khóa
    for web_cat, keywords in WEB_CATEGORIES.items():
        for kw in keywords:
            if kw in key:
                return web_cat
    # Nếu không khớp keyword nào, bỏ qua
    return None

# ---------- Hàm chính để xử lý toàn bộ JSON  ----------
def recategorize_json(input_path: str, output_path: str):
    """
    - Đọc JSON từ input_path. Mỗi phần tử có: title, url, content, category.
    - Nếu URL chứa pattern lọc, bỏ qua mục đó.
    - Clean category (xóa FOOTER_SNIPPET).
    - Gọi assign_web_category(category_cleaned) để lấy nhóm web-cate mới.
    - Nếu assign_web_category trả về None, bỏ qua mục.
    - Ngược lại, cập nhật obj['category'] = new_category rồi lưu vào kết quả.
    - Ghi kết quả ra output_path.
    """
    with open(input_path, 'r', encoding='utf-8') as f:
        items = json.load(f)

    result = []
    for obj in items:
        url = obj.get('url', '')
        # Lọc URL
        if is_blocked_url(url):
            continue

        category_raw = obj.get('category', '')
        # Xóa đoạn footer text nếu có
        category_cleaned = clean_category_text(category_raw)
        # Gán lại category
        new_cat = assign_web_category(category_cleaned)
        if new_cat is None:
            continue

        # Cập nhật category và thêm vào danh sách kết quả
        obj['category'] = new_cat
        result.append(obj)

    # Ghi kết quả ra file output
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    # In thống kê nhanh
    from collections import Counter
    counts = Counter(item['category'] for item in result)
    print("=== Thống kê sau khi tái-category ===")
    for cat, cnt in counts.most_common():
        print(f"{cat!r}: {cnt}")

# ---------- Entry point ----------
if __name__ == '__main__':
    INPUT_FILE = './final_output/combined_articles_processed.json'
    OUTPUT_FILE = 'reclassified.json'
    recategorize_json(INPUT_FILE, OUTPUT_FILE)
    print(f"\nĐã ghi xong: '{OUTPUT_FILE}'.")

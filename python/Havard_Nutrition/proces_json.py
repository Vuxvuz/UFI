import json
from collections import Counter

def process_file(input_path: str, output_path: str, stats_path: str):
    """
    - Đọc file JSON đầu vào.
    - Loại bỏ trường 'contenta_markup', giữ lại 'title', 'url', 'category', 
      và đổi 'content_cleaned' thành 'content'.
    - Ghi kết quả ra output_path.
    - Thống kê số lượng theo 'category', in ra console và ghi file stats_path.
    """
    # Đọc dữ liệu từ input.json
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    processed = []
    categories = []

    for item in data:
        title = item.get('title')
        url = item.get('url')
        category = item.get('category')
        content_cleaned = item.get('content_cleaned')

        # Thêm category vào danh sách để thống kê
        categories.append(category)

        new_item = {
            'title': title,
            'url': url,
            'content': content_cleaned,
            'category': category
        }
        processed.append(new_item)

    # Ghi kết quả ra output.json
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(processed, f, ensure_ascii=False, indent=2)

    # Thống kê số lượng theo category
    counter = Counter(categories)
    stats = {cat: count for cat, count in counter.items()}

    # In kết quả thống kê ra console
    print("=== Thống kê số lượng theo category ===")
    for cat, count in stats.items():
        print(f"{cat!r}: {count}")

    # Ghi thống kê ra file category_stats.json
    with open(stats_path, 'w', encoding='utf-8') as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    input_file = './final_output/combined_articles.json'          # File JSON gốc
    output_file = './final_output/combined_articles_processed.json'        # File JSON chứa kết quả đã xử lý
    stats_file = './final_output/category_stats.json' # File JSON chứa thống kê category
    process_file(input_file, output_file, stats_file)
    print(f"\nĐã xử lý xong. Kết quả:\n- '{output_file}' (dữ liệu chính)\n- '{stats_file}' (thống kê category)")

#!/usr/bin/env python3
# merge.py

import os
import json

# ======= CHỈ CẦN CHỈNH 2 HẰNG SỐ DƯỚI ĐÂY =======
INPUT_FOLDER = "./New folder"          # Thư mục chứa file JSON
OUTPUT_FILE  = "./output/merged.json"  # File đầu ra
MIN_LENGTH   = 2000                    # Nếu content ngắn hơn 1000 ký tự, bỏ qua
# ==============================================

def merge_json_files():
    merged_data = []

    # Kiểm tra thư mục tồn tại
    if not os.path.isdir(INPUT_FOLDER):
        print(f"❌ Không tìm thấy thư mục: '{INPUT_FOLDER}'")
        return

    for filename in os.listdir(INPUT_FOLDER):
        if not filename.lower().endswith(".json"):
            continue

        path = os.path.join(INPUT_FOLDER, filename)
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                items = data if isinstance(data, list) else [data]
                for obj in items:
                    content = obj.get("content", "")
                    if isinstance(content, str) and len(content) < MIN_LENGTH:
                        # Bỏ qua nếu content ngắn hơn MIN_LENGTH
                        continue
                    merged_data.append(obj)
        except Exception as e:
            print(f"⚠️ Lỗi ở '{filename}', bỏ qua. ({e})")

    # Tạo thư mục đầu ra nếu cần
    out_dir = os.path.dirname(OUTPUT_FILE)
    if out_dir and not os.path.isdir(out_dir):
        os.makedirs(out_dir, exist_ok=True)

    try:
        with open(OUTPUT_FILE, "w", encoding="utf-8") as out_f:
            json.dump(merged_data, out_f, ensure_ascii=False, indent=2)
        print(f"✅ Đã gộp {len(merged_data)} bản ghi (content ≥ {MIN_LENGTH} ký tự) vào '{OUTPUT_FILE}'.")
    except Exception as e:
        print(f"❌ Lỗi khi ghi file '{OUTPUT_FILE}': {e}")

if __name__ == "__main__":
    merge_json_files()

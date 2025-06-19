import json

def validate_and_filter_json(data, required_keys=None):
    """
    Kiểm tra danh sách đối tượng JSON và trả về danh sách chỉ gồm
    những mục có đủ các trường required_keys và giá trị không rỗng.

    :param data: Danh sách Python (list) chứa các dict đại diện cho JSON objects.
    :param required_keys: Tập các trường bắt buộc (nếu None, mặc định là {"title","url","content","category"}).
    :return: Danh sách các dict hợp lệ.
    """
    if required_keys is None:
        required_keys = {"title", "url", "content", "category"}

    valid_items = []
    for idx, item in enumerate(data):
        if not isinstance(item, dict):
            print(f"Item tại index {idx} không phải object. Bỏ qua.")
            continue

        missing_keys = required_keys - set(item.keys())
        if missing_keys:
            print(f"Item tại index {idx} thiếu keys {missing_keys}. Bỏ qua.")
            continue

        # Kiểm tra giá trị không rỗng
        empty_keys = [k for k in required_keys if not item.get(k)]
        if empty_keys:
            print(f"Item tại index {idx} có giá trị rỗng ở {empty_keys}. Bỏ qua.")
            continue

        valid_items.append(item)

    return valid_items


if __name__ == "__main__":
    """
    Khi chạy script này, nó sẽ hỏi tên file input và tên file output (có thể để trống để không ghi file).
    Ví dụ:
      python validate_json.py
      -> Nhập tên file JSON cần kiểm tra: merged.json
      -> Nhập tên file đầu ra (để trống nếu không cần ghi): merged_valid.json
    """

    # Nhập đường dẫn file JSON đầu vào
    input_path = input("Nhập tên (hoặc đường dẫn) file JSON đầu vào: ").strip()
    if not input_path:
        print("Bạn chưa nhập tên file. Kết thúc.")
        exit(1)

    try:
        with open(input_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Không tìm thấy file: {input_path}")
        exit(1)
    except json.JSONDecodeError as e:
        print(f"File JSON không hợp lệ: {e}")
        exit(1)

    # Nhập tên file output (có thể để trống)
    output_path = input("Nhập tên file JSON đầu ra (để trống nếu không cần ghi): ").strip()

    # Thực hiện validate
    valid_data = validate_and_filter_json(data)

    print(f"\nCó tổng cộng {len(valid_data)} mục hợp lệ trong file `{input_path}`.")

    if output_path:
        try:
            with open(output_path, "w", encoding="utf-8") as f_out:
                json.dump(valid_data, f_out, ensure_ascii=False, indent=2)
            print(f"Đã ghi {len(valid_data)} mục hợp lệ vào file `{output_path}`.")
        except Exception as e:
            print(f"Lỗi khi ghi file `{output_path}`: {e}")

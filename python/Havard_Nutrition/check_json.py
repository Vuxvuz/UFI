#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script để làm sạch file JSON havard_nutrition.json:
- Loại bỏ rác (quảng cáo, menu, footer).
- Giữ lại nội dung chính (danh sách, thông tin quan trọng).
- Định dạng với dòng ngắt (\n) để hiển thị đúng trên React.
"""

import json
import ijson
import requests
from tqdm import tqdm
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# API endpoint của LM Studio
LM_STUDIO_API = "http://127.0.0.1:1234/v1/completions"

# Prompt tối ưu để giữ nội dung và định dạng
PROMPT = """
You are given raw English text containing irrelevant content, such as advertisements, navigation menus, footers, or unrelated text (e.g., "Sponsored by", "Click here", "Subscribe now", "Buy now", or HTML tags). Your task is to:
1. Extract and preserve the main content of the article or text, including all factual information like definitions, lists (e.g., types of vitamins, minerals, recommendations), and other core details.
2. Remove only the noise, such as ads, links, menus, footers, and truly repetitive boilerplate (e.g., repeated headers/footers), but keep all meaningful content intact.
3. Format the cleaned content with proper line breaks (\n) for readability, separating paragraphs, sections, and list items logically. Ensure each major section (e.g., headings, paragraphs, or list items) is separated by a newline (\n), and each list item starts on a new line with a bullet point (*).

Raw text:
{content}

Cleaned and formatted output:
"""

# Tạo session với cơ chế thử lại
session = requests.Session()
retries = Retry(total=3, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
session.mount('http://', HTTPAdapter(max_retries=retries))

def clean_content(text):
    # Debug: In nội dung gốc
    print(f"Before cleaning:\n{text}\n")

    try:
        response = session.post(LM_STUDIO_API, json={
            "prompt": PROMPT.format(content=text),
            "max_tokens": 2048,  # Đủ lớn để giữ nội dung đầy đủ
            "temperature": 0.4
        }, timeout=180)  # Timeout 180 giây
        response.raise_for_status()
        cleaned_text = response.json()['choices'][0]['text'].strip()

        # Hậu xử lý: Đảm bảo các đoạn và danh sách được phân tách bằng \n
        lines = cleaned_text.split('\n')
        cleaned_lines = []
        for line in lines:
            line = line.strip()
            if line:
                # Đảm bảo danh sách có định dạng đúng
                if line.startswith('*') and not line.startswith('* '):
                    line = '* ' + line[1:]
                cleaned_lines.append(line)
        cleaned_text = '\n'.join(cleaned_lines)

        # Debug: In nội dung sau khi làm sạch
        print(f"After cleaning:\n{cleaned_text}\n")
        return cleaned_text
    except Exception as e:
        print(f"Lỗi khi xử lý nội dung: {e}")
        return text  # Trả về nội dung gốc nếu có lỗi

# File đầu vào và đầu ra
input_file = 'havard_nutrition.json'
output_file = 'cleaned_havard_nutrition.json'

# Stream JSON và xử lý từng mục
with open(input_file, 'r', encoding='utf-8') as f_in, \
     open(output_file, 'w', encoding='utf-8') as f_out:
    f_out.write('[')  # Bắt đầu mảng JSON
    first = True
    parser = ijson.items(f_in, 'item')  # Stream từng mục JSON
    for item in tqdm(parser, desc="Đang xử lý các mục JSON"):
        # Làm sạch nội dung
        item['content'] = clean_content(item['content'])
        # Ghi vào file đầu ra
        if not first:
            f_out.write(',')
        json.dump(item, f_out, ensure_ascii=False)
        f_out.flush()  # Ghi ngay lập tức để tiết kiệm bộ nhớ
        first = False
    f_out.write(']')

print(f"JSON đã được làm sạch và lưu vào {output_file}")
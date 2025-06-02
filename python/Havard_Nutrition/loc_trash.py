import json
import re
import difflib

# === CHỈNH Ở ĐÂY ===
INPUT_FILE = './final_output/final_output.json'
OUTPUT_FILE = './final_output/output_cleaned_articles.json'
# ====================

class ContentCleaner:
    def __init__(self, input_file, output_file):
        self.input_file = input_file
        self.output_file = output_file
        self.stats = {
            'total_processed': 0,
            'duplicate_sentences_removed': 0,
            'bracket_content_removed': 0,
            'errors': 0
        }

    def split_into_sentences(self, text):
        return re.split(r'(?<=[.!?])\s+', text)

    def sentences_are_similar(self, s1, s2, threshold=0.5):
        ratio = difflib.SequenceMatcher(None, s1.strip().lower(), s2.strip().lower()).ratio()
        return ratio >= threshold

    def count_common_words(self, s1, s2):
        words1 = set(re.findall(r'\b\w+\b', s1.lower()))
        words2 = set(re.findall(r'\b\w+\b', s2.lower()))
        return len(words1 & words2)

    def clean_repeated_sentences(self, sentences, similarity_threshold=0.5, common_word_threshold=5):
        to_remove = set()

        # Check first 5 sentences
        for i in range(min(5, len(sentences))):
            for j in range(i + 1, min(5, len(sentences))):
                if self.sentences_are_similar(sentences[i], sentences[j], similarity_threshold) or \
                   self.count_common_words(sentences[i], sentences[j]) >= common_word_threshold:
                    to_remove.add(i)
                    to_remove.add(j)

        # Check last 5 sentences
        start = max(0, len(sentences) - 5)
        for i in range(start, len(sentences)):
            for j in range(i + 1, len(sentences)):
                if self.sentences_are_similar(sentences[i], sentences[j], similarity_threshold) or \
                   self.count_common_words(sentences[i], sentences[j]) >= common_word_threshold:
                    to_remove.add(i)
                    to_remove.add(j)

        if to_remove:
            self.stats['duplicate_sentences_removed'] += len(to_remove)
            cleaned_sentences = [s for idx, s in enumerate(sentences) if idx not in to_remove]
            return cleaned_sentences
        else:
            return sentences

    def remove_content_before_last_bracket(self, content):
        last_idx = content.rfind('>')
        if last_idx > 0:
            before = content[:last_idx + 1]
            after = content[last_idx + 1:].strip()
            if len(before) < 0.3 * len(content) and len(after) > 100:
                self.stats['bracket_content_removed'] += 1
                return after
        return None

    def clean_special_characters(self, text):
        text = text.replace('\n', ' ').replace('\t', ' ').replace('\\', ' ').replace('/', ' ')
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def process_article(self, article, index):
        try:
            self.stats['total_processed'] += 1
            content = article.get('content', '')
            if not isinstance(content, str) or not content.strip():
                return article

            original_len = len(content)

            # Step 1: check if we cut by last bracket
            bracket_cleaned = self.remove_content_before_last_bracket(content)
            if bracket_cleaned:
                content = bracket_cleaned
                print(f"🔗 Article {index + 1}: kept only after last '>'")
            else:
                # Step 2: process repeated sentences in two loops
                sentences = [s.strip() for s in self.split_into_sentences(content) if s.strip()]
                cleaned_sentences = self.clean_repeated_sentences(sentences)
                content = ' '.join(cleaned_sentences)

            # Step 3: clean special characters
            content = self.clean_special_characters(content)

            reduced = original_len - len(content)
            if reduced > 0:
                print(f"✅ Article {index + 1} cleaned: {reduced} chars reduced")
            else:
                print(f"✨ Article {index + 1} no change")

            return {
                'title': article.get('title', ''),
                'url': article.get('url', ''),
                'content': content,
                'category': article.get('category', '')
            }
        except Exception as e:
            print(f"❌ Error processing article {index + 1}: {e}")
            self.stats['errors'] += 1
            return article

    def process_json_file(self):
        print(f"🚀 Processing file: {self.input_file}")
        with open(self.input_file, 'r', encoding='utf-8') as f:
            articles = json.load(f)

        cleaned_articles = []
        for i, article in enumerate(articles):
            cleaned = self.process_article(article, i)
            cleaned_articles.append(cleaned)

        with open(self.output_file, 'w', encoding='utf-8') as f:
            json.dump(cleaned_articles, f, ensure_ascii=False, indent=2)

        self.print_stats()
        print(f"\n🎉 Cleaning completed! Output saved to {self.output_file}")

    def print_stats(self):
        print("\n📊 PROCESSING STATISTICS:")
        for key, value in self.stats.items():
            print(f"   {key.replace('_', ' ').capitalize()}: {value}")

if __name__ == '__main__':
    cleaner = ContentCleaner(INPUT_FILE, OUTPUT_FILE)
    cleaner.process_json_file()

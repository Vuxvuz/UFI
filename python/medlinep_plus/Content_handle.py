#!/usr/bin/env python3
"""
Medical Content Processor - Optimized for Large Data
Handles 220MB+ files with 60k+ character texts efficiently
Optimized for 16GB RAM with smart chunking and memory management
"""

import json
import os
import sys
import time
import re
import gc
import hashlib
from typing import Dict, List, Tuple, Optional, Generator
from dataclasses import dataclass
from pathlib import Path
import logging
import requests
import math
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
from queue import Queue

try:
    import ijson
except ImportError as e:
    print(f"Missing required packages: {e}")
    print("Install with: pip install ijson requests")
    sys.exit(1)

# ---------- OPTIMIZED CONFIGURATION ----------
@dataclass
class OptimizedConfig:
    input_file: str = "./output/medlineplus_raw_recursive.json"
    output_file: str = "./output/medlineplus_processed.json"
    cache_file: str = "./cache/category_cache.json"
    content_cache_file: str = "./cache/content_cache.json"
    log_file: str = "./logs/content_processor.log"
    
    # Memory management
    max_memory_items: int = 100  # Process in batches of 100 items
    chunk_size_chars: int = 8000  # Smaller chunks for stability
    max_chunk_tokens: int = 2000  # Conservative token limit per chunk
    overlap_chars: int = 200  # Character overlap between chunks
    
    # LM Studio API settings - OPTIMIZED
    lm_studio_url: str = "http://localhost:1234/v1/chat/completions"
    model_name: str = "llama-3.1-8b-instruct"
    
    # Conservative token limits for stability
    max_tokens: int = 4000  # Reduced from 7500
    safe_token_limit: int = 3500  # More conservative
    classification_max_tokens: int = 10
    content_max_tokens: int = 2500  # Reduced for stability
    
    # Timeout and retry settings
    temperature: float = 0.2
    request_delay: float = 0.7  # Increased delay to prevent overload
    timeout: int = 90  # Increased timeout for large chunks
    max_retries: int = 3
    retry_delay: float = 2.0
    
    # Processing settings
    enable_parallel: bool = False  # Disable parallel processing for stability
    batch_save_interval: int = 50  # Save every 50 items
    
    # Category mapping
    groups: Dict[str, str] = None
    
    def __post_init__(self):
        self.groups = {
            "mental health": "mentalhealth", "mentalhealth": "mentalhealth",
            "mental": "mentalhealth", "psychology": "mentalhealth",
            "psychiatric": "mentalhealth", "depression": "mentalhealth",
            "anxiety": "mentalhealth", "stress": "mentalhealth",
            
            "nutrition": "nutrition", "diet": "nutrition", "food": "nutrition",
            "eating": "nutrition", "vitamin": "nutrition", "mineral": "nutrition",
            "supplements": "nutrition",
            
            "drug": "drug&supplements", "drugs": "drug&supplements",
            "medication": "drug&supplements", "medicine": "drug&supplements",
            "supplement": "drug&supplements", "drug&supplements": "drug&supplements",
            
            "symptom": "symptoms", "symptoms": "symptoms",
            "sign": "symptoms", "signs": "symptoms",
            
            "disease": "diseases", "diseases": "diseases", "condition": "diseases",
            "conditions": "diseases", "disorder": "diseases", "disorders": "diseases",
            "illness": "diseases", "cancer": "diseases", "diabetes": "diseases",
            "heart": "diseases",
            
            "health": "health", "wellness": "health", "fitness": "health",
            "exercise": "health", "prevention": "health", "screening": "health",
            "test": "health", "tests": "health"
        }

# ---------- OPTIMIZED TOKEN MANAGEMENT ----------
def estimate_tokens_fast(text: str) -> int:
    """Fast token estimation using character count (more accurate for medical text)"""
    # Medical text averages ~4.2 chars per token
    return max(1, len(text) // 4)

def smart_truncate(text: str, max_chars: int) -> str:
    """Smart truncation that preserves sentence boundaries"""
    if len(text) <= max_chars:
        return text
    
    # Try to cut at sentence boundary
    truncated = text[:max_chars]
    last_period = truncated.rfind('.')
    last_newline = truncated.rfind('\n')
    
    cut_point = max(last_period, last_newline)
    if cut_point > max_chars * 0.8:  # If we found a good cut point
        return text[:cut_point + 1]
    else:
        return text[:max_chars] + "..."

# ---------- MEMORY-EFFICIENT CACHE ----------
class OptimizedCache:
    """Memory-efficient cache with automatic cleanup"""
    
    def __init__(self, category_cache_file: str, content_cache_file: str, max_memory_entries: int = 1000):
        self.category_cache_file = Path(category_cache_file)
        self.content_cache_file = Path(content_cache_file)
        self.max_memory_entries = max_memory_entries
        
        # Load caches
        self.category_cache = self._load_cache(self.category_cache_file)
        self.content_cache = {}  # Don't load content cache into memory initially
        self._content_cache_hits = 0
        
        # Create cache directories
        os.makedirs(self.category_cache_file.parent, exist_ok=True)
        os.makedirs(self.content_cache_file.parent, exist_ok=True)
    
    def _load_cache(self, cache_file: Path) -> Dict[str, str]:
        if cache_file.exists():
            try:
                with open(cache_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logging.warning(f"Could not load cache {cache_file}: {e}")
        return {}
    
    def _get_content_hash(self, content: str, title: str, category: str) -> str:
        """Generate consistent hash for content"""
        combined = f"{title}|{category}|{content[:1000]}"  # Use first 1000 chars for hash
        return hashlib.md5(combined.encode()).hexdigest()
    
    def get_category(self, category: str) -> Optional[str]:
        return self.category_cache.get(category.lower().strip())
    
    def set_category(self, category: str, group: str) -> None:
        self.category_cache[category.lower().strip()] = group
    
    def get_content(self, content: str, title: str, category: str) -> Optional[str]:
        """Check if content is already processed"""
        content_hash = self._get_content_hash(content, title, category)
        
        # Try memory cache first
        if content_hash in self.content_cache:
            self._content_cache_hits += 1
            return self.content_cache[content_hash]
        
        # Try disk cache
        try:
            if self.content_cache_file.exists():
                with open(self.content_cache_file, 'r', encoding='utf-8') as f:
                    disk_cache = json.load(f)
                    if content_hash in disk_cache:
                        # Add to memory cache if space available
                        if len(self.content_cache) < self.max_memory_entries:
                            self.content_cache[content_hash] = disk_cache[content_hash]
                        return disk_cache[content_hash]
        except Exception:
            pass
        
        return None
    
    def set_content(self, content: str, title: str, category: str, processed_content: str) -> None:
        """Cache processed content"""
        content_hash = self._get_content_hash(content, title, category)
        
        # Add to memory cache with size limit
        if len(self.content_cache) >= self.max_memory_entries:
            # Remove oldest entries (simple FIFO)
            oldest_keys = list(self.content_cache.keys())[:100]
            for key in oldest_keys:
                del self.content_cache[key]
        
        self.content_cache[content_hash] = processed_content
    
    def save_caches(self) -> None:
        """Save caches to disk"""
        # Save category cache
        try:
            with open(self.category_cache_file, 'w', encoding='utf-8') as f:
                json.dump(self.category_cache, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logging.error(f"Could not save category cache: {e}")
        
        # Save content cache (merge with existing)
        try:
            disk_cache = {}
            if self.content_cache_file.exists():
                with open(self.content_cache_file, 'r', encoding='utf-8') as f:
                    disk_cache = json.load(f)
            
            # Merge memory cache into disk cache
            disk_cache.update(self.content_cache)
            
            with open(self.content_cache_file, 'w', encoding='utf-8') as f:
                json.dump(disk_cache, f, indent=2, ensure_ascii=False)
                
        except Exception as e:
            logging.error(f"Could not save content cache: {e}")

# ---------- ROBUST API CLIENT ----------
class RobustLMStudioClient:
    """Robust API client with retry logic and better error handling"""
    
    def __init__(self, config: OptimizedConfig):
        self.config = config
        self.api_available = self._check_api_availability()
        self.request_count = 0
        self.error_count = 0
        self.last_request_time = 0
        self._lock = threading.Lock()
    
    def _check_api_availability(self) -> bool:
        try:
            response = requests.get(
                self.config.lm_studio_url.replace('/chat/completions', '/models'),
                timeout=10
            )
            if response.status_code == 200:
                logging.info("LM Studio API is available")
                return True
        except Exception as e:
            logging.error(f"LM Studio API check failed: {e}")
        
        logging.error("LM Studio API not available!")
        return False
    
    def _enforce_rate_limit(self):
        """Enforce rate limiting between requests"""
        with self._lock:
            current_time = time.time()
            time_since_last = current_time - self.last_request_time
            if time_since_last < self.config.request_delay:
                time.sleep(self.config.request_delay - time_since_last)
            self.last_request_time = time.time()
    
    def call_api_with_retry(self, prompt: str, max_tokens: int, temperature: float = None) -> str:
        """API call with retry logic"""
        if not self.api_available:
            raise Exception("LM Studio API is not available")
        
        if temperature is None:
            temperature = self.config.temperature
        
        # Enforce rate limiting
        self._enforce_rate_limit()
        
        for attempt in range(self.config.max_retries):
            try:
                payload = {
                    "model": self.config.model_name,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "stream": False
                }
                
                response = requests.post(
                    self.config.lm_studio_url,
                    json=payload,
                    timeout=self.config.timeout
                )
                
                if response.status_code == 200:
                    result = response.json()
                    self.request_count += 1
                    return result['choices'][0]['message']['content'].strip()
                else:
                    raise Exception(f"API request failed: {response.status_code} - {response.text}")
                    
            except requests.exceptions.Timeout:
                self.error_count += 1
                if attempt < self.config.max_retries - 1:
                    wait_time = self.config.retry_delay * (attempt + 1)
                    logging.warning(f"Request timeout, retrying in {wait_time}s (attempt {attempt + 1})")
                    time.sleep(wait_time)
                else:
                    raise Exception("Request timed out after all retries")
                    
            except Exception as e:
                self.error_count += 1
                if attempt < self.config.max_retries - 1:
                    wait_time = self.config.retry_delay * (attempt + 1)
                    logging.warning(f"Request failed: {e}, retrying in {wait_time}s")
                    time.sleep(wait_time)
                else:
                    raise
        
        raise Exception("All retry attempts failed")

# ---------- OPTIMIZED CONTENT PROCESSOR ----------
class OptimizedMedicalProcessor:
    """Memory-efficient processor for large medical datasets"""
    
    def __init__(self, config: OptimizedConfig):
        self.config = config
        self.cache = OptimizedCache(config.cache_file, config.content_cache_file)
        self.client = RobustLMStudioClient(config)
        self.processed_count = 0
        self.start_time = time.time()
    
    def classify_category(self, category: str) -> str:
        """Fast category classification with caching"""
        if not category or not category.strip():
            return "general"
        
        category_lower = category.strip().lower()
        
        # Check cache
        cached_result = self.cache.get_category(category_lower)
        if cached_result:
            return cached_result
        
        # Direct mapping
        for key, group in self.config.groups.items():
            if key in category_lower or category_lower in key:
                self.cache.set_category(category_lower, group)
                return group
        
        # LLM classification as fallback
        try:
            valid_groups = ["mentalhealth", "nutrition", "drug&supplements", "symptoms", "diseases", "health", "general"]
            
            prompt = (f"Classify '{category}' into ONE of: {', '.join(valid_groups)}. "
                     f"Respond with ONLY the group name:")
            
            result = self.client.call_api_with_retry(prompt, self.config.classification_max_tokens, 0.0)
            group = result.lower().strip()
            
            if group not in valid_groups:
                for valid_group in valid_groups:
                    if valid_group in group or group in valid_group:
                        group = valid_group
                        break
                else:
                    group = "general"
            
            self.cache.set_category(category_lower, group)
            return group
            
        except Exception as e:
            logging.error(f"Error classifying category '{category}': {e}")
            self.cache.set_category(category_lower, "general")
            return "general"
    
    def smart_chunk_content(self, content: str, max_chars: int) -> List[str]:
        """Smart content chunking that preserves context"""
        if len(content) <= max_chars:
            return [content]
        
        chunks = []
        start = 0
        
        while start < len(content):
            end = start + max_chars
            
            if end >= len(content):
                chunks.append(content[start:])
                break
            
            # Find good break point
            chunk_text = content[start:end]
            
            # Look for paragraph breaks first
            last_double_newline = chunk_text.rfind('\n\n')
            if last_double_newline > max_chars * 0.7:
                end = start + last_double_newline + 2
            else:
                # Look for sentence breaks
                last_period = chunk_text.rfind('. ')
                if last_period > max_chars * 0.7:
                    end = start + last_period + 2
                else:
                    # Look for any newline
                    last_newline = chunk_text.rfind('\n')
                    if last_newline > max_chars * 0.6:
                        end = start + last_newline + 1
            
            chunks.append(content[start:end])
            start = end - self.config.overlap_chars  # Add overlap
            
            # Prevent infinite loop
            if start <= chunks[-1].find(content[start:start+100]):
                start = end
        
        return chunks
    
    def process_content(self, content: str, title: str, category: str) -> str:
        """Process content with smart chunking and caching"""
        if not content or not content.strip():
            return ""
        
        # Check cache first
        cached_result = self.cache.get_content(content, title, category)
        if cached_result:
            return cached_result
        
        # Process based on content size
        content_chars = len(content)
        
        if content_chars <= self.config.chunk_size_chars:
            # Small content - process directly
            processed_content = self._process_single_chunk(content, title, category)
        else:
            # Large content - smart chunking
            processed_content = self._process_large_content(content, title, category)
        
        # Cache result
        self.cache.set_content(content, title, category, processed_content)
        return processed_content
    
    def _process_single_chunk(self, content: str, title: str, category: str) -> str:
        """Process single chunk of content"""
        # Ensure content fits in token limit
        safe_content = smart_truncate(content, self.config.chunk_size_chars)
        
        prompt = f"""Clean and format this medical content for display:

RULES:
- Remove code blocks, ads, disclaimers, standalone URLs
- Keep medical information, HTML tags, structure
- Use **bold** for headings, * for lists
- Separate sections with \\n\\n

Title: {title}
Category: {category}

Content:
{safe_content}

Cleaned output:"""
        
        try:
            result = self.client.call_api_with_retry(prompt, self.config.content_max_tokens)
            return self._clean_response(result)
        except Exception as e:
            logging.error(f"Error processing '{title}': {e}")
            return content  # Return original on error
    
    def _process_large_content(self, content: str, title: str, category: str) -> str:
        """Process large content with smart chunking"""
        chunks = self.smart_chunk_content(content, self.config.chunk_size_chars)
        processed_chunks = []
        
        logging.info(f"Processing {len(chunks)} chunks for '{title}' ({len(content):,} chars)")
        
        for i, chunk in enumerate(chunks):
            try:
                chunk_title = f"{title} (Part {i+1}/{len(chunks)})"
                processed_chunk = self._process_single_chunk(chunk, chunk_title, category)
                processed_chunks.append(processed_chunk)
                
                # Add small delay between chunks to prevent overload
                if i < len(chunks) - 1:
                    time.sleep(0.2)
                    
            except Exception as e:
                logging.error(f"Error processing chunk {i+1} for '{title}': {e}")
                processed_chunks.append(chunk)  # Use original chunk on error
        
        return self._combine_chunks(processed_chunks)
    
    def _combine_chunks(self, chunks: List[str]) -> str:
        """Intelligently combine processed chunks"""
        if not chunks:
            return ""
        if len(chunks) == 1:
            return chunks[0]
        
        # Simple combination with section breaks
        return "\n\n---\n\n".join(chunk.strip() for chunk in chunks if chunk.strip())
    
    def _clean_response(self, response: str) -> str:
        """Clean API response"""
        # Remove common prefixes
        prefixes_to_remove = [
            "Here's the cleaned version:",
            "Cleaned output:",
            "Here is the cleaned content:",
            "The cleaned content is:",
            "Cleaned and formatted output:"
        ]
        
        cleaned = response.strip()
        for prefix in prefixes_to_remove:
            if cleaned.lower().startswith(prefix.lower()):
                cleaned = cleaned[len(prefix):].strip()
        
        # Clean up excessive whitespace
        cleaned = re.sub(r'\n\s*\n\s*\n+', '\n\n', cleaned)
        return cleaned.strip()
    
    def process_file_streaming(self) -> None:
        """Stream process large file with memory management"""
        if not Path(self.config.input_file).exists():
            raise FileNotFoundError(f"Input file not found: {self.config.input_file}")
        
        logging.info(f"Starting streaming processing of: {self.config.input_file}")
        
        processed_items = []
        batch_count = 0
        
        try:
            with open(self.config.input_file, 'rb') as f:  # Binary mode for ijson
                items = ijson.items(f, 'item')
                
                for item_num, item in enumerate(items, 1):
                    try:
                        # Extract and validate fields
                        title = str(item.get('title', '') or "").strip()
                        url = str(item.get('url', '') or "").strip()
                        content = str(item.get('content', '') or "").strip()
                        category = str(item.get('category', '') or "").strip()
                        
                        if not title or not content:
                            logging.warning(f"Skipping item {item_num}: missing title or content")
                            continue
                        
                        # Process category
                        processed_category = self.classify_category(category)
                        
                        # Process content
                        processed_content = self.process_content(content, title, processed_category)
                        
                        # Create processed item
                        processed_item = {
                            "title": title,
                            "url": url,
                            "content": processed_content,
                            "category": processed_category
                        }
                        
                        processed_items.append(processed_item)
                        self.processed_count += 1
                        
                        # Progress logging
                        if item_num % 10 == 0:
                            elapsed = time.time() - self.start_time
                            rate = self.processed_count / elapsed if elapsed > 0 else 0
                            logging.info(f"Processed {self.processed_count} items... ({rate:.1f} items/sec)")
                        
                        # Memory management - save and clear batch
                        if len(processed_items) >= self.config.batch_save_interval:
                            self._save_batch(processed_items, batch_count)
                            processed_items = []  # Clear memory
                            batch_count += 1
                            gc.collect()  # Force garbage collection
                            
                            # Save caches periodically
                            self.cache.save_caches()
                        
                        # Log large content processing
                        if len(content) > 20000:
                            logging.info(f"Processed large content: '{title[:50]}...' ({len(content):,} chars)")
                    
                    except Exception as e:
                        logging.error(f"Error processing item {item_num}: {e}")
                        continue  # Skip problematic items
                
                # Save remaining items
                if processed_items:
                    self._save_batch(processed_items, batch_count)
                
                # Combine all batches into final output
                self._combine_batches(batch_count + 1)
                
        except KeyboardInterrupt:
            logging.info("Processing interrupted by user")
            if processed_items:
                self._save_batch(processed_items, batch_count)
            raise
        
        except Exception as e:
            logging.error(f"Error during streaming processing: {e}")
            if processed_items:
                self._save_batch(processed_items, batch_count)
            raise
        
        finally:
            self.cache.save_caches()
    
    def _save_batch(self, items: List[Dict], batch_num: int) -> None:
        """Save batch to temporary file"""
        batch_file = self.config.output_file.replace('.json', f'_batch_{batch_num:04d}.json')
        os.makedirs(os.path.dirname(batch_file), exist_ok=True)
        
        try:
            with open(batch_file, 'w', encoding='utf-8') as f:
                json.dump(items, f, indent=2, ensure_ascii=False)
            logging.info(f"Saved batch {batch_num} with {len(items)} items to: {batch_file}")
        except Exception as e:
            logging.error(f"Could not save batch {batch_num}: {e}")
    
    def _combine_batches(self, total_batches: int) -> None:
        """Combine all batch files into final output"""
        logging.info(f"Combining {total_batches} batches into final output...")
        
        all_items = []
        output_dir = os.path.dirname(self.config.output_file)
        
        for batch_num in range(total_batches):
            batch_file = self.config.output_file.replace('.json', f'_batch_{batch_num:04d}.json')
            
            if os.path.exists(batch_file):
                try:
                    with open(batch_file, 'r', encoding='utf-8') as f:
                        batch_items = json.load(f)
                        all_items.extend(batch_items)
                    
                    # Clean up batch file
                    os.remove(batch_file)
                    
                except Exception as e:
                    logging.error(f"Error reading batch {batch_num}: {e}")
        
        # Save final combined file
        os.makedirs(os.path.dirname(self.config.output_file), exist_ok=True)
        with open(self.config.output_file, 'w', encoding='utf-8') as f:
            json.dump(all_items, f, indent=2, ensure_ascii=False)
        
        logging.info(f"Final output saved: {self.config.output_file} ({len(all_items)} items)")

# ---------- MAIN EXECUTION ----------
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

def main():
    """Optimized main execution"""
    config = OptimizedConfig()
    
    # Setup logging
    logger = setup_logging(config.log_file)
    logger.info("Starting optimized medical content processing")
    
    # Print configuration
    print("🚀 Medical Content Processor - OPTIMIZED for Large Data")
    print(f"📁 Input file: {config.input_file}")
    print(f"💾 Output file: {config.output_file}")
    print(f"🔗 LM Studio URL: {config.lm_studio_url}")
    print(f"🤖 Model: {config.model_name}")
    print(f"⚙️  Max tokens: {config.max_tokens}")
    print(f"📦 Batch size: {config.batch_save_interval}")
    print(f"🔄 Chunk size: {config.chunk_size_chars:,} chars")
    print("-" * 60)
    
    try:
        processor = OptimizedMedicalProcessor(config)
        start_time = time.time()
        
        processor.process_file_streaming()
        
        # Final statistics
        processing_time = time.time() - start_time
        
        print(f"\n✅ Processing completed successfully!")
        print(f"📁 Output saved to: {config.output_file}")
        print(f"⏱️  Total time: {processing_time:.2f} seconds")
        print(f"📊 Items processed: {processor.processed_count}")
        print(f"🔗 API calls made: {processor.client.request_count}")
        print(f"❌ API errors: {processor.client.error_count}")
        
        if processor.processed_count > 0:
            avg_time = processing_time / processor.processed_count
            print(f"⚡ Average time per item: {avg_time:.2f} seconds")
        
    except KeyboardInterrupt:
        print("\n⏹️  Processing interrupted by user")
        logger.info("Processing interrupted by user")
    except Exception as e:
        print(f"❌ Error: {e}")
        logger.error(f"Processing failed: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
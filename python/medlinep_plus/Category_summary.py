#!/usr/bin/env python3
"""
Medical Data Statistics Script - LM Studio Version
Analyzes medical content and categorizes it using local LM Studio API
"""

import json
import os
import sys
import time
from typing import Dict, Tuple, Optional
from dataclasses import dataclass
from pathlib import Path
import logging
import requests

try:
    import ijson
except ImportError as e:
    print(f"Missing required packages: {e}")
    print("Install with: pip install ijson requests")
    sys.exit(1)

# ---------- CONFIGURATION ----------
@dataclass
class Config:
    input_file: str = "./output/medlineplus_raw_recursive.json"
    cache_file: str = "./cache/category_cache.json"
    log_file: str = "./logs/stats.log"
    
    # Medical categories
    groups: Tuple[str, ...] = (
        "mentalhealth", "nutrition", "drug&supplements", 
        "symptoms", "diseases", "health", "general"
    )
    
    # LM Studio API settings
    lm_studio_url: str = "http://localhost:1234/v1/chat/completions"
    model_name: str = "llama-3.1-8b-instruct"  # Adjust based on loaded model
    max_tokens: int = 5
    temperature: float = 0.0
    request_delay: float = 0.05  # Faster for local API
    timeout: int = 10

# ---------- LOGGING SETUP ----------
def setup_logging(log_file: str) -> logging.Logger:
    """Setup logging configuration"""
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

# ---------- CACHE MANAGEMENT ----------
class CategoryCache:
    """Manages category classification cache"""
    
    def __init__(self, cache_file: str):
        self.cache_file = Path(cache_file)
        self.cache = self._load_cache()
    
    def _load_cache(self) -> Dict[str, str]:
        """Load cache from file"""
        if self.cache_file.exists():
            try:
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError) as e:
                logging.warning(f"Could not load cache: {e}")
        return {}
    
    def save_cache(self) -> None:
        """Save cache to file"""
        try:
            os.makedirs(self.cache_file.parent, exist_ok=True)
            with open(self.cache_file, 'w', encoding='utf-8') as f:
                json.dump(self.cache, f, indent=2, ensure_ascii=False)
        except IOError as e:
            logging.error(f"Could not save cache: {e}")
    
    def get(self, category: str) -> Optional[str]:
        """Get cached classification"""
        return self.cache.get(category)
    
    def set(self, category: str, group: str) -> None:
        """Set cached classification"""
        self.cache[category] = group

# ---------- LM STUDIO CLASSIFIER ----------
class LMStudioClassifier:
    """Handles LM Studio local API calls for category classification"""
    
    def __init__(self, config: Config, cache: CategoryCache):
        self.config = config
        self.cache = cache
        self.request_count = 0
        self.api_available = self._check_api_availability()
    
    def _check_api_availability(self) -> bool:
        """Check if LM Studio API is available"""
        try:
            response = requests.get(
                self.config.lm_studio_url.replace('/chat/completions', '/models'),
                timeout=5
            )
            if response.status_code == 200:
                logging.info("LM Studio API is available")
                return True
        except requests.exceptions.RequestException:
            pass
        
        logging.warning("LM Studio API not available. Make sure LM Studio is running with API server enabled.")
        logging.warning("Models will be classified as 'general'")
        return False
    
    def classify_category(self, category: str) -> str:
        """Classify category into one of the predefined groups"""
        if not category or not category.strip():
            return "general"
        
        category = category.strip().lower()
        
        # Check cache first
        cached_result = self.cache.get(category)
        if cached_result:
            return cached_result
        
        # Use LM Studio API if available
        if not self.api_available:
            return "general"
        
        try:
            result = self._call_lm_studio_api(category)
            self.cache.set(category, result)
            self.request_count += 1
            
            # Save cache periodically
            if self.request_count % 20 == 0:
                self.cache.save_cache()
                logging.info(f"Processed {self.request_count} classifications...")
            
            # Rate limiting (lighter for local API)
            time.sleep(self.config.request_delay)
            
            return result
            
        except Exception as e:
            logging.error(f"Error classifying category '{category}': {e}")
            return "general"
    
    def _call_lm_studio_api(self, category: str) -> str:
        """Make API call to LM Studio"""
        prompt = self._create_prompt(category)
        
        payload = {
            "model": self.config.model_name,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": self.config.temperature,
            "max_tokens": self.config.max_tokens,
            "stream": False
        }
        
        response = requests.post(
            self.config.lm_studio_url,
            json=payload,
            timeout=self.config.timeout
        )
        
        if response.status_code != 200:
            raise Exception(f"API request failed: {response.status_code} - {response.text}")
        
        result = response.json()
        group = result['choices'][0]['message']['content'].strip().lower()
        
        # Validate response
        if group not in self.config.groups:
            # Try to find partial match
            for valid_group in self.config.groups:
                if valid_group in group or group in valid_group:
                    logging.debug(f"Partial match: '{group}' -> '{valid_group}' for category '{category}'")
                    return valid_group
            
            logging.warning(f"Invalid group '{group}' for category '{category}', using 'general'")
            return "general"
        
        return group
    
    def _create_prompt(self, category: str) -> str:
        """Create classification prompt optimized for local LLM"""
        return (
            f"Classify this medical category into exactly ONE of these groups: "
            f"{', '.join(self.config.groups)}.\n"
            f"Category: \"{category}\"\n"
            f"Answer with only the group name:"
        )

# ---------- STATISTICS CALCULATOR ----------
class StatisticsCalculator:
    """Calculates statistics from medical data"""
    
    def __init__(self, config: Config):
        self.config = config
        self.cache = CategoryCache(config.cache_file)
        self.classifier = LMStudioClassifier(config, self.cache)
    
    def compute_stats(self) -> Tuple[float, int, Dict[str, int], Dict[str, int]]:
        """
        Compute statistics from input file
        Returns: (avg_word_count, max_word_count, category_counts, group_counts)
        """
        if not Path(self.config.input_file).exists():
            raise FileNotFoundError(f"Input file not found: {self.config.input_file}")
        
        total_words = 0
        max_words = 0
        count_items = 0
        category_counts = {}
        group_counts = {group: 0 for group in self.config.groups}
        
        logging.info(f"Processing file: {self.config.input_file}")
        start_time = time.time()
        
        try:
            with open(self.config.input_file, 'r', encoding='utf-8') as f:
                items = ijson.items(f, 'item')
                
                for item_num, item in enumerate(items, 1):
                    if item_num % 100 == 0:
                        elapsed = time.time() - start_time
                        rate = item_num / elapsed if elapsed > 0 else 0
                        logging.info(f"Processed {item_num} items... ({rate:.1f} items/sec)")
                    
                    # Process content
                    content = item.get('content', '') or ""
                    word_count = len(content.split())
                    total_words += word_count
                    max_words = max(max_words, word_count)
                    count_items += 1
                    
                    # Process category
                    category = item.get('category', '') or ""
                    category_counts[category] = category_counts.get(category, 0) + 1
                    
                    # Classify into group
                    group = self.classifier.classify_category(category)
                    group_counts[group] += 1
        
        except Exception as e:
            logging.error(f"Error processing file: {e}")
            raise
        
        finally:
            # Save cache
            self.cache.save_cache()
        
        avg_words = (total_words / count_items) if count_items > 0 else 0.0
        processing_time = time.time() - start_time
        logging.info(f"Completed processing {count_items} items in {processing_time:.2f}s")
        
        return avg_words, max_words, category_counts, group_counts

# ---------- RESULTS DISPLAY ----------
def display_results(avg_wc: float, max_wc: int, 
                   cat_counts: Dict[str, int], grp_counts: Dict[str, int],
                   api_calls: int) -> None:
    """Display formatted results"""
    print("\n" + "="*70)
    print("MEDICAL DATA STATISTICS REPORT (LM Studio)")
    print("="*70)
    
    total_items = sum(cat_counts.values())
    
    print(f"\nCONTENT STATISTICS:")
    print(f"  Total items processed: {total_items:,}")
    print(f"  Average words per content: {avg_wc:.2f}")
    print(f"  Maximum words in content: {max_wc:,}")
    print(f"  Unique categories found: {len(cat_counts)}")
    print(f"  LM Studio API calls made: {api_calls}")
    
    print(f"\nTOP 15 CATEGORIES:")
    sorted_cats = sorted(cat_counts.items(), key=lambda x: x[1], reverse=True)[:15]
    for cat, cnt in sorted_cats:
        percentage = (cnt / total_items) * 100 if total_items > 0 else 0
        cat_display = cat if cat else "(empty)"
        print(f"  {cat_display:<35}: {cnt:>6} ({percentage:>5.1f}%)")
    
    print(f"\nGROUP DISTRIBUTION:")
    sorted_groups = sorted(grp_counts.items(), key=lambda x: x[1], reverse=True)
    for grp, cnt in sorted_groups:
        percentage = (cnt / total_items) * 100 if total_items > 0 else 0
        print(f"  {grp:<20}: {cnt:>6} ({percentage:>5.1f}%)")
    
    print("\n" + "="*70)

# ---------- MAIN EXECUTION ----------
def main():
    """Main execution function"""
    config = Config()
    
    # Setup logging
    logger = setup_logging(config.log_file)
    logger.info("Starting medical data statistics analysis with LM Studio")
    
    # Print setup info
    print("LM Studio Medical Data Analyzer")
    print(f"LM Studio URL: {config.lm_studio_url}")
    print(f"Model: {config.model_name}")
    print(f"Input file: {config.input_file}")
    print(f"Cache file: {config.cache_file}")
    print("-" * 50)
    
    try:
        # Create statistics calculator
        calculator = StatisticsCalculator(config)
        
        # Compute statistics
        start_time = time.time()
        avg_wc, max_wc, cat_counts, grp_counts = calculator.compute_stats()
        end_time = time.time()
        
        # Display results
        display_results(avg_wc, max_wc, cat_counts, grp_counts, 
                       calculator.classifier.request_count)
        
        # Performance info
        processing_time = end_time - start_time
        logger.info(f"Total analysis time: {processing_time:.2f} seconds")
        
        if calculator.classifier.request_count > 0:
            avg_time_per_call = processing_time / calculator.classifier.request_count
            logger.info(f"Average time per API call: {avg_time_per_call:.3f} seconds")
        
    except KeyboardInterrupt:
        logger.info("Analysis interrupted by user")
        print("\nAnalysis interrupted by user.")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
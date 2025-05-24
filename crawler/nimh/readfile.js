const fs = require('fs');
const path = require('path');
const { parse } = require('json2csv');

// File paths
const INPUT_FILE = 'nimh_full_articles.json';
const CRAWLED_FILE = 'nimh_articles_content.json';
const OUTPUT_CSV = 'content_comparison.csv';

// Read the input files
try {
  // Read original articles data
  const originalArticles = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  
  // Read crawled content if it exists
  let crawledArticles = [];
  try {
    crawledArticles = JSON.parse(fs.readFileSync(CRAWLED_FILE, 'utf8'));
  } catch (e) {
    console.log('Crawled content file not found or invalid. Will show empty crawled content.');
  }
  
  // Create a map of crawled articles for easy lookup
  const crawledMap = {};
  crawledArticles.forEach(article => {
    crawledMap[article.url] = article.content_en || '';
  });
  
  // Prepare data for CSV
  const data = originalArticles.map(article => {
    // Get a preview of content (first 100 chars)
    const originalPreview = (article.content || '').substring(0, 100) + '...';
    const crawledPreview = (crawledMap[article.url] || '').substring(0, 100) + '...';
    
    // Calculate content length difference
    const originalLength = (article.content || '').length;
    const crawledLength = (crawledMap[article.url] || '').length;
    const lengthDiff = crawledLength - originalLength;
    
    return {
      title: article.title,
      url: article.url,
      originalContentPreview: originalPreview,
      originalContentLength: originalLength,
      crawledContentPreview: crawledPreview,
      crawledContentLength: crawledLength,
      contentLengthDiff: lengthDiff,
      status: crawledMap[article.url] ? 'Crawled' : 'Not Crawled'
    };
  });
  
  // Convert to CSV
  const csv = parse(data);
  
  // Write to file
  fs.writeFileSync(OUTPUT_CSV, csv);
  console.log(`✅ Comparison CSV created at ${OUTPUT_CSV}`);
  
  // Summary
  const crawledCount = data.filter(item => item.status === 'Crawled').length;
  console.log(`📊 Summary: Total articles: ${data.length}, Crawled: ${crawledCount}, Not crawled: ${data.length - crawledCount}`);
  
} catch (err) {
  console.error(`❌ Error: ${err.message}`);
}
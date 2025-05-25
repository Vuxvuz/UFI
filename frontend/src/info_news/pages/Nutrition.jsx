// frontend/src/info_news/pages/Nutrition.jsx
import React, { useEffect, useState } from 'react';
import ArticleList from '../components/ArticleList';
import articlesData from '../../data/articles.json'; // Import your local data

export default function Nutrition() {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    // Use local data for Nutrition
    setArticles(articlesData.nutrition);
  }, []);

  return (
    <div className="container mt-5">
      <h2>Nutrition News</h2>
      <ArticleList articles={articles} />
    </div>
  );
}
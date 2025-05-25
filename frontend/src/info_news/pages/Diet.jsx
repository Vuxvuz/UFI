// frontend/src/info_news/pages/Diet.jsx
import React, { useEffect, useState } from 'react';
import ArticleList from '../components/ArticleList';
import articlesData from '../../data/articles.json'; // Import your local data

export default function Diet() {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    // Use local data for Diet
    setArticles(articlesData.diet);
  }, []);

  return (
    <div className="container mt-5">
      <h2>Diet News</h2>
      <ArticleList articles={articles} />
    </div>
  );
}
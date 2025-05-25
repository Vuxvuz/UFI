// frontend/src/info_news/pages/Diseases.jsx
import React, { useEffect, useState } from 'react';
import ArticleList from '../components/ArticleList';
import articlesData from '../../data/articles.json'; // Import your local data

export default function Diseases() {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    // Use local data for Diseases
    setArticles(articlesData.diseases);
  }, []);

  return (
    <div className="container mt-5">
      <h2>Diseases News</h2>
      <ArticleList articles={articles} />
    </div>
  );
}
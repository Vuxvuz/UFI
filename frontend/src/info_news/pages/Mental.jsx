// frontend/src/info_news/pages/Mental.jsx
import React, { useEffect, useState } from 'react';
import ArticleList from '../components/ArticleList';
import articlesData from '../../data/articles.json'; // Import your local data

export default function Mental() {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    // Use local data for Mental Health
    setArticles(articlesData.mental);
  }, []);

  return (
    <div className="container mt-5">
      <h2>Mental Health News</h2>
      <ArticleList articles={articles} />
    </div>
  );
}
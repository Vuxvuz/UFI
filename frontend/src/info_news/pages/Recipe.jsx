import React, { useEffect, useState } from 'react';
import ArticleList from '../components/ArticleList';
import { API } from '../../services/api';
import './NewsPage.css';

export default function Recipe() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const response = await API.get('/api/articles/category/recipe');
        setArticles(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching recipe articles:', error);
        setError('Không thể tải bài viết. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Healthy Recipes</h1>
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card category-card">
            <div className="card-body d-flex align-items-center">
              <div className="category-icon bg-danger text-white p-3 rounded me-3">
                <i className="fas fa-utensils fa-2x"></i>
              </div>
              <div>
                <h3 className="card-title">These recipes show you how to prepare tasty, quick meals as part of a healthy lifestyle</h3>
                <p className="card-text">Find delicious and nutritious recipes to support your health goals and dietary needs.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {loading && <p>Đang tải dữ liệu...</p>}
      {error && <p className="text-danger">{error}</p>}
      {!loading && !error && <ArticleList articles={articles} />}
    </div>
  );
}

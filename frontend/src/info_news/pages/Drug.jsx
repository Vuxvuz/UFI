import React, { useEffect, useState } from 'react';
import ArticleList from '../components/ArticleList';
import { API } from '../../services/api';
import './NewsPage.css';

export default function Drug() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const response = await API.get('/api/articles/category/drug');
        setArticles(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching drug articles:', error);
        setError('Không thể tải bài viết. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Drugs & Supplements</h1>
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card category-card">
            <div className="card-body d-flex align-items-center">
              <div className="category-icon bg-success text-white p-3 rounded me-3">
                <i className="fas fa-pills fa-2x"></i>
              </div>
              <div>
                <h3 className="card-title">Prescription drugs, over-the-counter medicines, herbs, and supplements</h3>
                <p className="card-text">Find information about prescription drugs, over-the-counter medicines, herbs, and dietary supplements.</p>
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

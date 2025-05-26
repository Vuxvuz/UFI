import React, { useEffect, useState } from 'react';
import ArticleList from '../components/ArticleList';
import { API } from '../../services/api';
import './NewsPage.css';

export default function Health() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const response = await API.get('/api/articles', {
          params: { category: 'health' }
        });
        console.log('API response:', response.data);
        setArticles(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="jumbotron">
            <h1 className="display-4">Tin tức sức khỏe</h1>
            <p className="lead">
              Cập nhật những thông tin mới nhất về sức khỏe, dinh dưỡng và lối sống lành mạnh.
            </p>
          </div>
        </div>
      </div>
      
      {loading && <p>Đang tải dữ liệu...</p>}
      {error && <p className="text-danger">{error}</p>}
      {!loading && !error && articles.length === 0 && <p>Không có bài viết mới.</p>}
      {!loading && !error && articles.length > 0 && <ArticleList articles={articles} />}
    </div>
  );
} 
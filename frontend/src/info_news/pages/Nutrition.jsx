import React, { useEffect, useState } from 'react';
import ArticleList from '../components/ArticleList';
import { API } from '../../services/api';
import './NewsPage.css';

export default function Nutrition() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        console.log('Đang gọi API lấy dữ liệu nutrition...');
        
        // Thử một số biến thể của endpoint để xác định vấn đề
        let response;
        try {
          // Phương án 1: Dùng /category/ với chữ thường
          response = await API.get('/api/articles/category/nutrition');
          console.log('Kết quả API nutrition (lowercase):', response);
        } catch (err) {
          console.log('Lỗi khi gọi API với lowercase:', err);
          
          try {
            // Phương án 2: Dùng /category/ với chữ hoa đầu
            response = await API.get('/api/articles/category/Nutrition');
            console.log('Kết quả API nutrition (capitalized):', response);
          } catch (err) {
            console.log('Lỗi khi gọi API với capitalized:', err);
            
            // Phương án 3: Dùng query params
            response = await API.get('/api/articles', {
              params: { category: 'nutrition' }
            });
            console.log('Kết quả API nutrition (query params):', response);
          }
        }
        
        if (response && response.data) {
          setArticles(response.data);
        } else {
          throw new Error('Không nhận được dữ liệu hợp lệ');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching nutrition articles:', error);
        setError('Không thể tải bài viết về dinh dưỡng. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Nutrition</h1>
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card category-card">
            <div className="card-body d-flex align-items-center">
              <div className="category-icon bg-warning text-white p-3 rounded me-3">
                <i className="fas fa-apple-alt fa-2x"></i>
              </div>
              <div>
                <h3 className="card-title">Explore nutrition information, dietary guidelines, and health benefits</h3>
                <p className="card-text">Discover nutritional information, healthy eating guides, and how different foods impact your health.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {loading && <p>Đang tải dữ liệu...</p>}
      {error && <p className="text-danger">{error}</p>}
      {!loading && !error && articles.length === 0 && (
        <p>Không có bài viết về dinh dưỡng.</p>
      )}
      {!loading && !error && articles.length > 0 && <ArticleList articles={articles} />}
    </div>
  );
}

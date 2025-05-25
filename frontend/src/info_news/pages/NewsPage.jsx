// frontend/src/info_news/pages/NewsPage.jsx
import React from 'react';
import CategoryList from '../components/CategoryList';

export default function NewsPage() {
  return (
    <div className="container mt-5">
      <h1 className="mb-4"> News</h1>
      <CategoryList />
    </div>
  );
}
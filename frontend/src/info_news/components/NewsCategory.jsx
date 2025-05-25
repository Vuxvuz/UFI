import React from 'react';
import { Link } from 'react-router-dom';

export default function CategoryList() {
  const categories = [
    { name: 'Nutrition', path: '/news/nutrition' },
    { name: 'Drugs', path: '/news/drugs' },
    { name: 'Mental Health', path: '/news/mental-health' },
    { name: 'News', path: '/news/news' },
    { name: 'Diseases', path: '/news/diseases' },
  ];

  return (
    <div className="list-group">
      {categories.map((category) => (
        <Link
          key={category.name}
          to={category.path}
          className="list-group-item list-group-item-action"
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}

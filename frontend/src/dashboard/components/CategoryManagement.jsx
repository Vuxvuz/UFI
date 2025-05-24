import React, { useState, useEffect } from 'react';
import { listCategories, addCategory, deleteCategory } from '../../services/forumService';

function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadCategories();
  }, []);
  
  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await listCategories();
      if (response && response.data) {
        setCategories(response.data || []);
        setError(null);
      } else {
        setCategories([]);
        setError('No categories found or invalid response');
      }
    } catch (err) {
      console.error('Error loading categories:', err);
      setError(err.response?.data?.message || 'Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddCategory = async (e) => {
    e.preventDefault();
    
    if (!newCategory.trim()) {
      setError('Category name cannot be empty');
      return;
    }
    
    setLoading(true);
    try {
      await addCategory(newCategory.trim());
      setNewCategory('');
      setError(null);
      await loadCategories();
    } catch (err) {
      console.error('Error adding category:', err);
      setError(err.response?.data?.message || 'Failed to add category');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteCategory = async (categoryName) => {
    if (!window.confirm(`Are you sure you want to delete the "${categoryName}" category?`)) {
      return;
    }
    
    setLoading(true);
    try {
      // Note: This will fail with the current implementation since Category is an enum
      // This is just UI for future implementation when Category becomes a database entity
      await deleteCategory(categoryName);
      loadCategories();
      setError(null);
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err.response?.data?.message || 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <h2 className="text-2xl font-semibold mb-6">Category Management</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">
          {error}
        </div>
      )}
      
      <div className="bg-white p-6 rounded shadow mb-6">
        <h3 className="text-lg font-medium mb-4">Current Categories</h3>
        
        {loading && categories.length === 0 ? (
          <p className="text-gray-500">Loading categories...</p>
        ) : categories.length === 0 ? (
          <p className="text-gray-500">No categories found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(category => (
              <div 
                key={category} 
                className="flex justify-between items-center p-3 border rounded"
              >
                <span>{category}</span>
                <button
                  onClick={() => handleDeleteCategory(category)}
                  className="text-red-600 hover:text-red-800"
                  title="Delete Category"
                  disabled={loading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-lg font-medium mb-4">Add New Category</h3>
        
        <form onSubmit={handleAddCategory} className="flex items-center space-x-2">
          <input
            type="text"
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            className="flex-1 border rounded p-2"
            placeholder="Category name"
            disabled={loading}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded"
            disabled={loading || !newCategory.trim()}
          >
            {loading ? 'Adding...' : 'Add Category'}
          </button>
        </form>
        
        <div className="mt-4 text-sm text-gray-500">
          <p>
            <strong>Note:</strong> The current implementation uses an enum for categories.
            To make this feature fully functional, you need to convert the Category type
            from an enum to a database entity.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CategoryManagement; 
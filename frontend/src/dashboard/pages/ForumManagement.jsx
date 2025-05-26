import React, { useState, useEffect } from 'react';
import { hasPermission } from '../../utils/permissionUtils';
import { Navigate } from 'react-router-dom';

export default function ForumManagement() {
  // Check permissions
  if (!hasPermission('forums:manage')) {
    return <Navigate to="/dashboard" replace />;
  }
  
  const [activeTab, setActiveTab] = useState('topics');
  const [topics, setTopics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  
  // Mock data for demonstration
  useEffect(() => {
    // This would normally be API calls
    setTimeout(() => {
      setTopics([
        { id: 1, title: 'Getting Started Guide', category: 'General', author: 'Admin', posts: 24, createdAt: '2023-05-12', isSticky: true, isLocked: false },
        { id: 2, title: 'Feature Request: Dark Mode', category: 'Suggestions', author: 'John Smith', posts: 8, createdAt: '2023-06-20', isSticky: false, isLocked: false },
        { id: 3, title: 'Help with API Integration', category: 'Technical Support', author: 'Alice Johnson', posts: 15, createdAt: '2023-06-15', isSticky: false, isLocked: false },
        { id: 4, title: 'Community Guidelines', category: 'Announcements', author: 'Admin', posts: 5, createdAt: '2023-04-10', isSticky: true, isLocked: true },
        { id: 5, title: 'Bug Report: Login Issues', category: 'Technical Support', author: 'Robert Lee', posts: 12, createdAt: '2023-06-25', isSticky: false, isLocked: false },
      ]);
      
      setCategories([
        { id: 1, name: 'General', topicCount: 6, postCount: 45 },
        { id: 2, name: 'Announcements', topicCount: 2, postCount: 8 },
        { id: 3, name: 'Technical Support', topicCount: 12, postCount: 87 },
        { id: 4, name: 'Suggestions', topicCount: 8, postCount: 32 },
      ]);
      
      setLoading(false);
    }, 800);
  }, []);
  
  // Filter topics based on search term
  const filteredTopics = topics.filter(topic => 
    topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handle adding a new category
  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    
    // Add category (would be an API call in real implementation)
    const newId = Math.max(...categories.map(c => c.id)) + 1;
    setCategories([...categories, { id: newId, name: newCategory, topicCount: 0, postCount: 0 }]);
    setNewCategory('');
  };
  
  // Handle editing a category
  const handleUpdateCategory = () => {
    if (!categoryToEdit || !categoryToEdit.name.trim()) return;
    
    // Update category (would be an API call in real implementation)
    setCategories(categories.map(category => 
      category.id === categoryToEdit.id ? {...category, name: categoryToEdit.name} : category
    ));
    setCategoryToEdit(null);
  };
  
  // Handle deleting a category
  const handleDeleteCategory = (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? All associated topics and posts will be moved to the General category.')) {
      return;
    }
    
    // Delete category (would be an API call in real implementation)
    setCategories(categories.filter(category => category.id !== categoryId));
  };
  
  // Handle toggling sticky status for a topic
  const handleToggleSticky = (topicId) => {
    // Toggle sticky status (would be an API call in real implementation)
    setTopics(topics.map(topic => 
      topic.id === topicId ? {...topic, isSticky: !topic.isSticky} : topic
    ));
  };
  
  // Handle toggling locked status for a topic
  const handleToggleLocked = (topicId) => {
    // Toggle locked status (would be an API call in real implementation)
    setTopics(topics.map(topic => 
      topic.id === topicId ? {...topic, isLocked: !topic.isLocked} : topic
    ));
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Forum Management</h2>
      </div>
      
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'topics' ? 'active' : ''}`}
            onClick={() => setActiveTab('topics')}
          >
            Topics
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            Categories
          </button>
        </li>
      </ul>
      
      {activeTab === 'topics' && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="mb-4">
              <input
                type="text"
                className="form-control"
                placeholder="Search topics..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Author</th>
                      <th>Posts</th>
                      <th>Created</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTopics.map(topic => (
                      <tr key={topic.id}>
                        <td>
                          {topic.isSticky && <i className="bi bi-pin-angle-fill text-warning me-2"></i>}
                          {topic.isLocked && <i className="bi bi-lock-fill text-danger me-2"></i>}
                          {topic.title}
                        </td>
                        <td>{topic.category}</td>
                        <td>{topic.author}</td>
                        <td>{topic.posts}</td>
                        <td>{new Date(topic.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="d-flex gap-2">
                            {topic.isSticky && <span className="badge bg-warning">Sticky</span>}
                            {topic.isLocked && <span className="badge bg-danger">Locked</span>}
                            {!topic.isSticky && !topic.isLocked && <span className="badge bg-success">Active</span>}
                          </div>
                        </td>
                        <td>
                          <div className="btn-group">
                            <button 
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleToggleSticky(topic.id)}
                              title={topic.isSticky ? "Remove Sticky" : "Make Sticky"}
                            >
                              <i className={`bi ${topic.isSticky ? 'bi-pin-angle' : 'bi-pin-angle-fill'}`}></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleToggleLocked(topic.id)}
                              title={topic.isLocked ? "Unlock Topic" : "Lock Topic"}
                            >
                              <i className={`bi ${topic.isLocked ? 'bi-unlock' : 'bi-lock'}`}></i>
                            </button>
                            <button className="btn btn-sm btn-outline-danger" title="Delete Topic">
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'categories' && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            {hasPermission('forums:manageCategories') && (
              <div className="mb-4">
                <h5 className="mb-3">Add New Category</h5>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Category name"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                  />
                  <button 
                    className="btn btn-primary"
                    onClick={handleAddCategory}
                    disabled={!newCategory.trim()}
                  >
                    Add Category
                  </button>
                </div>
              </div>
            )}
            
            {categoryToEdit && (
              <div className="mb-4 p-3 border rounded bg-light">
                <h5 className="mb-3">Edit Category</h5>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    value={categoryToEdit.name}
                    onChange={e => setCategoryToEdit({...categoryToEdit, name: e.target.value})}
                  />
                  <button 
                    className="btn btn-success"
                    onClick={handleUpdateCategory}
                    disabled={!categoryToEdit.name.trim()}
                  >
                    Update
                  </button>
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => setCategoryToEdit(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Category Name</th>
                      <th>Topics</th>
                      <th>Posts</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map(category => (
                      <tr key={category.id}>
                        <td>{category.name}</td>
                        <td>{category.topicCount}</td>
                        <td>{category.postCount}</td>
                        <td>
                          {hasPermission('forums:manageCategories') && (
                            <div className="btn-group">
                              <button 
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => setCategoryToEdit(category)}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              {/* Don't allow deleting the General category */}
                              {category.name !== 'General' && (
                                <button 
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDeleteCategory(category.id)}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 
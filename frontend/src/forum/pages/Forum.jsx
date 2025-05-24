// frontend/src/forum/pages/Forum.jsx
import React, { useState, useEffect } from "react";
import { listTopics, createTopic, listCategories, addCategory, deleteCategory, updateCategory, votePost } from "../../services/forumService";
import { Link } from "react-router-dom";
import CategoryBadge from "../components/CategoryBadge";

export default function Forum() {
  const [topics, setTopics] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newCat, setNewCat] = useState("ALL");
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [categories, setCategories] = useState(["GENERAL", "WORKOUT", "NUTRITION", "SHOWOFF"]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Check if user is admin/moderator
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        setIsAdmin(localStorage.getItem('role') === 'ADMIN' || localStorage.getItem('role') === 'MODERATOR');
      } catch (err) {
        console.error("Error checking user role:", err);
      }
    };
    
    checkUserRole();
  }, []);

  // Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await listCategories();
        if (response.result === "SUCCESS" && response.data) {
          setCategories(response.data);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    
    fetchCategories();
  }, []);

  // Load topics function that can be called from anywhere
  const loadTopics = async () => {
    try {
      const filter = newCat !== "ALL" ? newCat : null;
      const response = await listTopics(filter);
      
      if (response.data && response.result === "SUCCESS") {
        setTopics(response.data || []);
      } else {
        setTopics([]);
      }
    } catch (err) {
      console.error("Error loading topics:", err);
      setError("Failed to load topics");
    }
  };

  // Load topics when mount or when newCat changes
  useEffect(() => {
    loadTopics();
  }, [newCat]);

  // Create new topic
  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    
    setIsSubmitting(true);
    try {
      await createTopic({
        title: newTitle.trim(),
        category: { name: newCat === "ALL" ? "GENERAL" : newCat }
      });
      setNewTitle("");
      await loadTopics();
    } catch (err) {
      console.error("Error creating topic:", err);
      setError("Failed to create topic");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add new category (admin only)
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      await addCategory(newCategoryName.trim());
      setNewCategoryName("");
      
      // Refresh categories
      const response = await listCategories();
      if (response.result === "SUCCESS" && response.data) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error("Error adding category:", err);
      setError("Failed to add category");
    }
  };

  // Start editing a category
  const handleEditCategoryStart = (category) => {
    setCategoryToEdit(category);
    setEditCategoryName(category);
  };

  // Update category name
  const handleUpdateCategory = async () => {
    if (!editCategoryName.trim() || !categoryToEdit) return;
    
    try {
      await updateCategory(categoryToEdit, editCategoryName.trim());
      setCategoryToEdit(null);
      setEditCategoryName("");
      
      // Refresh categories
      const response = await listCategories();
      if (response.result === "SUCCESS" && response.data) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error("Error updating category:", err);
      setError("Failed to update category");
    }
  };

  // Delete category
  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Are you sure you want to delete the category "${category}"?`)) {
      return;
    }
    
    try {
      await deleteCategory(category);
      
      // Refresh categories
      const response = await listCategories();
      if (response.result === "SUCCESS" && response.data) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error("Error deleting category:", err);
      setError("Failed to delete category");
    }
  };

  // Handle voting for a topic
  const handleVote = async (topicId, isUpvote) => {
    try {
      await votePost(topicId, isUpvote);
      await loadTopics(); // Reload to get updated vote counts
    } catch (err) {
      console.error("Error voting:", err);
      setError("Could not vote. Please try again.");
    }
  };

  // Format vote count 
  const formatVoteCount = (upvotes, downvotes) => {
    return upvotes - downvotes;
  };

  // Add this function to filter topics based on search
  const filteredTopics = topics.filter(topic => 
    topic.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mt-4">
      <div className="row mb-4">
        <div className="col-md-8">
          <h2>Forum</h2>
        </div>
        <div className="col-md-4 text-end">
          <div className="d-flex my-3">
            <div className="input-group me-2">
              <input
                type="text"
                className="form-control"
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="btn btn-outline-secondary" type="button">
                <i className="fa fa-search"></i>
              </button>
            </div>
            <button 
              className="btn btn-primary" 
              data-bs-toggle="modal" 
              data-bs-target="#createTopicModal"
            >
              Tạo Topic
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
          <button className="btn btn-sm btn-outline-danger ms-2" onClick={() => setError("")}>
            Clear
          </button>
        </div>
      )}

      {/* Category filter */}
      <div className="d-flex mb-4 align-items-center">
        <div className="dropdown me-2">
          <button className="btn btn-outline-secondary dropdown-toggle" type="button" id="categoryDropdown" data-bs-toggle="dropdown" aria-expanded="false">
            {newCat === "ALL" ? "All Categories" : newCat}
          </button>
          <ul className="dropdown-menu" aria-labelledby="categoryDropdown">
            <li><a className="dropdown-item" href="#" onClick={() => setNewCat("ALL")}>All Categories</a></li>
            {categories.map((cat, index) => (
              <li key={index}><a className="dropdown-item" href="#" onClick={() => setNewCat(cat)}>{cat}</a></li>
            ))}
          </ul>
        </div>
        
        {/* Create topic form */}
        <div className="input-group me-2">
          <input 
            type="text" 
            className="form-control" 
            placeholder="Nhập tiêu đề..." 
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <button 
            className="btn btn-primary" 
            type="button" 
            onClick={handleCreate}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang tạo...' : 'Tạo Topic'}
          </button>
        </div>
      </div>

      {/* Topics list */}
      <div className="list-group">
        {topics.length === 0 ? (
          <div className="text-center p-3">No topics found</div>
        ) : (
          filteredTopics.map(topic => (
            <div key={topic.id} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                {/* Voting buttons */}
                <div className="d-flex flex-column align-items-center me-3">
                  <button 
                    className={`btn btn-sm ${topic.userVoteIsUpvote === true ? 'btn-success' : 'btn-outline-secondary'}`}
                    onClick={() => handleVote(topic.id, true)}
                  >
                    <i className="fa fa-arrow-up"></i>
                  </button>
                  <span className="my-1">{formatVoteCount(topic.upvotes, topic.downvotes)}</span>
                  <button 
                    className={`btn btn-sm ${topic.userVoteIsUpvote === false ? 'btn-danger' : 'btn-outline-secondary'}`}
                    onClick={() => handleVote(topic.id, false)}
                  >
                    <i className="fa fa-arrow-down"></i>
                  </button>
                </div>
                
                <div>
                  <Link 
                    to={`/forum/${topic.id}`} 
                    className="topic-title"
                  >
                    {topic.title}
                  </Link>
                  <div>
                    <CategoryBadge category={topic.category} />
                    <small className="text-muted ms-2">by {topic.author}</small>
                  </div>
                </div>
              </div>
              
              <span className="text-muted">
                {new Date(topic.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Create Topic Modal */}
      <div className="modal fade" id="createTopicModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Create New Topic</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreate}>
                <div className="mb-3">
                  <label htmlFor="topicTitle" className="form-label">Topic Title</label>
                  <input
                    type="text"
                    className="form-control"
                    id="topicTitle"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="topicCategory" className="form-label">Category</label>
                  <select
                    className="form-select"
                    id="topicCategory"
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                  >
                    <option value="ALL">All</option>
                    {categories.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={!newTitle.trim() || isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Topic'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Admin/Moderator Category Management */}
      {isAdmin && (
        <div className="card mb-3">
          <div className="card-header bg-light">Category Management (Admin/Moderator)</div>
          <div className="card-body">
            <div className="mb-3 d-flex">
              <input
                type="text"
                className="form-control me-2"
                placeholder="New category name..."
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
              />
              <button 
                className="btn btn-success"
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
              >
                Add Category
              </button>
            </div>
            
            <div className="mt-3">
              <h6>Manage Existing Categories:</h6>
              <ul className="list-group">
                {categories.map(category => (
                  <li key={category} className="list-group-item d-flex justify-content-between align-items-center">
                    {categoryToEdit === category ? (
                      <>
                        <input
                          type="text"
                          className="form-control me-2"
                          value={editCategoryName}
                          onChange={e => setEditCategoryName(e.target.value)}
                        />
                        <div>
                          <button 
                            className="btn btn-sm btn-success me-2"
                            onClick={handleUpdateCategory}
                          >
                            Save
                          </button>
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => setCategoryToEdit(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span>{category}</span>
                        <div>
                          <button 
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => handleEditCategoryStart(category)}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteCategory(category)}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

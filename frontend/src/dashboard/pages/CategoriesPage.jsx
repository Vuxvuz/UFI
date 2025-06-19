import React, { useEffect, useState } from "react";
import categoryService from "../../services/categoryService";

export default function CategoriesPage() {
	const [categories, setCategories] = useState([]);
	const [loading, setLoading] = useState(true);
	const [newCategoryName, setNewCategoryName] = useState("");
	const [editingCategory, setEditingCategory] = useState(null);
	const [editName, setEditName] = useState("");
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	// Load categories
	const loadCategories = async () => {
		setLoading(true);
		try {
			const res = await categoryService.getAllCategoriesForMod();
			console.log("Categories API response:", res);

			if (res.data && Array.isArray(res.data)) {
				setCategories(res.data);
			} else if (res.data && res.data.data && Array.isArray(res.data.data)) {
				setCategories(res.data.data);
			} else {
				console.error("Unexpected API response format:", res);
				setCategories([]);
			}
		} catch (err) {
			console.error("Lỗi khi load categories:", err);
			setError("Failed to load categories.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadCategories();
	}, []);

	// Add a new category
	const handleAddCategory = async (e) => {
		e.preventDefault();
		if (!newCategoryName.trim()) {
			setError("Category name cannot be empty");
			return;
		}

		try {
			await categoryService.addCategory(newCategoryName);
			setNewCategoryName("");
			setSuccess("Category added successfully");
			setError("");
			loadCategories(); // Reload categories
		} catch (err) {
			console.error("Error adding category:", err);
			// Extract error message from different possible response formats
			const errorMessage =
				err.response?.data?.message ||
				err.response?.data?.data?.message ||
				(err.response?.data?.result === "ERROR"
					? err.response?.data?.message
					: null) ||
				"Failed to add category";
			setError(errorMessage);
		}
	};

	// Start editing a category
	const handleEditClick = (category) => {
		setEditingCategory(category);
		setEditName(category.name);
	};

	// Update a category
	const handleUpdateCategory = async (e) => {
		e.preventDefault();
		if (!editName.trim()) {
			setError("Category name cannot be empty");
			return;
		}

		try {
			await categoryService.updateCategory(editingCategory.name, editName);
			setEditingCategory(null);
			setSuccess("Category updated successfully");
			setError("");
			loadCategories(); // Reload categories
		} catch (err) {
			console.error("Error updating category:", err);
			// Extract error message from different possible response formats
			const errorMessage =
				err.response?.data?.message ||
				err.response?.data?.data?.message ||
				(err.response?.data?.result === "ERROR"
					? err.response?.data?.message
					: null) ||
				"Failed to update category";
			setError(errorMessage);
		}
	};

	// Delete a category
	const handleDeleteCategory = async (categoryName) => {
		if (
			window.confirm(
				`Are you sure you want to delete category "${categoryName}"?`,
			)
		) {
			try {
				await categoryService.deleteCategory(categoryName);
				setSuccess("Category deleted successfully");
				setError("");
				loadCategories(); // Reload categories
			} catch (err) {
				console.error("Error deleting category:", err);
				// Extract error message from different possible response formats
				const errorMessage =
					err.response?.data?.message ||
					err.response?.data?.data?.message ||
					(err.response?.data?.result === "ERROR"
						? err.response?.data?.message
						: null) ||
					"Failed to delete category";
				setError(errorMessage);
			}
		}
	};

	// Cancel editing
	const handleCancelEdit = () => {
		setEditingCategory(null);
		setEditName("");
	};

	// Clear messages after 5 seconds
	useEffect(() => {
		if (success || error) {
			const timer = setTimeout(() => {
				setSuccess("");
				setError("");
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [success, error]);

	if (loading)
		return <div className="alert alert-info">Loading categories...</div>;

	return (
		<div className="container mt-4">
			<h2>Manage Categories</h2>

			{/* Success and Error Messages */}
			{success && <div className="alert alert-success">{success}</div>}
			{error && <div className="alert alert-danger">{error}</div>}

			{/* Add New Category Form */}
			<div className="card mb-4">
				<div className="card-header">Add New Category</div>
				<div className="card-body">
					<form onSubmit={handleAddCategory} className="row g-3">
						<div className="col-md-8">
							<input
								type="text"
								className="form-control"
								placeholder="New category name"
								value={newCategoryName}
								onChange={(e) => setNewCategoryName(e.target.value)}
							/>
						</div>
						<div className="col-md-4">
							<button type="submit" className="btn btn-primary">
								Add Category
							</button>
						</div>
					</form>
				</div>
			</div>

			{/* Categories List */}
			<div className="card">
				<div className="card-header">Categories</div>
				<div className="card-body">
					{!categories.length ? (
						<div className="alert alert-warning">No categories found.</div>
					) : (
						<table className="table table-striped">
							<thead>
								<tr>
									<th>ID</th>
									<th>Name</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{categories.map((cat) => (
									<tr key={cat.id}>
										<td>{cat.id}</td>
										<td>
											{editingCategory && editingCategory.id === cat.id ? (
												<input
													type="text"
													className="form-control"
													value={editName}
													onChange={(e) => setEditName(e.target.value)}
												/>
											) : (
												cat.name
											)}
										</td>
										<td>
											{editingCategory && editingCategory.id === cat.id ? (
												<>
													<button
														className="btn btn-success btn-sm me-2"
														onClick={handleUpdateCategory}
													>
														Save
													</button>
													<button
														className="btn btn-secondary btn-sm"
														onClick={handleCancelEdit}
													>
														Cancel
													</button>
												</>
											) : (
												<>
													<button
														className="btn btn-primary btn-sm me-2"
														onClick={() => handleEditClick(cat)}
													>
														Edit
													</button>
													<button
														className="btn btn-danger btn-sm"
														onClick={() => handleDeleteCategory(cat.name)}
													>
														Delete
													</button>
												</>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>
			</div>
		</div>
	);
}

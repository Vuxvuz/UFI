// src/services/categoryService.js
import { API } from "./api";

// GET /api/mod/categories
function getAllCategoriesForMod() {
	console.log("Fetching all categories for moderator");
	return API.get("/api/mod/categories");
}

// Nếu bạn thêm các tính năng tạo/sửa/xóa category:
function addCategory(name) {
	// POST /api/mod/categories?name=...
	console.log(`Adding category with name: ${name}`);
	return API.post("/api/mod/categories", null, {
		params: { name },
	});
}

function updateCategory(oldName, newName) {
	// Giả sử backend có endpoint PUT /api/mod/categories?oldName=…&newName=…
	console.log(`Updating category from "${oldName}" to "${newName}"`);
	return API.put("/api/mod/categories", null, {
		params: { oldName, newName },
	});
}

function deleteCategory(name) {
	// Giả sử backend có endpoint DELETE /api/mod/categories?name=…
	console.log(`Deleting category: ${name}`);
	return API.delete("/api/mod/categories", { params: { name } });
}

const CategoryService = {
	getAllCategoriesForMod,
	addCategory,
	updateCategory,
	deleteCategory,
};

export default CategoryService;

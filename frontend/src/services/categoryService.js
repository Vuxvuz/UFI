// src/services/categoryService.js
import { API } from "./api";

// GET /api/mod/categories
function getAllCategoriesForMod() {
  return API.get("/api/mod/categories");
}

// Nếu bạn thêm các tính năng tạo/sửa/xóa category:
function addCategory(name) {
  // Giả sử backend có endpoint POST /api/mod/categories
  return API.post("/api/mod/categories", { name });
}

function updateCategory(oldName, newName) {
  // Giả sử backend có endpoint PUT /api/mod/categories?oldName=…&newName=…
  return API.put("/api/mod/categories", null, {
    params: { oldName, newName },
  });
}

function deleteCategory(name) {
  // Giả sử backend có endpoint DELETE /api/mod/categories?name=…
  return API.delete("/api/mod/categories", { params: { name } });
}

const CategoryService = {
  getAllCategoriesForMod,
  addCategory,
  updateCategory,
  deleteCategory,
};

export default CategoryService;

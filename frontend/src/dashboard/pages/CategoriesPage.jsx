import React, { useEffect, useState } from "react";
import categoryService from "../../services/categoryService";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Gọi hàm getAllCategoriesForMod (mà trong categoryService gọi API.get("/api/mod/categories"))
        const res = await categoryService.getAllCategoriesForMod();
        setCategories(res.data);
      } catch (err) {
        console.error("Lỗi khi load categories:", err);
        alert("Failed to load categories.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Loading categories...</div>;
  if (!categories.length) return <div>No categories found.</div>;

  return (
    <div>
      <h2>Manage Categories</h2>
      <ul>
        {categories.map(cat => (
          <li key={cat.id}>{cat.name}</li>
        ))}
      </ul>
    </div>
  );
}

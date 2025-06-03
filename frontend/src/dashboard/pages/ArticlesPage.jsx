// src/dashboard/pages/ArticlesPage.jsx

import React, { useEffect, useState } from "react";
import articleService from "../../services/articleService";

export default function ArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Gọi hàm getAll (mà trong articleService gọi API.get("/api/admin/articles"))
        const res = await articleService.getAll();
        setArticles(res.data);
      } catch (err) {
        console.error("Lỗi khi load articles:", err);
        alert("Failed to load articles.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Hàm xóa 1 article
  const handleDelete = async (articleId) => {
    // Hỏi lại người dùng trước khi xóa
    const ok = window.confirm("Bạn có chắc muốn xóa bài viết này không?");
    if (!ok) return;

    try {
      // Gọi API DELETE /api/admin/article/{id}
      await articleService.deleteById(articleId);

      // Cập nhật lại state: lọc bỏ article vừa xóa khỏi mảng
      setArticles((prev) => prev.filter((a) => a.id !== articleId));
      alert("Xóa bài viết thành công.");
    } catch (err) {
      console.error("Lỗi khi xóa article:", err);
      alert("Xóa bài viết thất bại.");
    }
  };

  if (loading) return <div>Loading articles...</div>;
  if (!articles.length) return <div>No articles found.</div>;

  return (
    <div>
      <h2>Manage Articles</h2>
      <ul style={{ listStyleType: "disc", paddingLeft: "20px" }}>
        {articles.map((a) => (
          <li
            key={a.id}
            style={{
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span style={{ flexGrow: 1 }}>{a.title}</span>
            <button
              onClick={() => handleDelete(a.id)}
              style={{
                marginLeft: "12px",
                padding: "4px 8px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

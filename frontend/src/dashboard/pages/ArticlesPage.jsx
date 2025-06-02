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

  if (loading) return <div>Loading articles...</div>;
  if (!articles.length) return <div>No articles found.</div>;

  return (
    <div>
      <h2>Manage Articles</h2>
      <ul>
        {articles.map(a => (
          <li key={a.id}>{a.title}</li>
        ))}
      </ul>
    </div>
  );
}

// frontend/src/forum/pages/Forum.jsx
import React, { useState, useEffect } from "react";
import { listTopics, createTopic } from "../../services/forumService";
import { Link } from "react-router-dom";

const CATEGORIES = ["GENERAL", "WORKOUT", "NUTRITION", "SHOWOFF"];

export default function Forum() {
  const [topics, setTopics]     = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newCat, setNewCat]     = useState("ALL");
  const [error, setError]       = useState("");

  // Load lại khi mount hoặc khi newCat thay đổi
  useEffect(() => {
    (async () => {
      try {
        const filter = newCat !== "ALL" ? newCat : null;
        const res    = await listTopics(filter);
        setTopics(res.data);
        setError("");
      } catch (err) {
        console.error("Error loading topics:", err);
        setError("Không tải được danh sách topics");
      }
    })();
  }, [newCat]);

  // Tạo topic mới
  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      await createTopic({
        title: newTitle.trim(),
        category: newCat === "ALL" ? "GENERAL" : newCat
      });
      setNewTitle("");
      // trigger reload
      setNewCat(curr => curr);
    } catch (err) {
      console.error("Error creating topic:", err);
      setError("Không tạo được topic");
    }
  };

  return (
    <div className="container mt-4">
      <h2>Forum Topics</h2>

      <div className="mb-3 d-flex align-items-center">
        <select
          className="form-select w-auto me-3"
          value={newCat}
          onChange={e => setNewCat(e.target.value)}
        >
          <option value="ALL">All</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          type="text"
          className="form-control me-2"
          placeholder="Nhập tiêu đề..."
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
        />

        <button className="btn btn-primary" onClick={handleCreate}>
          Tạo Topic
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <ul className="list-group">
        {topics.map(t => (
          <li
            key={t.id}
            className="list-group-item d-flex justify-content-between"
          >
            <Link to={`/forum/${t.id}`} state={{ title: t.title }}>
              {t.title}
            </Link>
            <small className="text-muted">
              {new Date(t.createdAt).toLocaleDateString()}
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
}

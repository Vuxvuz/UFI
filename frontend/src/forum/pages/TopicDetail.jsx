import React, { useEffect, useState, useRef } from "react";
import { listPosts, createPost } from "../../services/forumService";
import { useParams, useLocation } from "react-router-dom";

export default function TopicDetail() {
  const { topicId }   = useParams();
  const { state }     = useLocation();
  const title         = state?.title || `Topic #${topicId}`;

  const [posts, setPosts]     = useState([]);
  const [content, setContent] = useState("");
  const [image, setImage]     = useState(null);
  const fileRef                = useRef(null);

  // Load posts
  useEffect(() => {
    (async () => {
      try {
        const res = await listPosts(topicId);
        setPosts(res.data);
      } catch (err) {
        console.error("Không tải được posts:", err);
      }
    })();
  }, [topicId]);

  const handlePost = async () => {
    if (!content.trim() && !image) return;

    try {
      await createPost(topicId, content.trim(), image);
      // reset form
      setContent("");
      setImage(null);
      if (fileRef.current) fileRef.current.value = "";
      // reload
      const res = await listPosts(topicId);
      setPosts(res.data);
    } catch (err) {
      console.error("Không gửi được bài:", err);
    }
  };

  return (
    <div className="container mt-5">
      <h3>{title}</h3>

      <div className="mb-4">
        <textarea
          className="form-control"
          rows="3"
          placeholder="Viết nội dung..."
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <input
          type="file"
          ref={fileRef}
          className="form-control mt-2"
          accept="image/*"
          onChange={e => setImage(e.target.files[0] || null)}
        />
        <button className="btn btn-success mt-2" onClick={handlePost}>
          Gửi bài
        </button>
      </div>

      <ul className="list-group">
        {posts.map(p => (
          <li key={p.id} className="list-group-item">
            <strong>{p.author}:</strong> {p.content}
            {p.imageUrl && (
              <div className="mt-2">
                <img
                  // Nếu cần full URL: `${process.env.REACT_APP_API}${p.imageUrl}`
                  src={p.imageUrl}
                  alt="post"
                  className="img-fluid rounded"
                  style={{ maxWidth: 200, maxHeight: 200 }}
                />
              </div>
            )}
            <br />
            <small className="text-muted">
              {new Date(p.createdAt).toLocaleString()}
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
}

// src/dashboard/pages/TopicsPage.jsx

import React, { useEffect, useState } from 'react';
import topicService from '../../services/topicService';

export default function TopicsPage() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await topicService.getAll(); // GET /api/mod/topics
        setTopics(res.data);
      } catch (err) {
        console.error(err);
        alert('Failed to load topics.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Loading topics...</div>;
  if (!topics.length) return <div>No topics found.</div>;

  return (
    <div>
      <h2>Manage Topics</h2>
      <ul>
        {topics.map(t => (
          <li key={t.id}>{t.title}</li>
        ))}
      </ul>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import adminService from "../../services/adminService";

export default function UsersPage() {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Gọi hàm getAllUsers (có gọi API.get("/api/admin/users"))
        const res = await adminService.getAllUsers();
        setUsers(res.data);
      } catch (err) {
        console.error("Lỗi khi load users:", err);
        alert("Failed to load users.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Loading users...</div>;
  if (!users.length) return <div>No users found.</div>;

  return (
    <div>
      <h2>Manage Users</h2>
      <ul>
        {users.map(u => (
          <li key={u.id}>{u.username} ({u.email})</li>
        ))}
      </ul>
    </div>
  );
}

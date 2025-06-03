// src/dashboard/pages/UsersPage.jsx

import React, { useEffect, useState } from "react";
import adminService from "../../services/adminService";

export default function UsersPage() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);

  // Danh sách các role có thể gán (bạn có thể thêm/bớt nếu backend hỗ trợ thêm)
  const allRoles = ["ROLE_USER", "ROLE_MODERATOR", "ROLE_ADMIN"];

  useEffect(() => {
    (async () => {
      try {
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

  // Hàm xóa 1 user
  const handleDelete = async (userId) => {
    const ok = window.confirm("Bạn có chắc muốn xóa user này không?");
    if (!ok) return;

    try {
      await adminService.deleteUser(userId);
      // Cập nhật state: loại bỏ user vừa xóa
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      alert("Xóa user thành công.");
    } catch (err) {
      console.error("Lỗi khi xóa user:", err);
      alert("Xóa user thất bại.");
    }
  };

  // Hàm gán role mới cho user
  const handleChangeRole = async (userId, newRole) => {
    // Tìm user hiện tại trong state để lấy username
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const ok = window.confirm(
      `Bạn có chắc muốn gán vai trò "${newRole.replace("ROLE_", "")}" cho user "${user.username}" không?`
    );
    if (!ok) return;

    try {
      // Gọi API POST /api/admin/assign-role?username=xxx&role=yyy
      await adminService.assignRole(user.username, newRole);

      // Cập nhật ngay state để reflect role mới
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                role: newRole,
              }
            : u
        )
      );

      alert(`Gán role "${newRole.replace("ROLE_", "")}" cho ${user.username} thành công.`);
    } catch (err) {
      console.error("Lỗi khi gán role:", err);
      alert("Gán role thất bại.");
    }
  };

  if (loading) return <div>Loading users...</div>;
  if (!users.length) return <div>No users found.</div>;

  return (
    <div>
      <h2>Manage Users</h2>
      <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
        {users.map((u) => (
          <li
            key={u.id}
            style={{
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
            }}
          >
            {/* Thông tin user: username (email) và role hiện tại */}
            <div style={{ flexGrow: 1 }}>
              <strong>{u.username}</strong> ({u.email}) — hiện tại:{" "}
              <em>{u.role.replace("ROLE_", "")}</em>
            </div>

            {/* Dropdown chọn role mới */}
            <select
              value={u.role}
              onChange={(e) => handleChangeRole(u.id, e.target.value)}
              style={{
                marginRight: "12px",
                padding: "4px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "0.9rem",
              }}
            >
              {allRoles.map((r) => (
                <option key={r} value={r}>
                  {r.replace("ROLE_", "")}
                </option>
              ))}
            </select>

            {/* Nút Delete */}
            <button
              onClick={() => handleDelete(u.id)}
              style={{
                marginLeft: "auto",
                padding: "6px 12px",
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

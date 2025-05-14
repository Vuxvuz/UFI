// src/account/pages/AccountPage.jsx
import React, { useState, useEffect } from "react";
import { API } from "../../services/api"; // hoặc đúng path của bạn
import { useNavigate } from "react-router-dom";

export default function AccountPage() {
  const [profile, setProfile] = useState(null);
  const [passwords, setPasswords] = useState({ current: "", new1: "", new2: "" });
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/api/user/profile")
       .then(res => setProfile(res.data))
       .catch(() => navigate("/signin"));
  }, [navigate]);

  const handleChange = e => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const saveProfile = () => {
    API.put("/api/user/profile", profile)
       .then(() => setMsg("Cập nhật thành công!"))
       .catch(() => setMsg("Lỗi, thử lại sau."));
  };

  const changePassword = () => {
    if (passwords.new1 !== passwords.new2) {
      setMsg("Mật khẩu mới không khớp!");
      return;
    }
    API.post("/api/auth/reset-password", {
      token: "", // nếu ko dùng token OTP, backend phải hỗ trợ đổi pass qua endpoint khác
      newPassword: passwords.new1
    })
    .then(() => setMsg("Đổi mật khẩu thành công!"))
    .catch(() => setMsg("Lỗi đổi mật khẩu."));
  };

  if (!profile) return <div className="p-5 text-center">Loading...</div>;

  return (
    <div className="container mt-5 pt-5">
      <h2>Account Settings</h2>
      {msg && <div className="alert alert-info">{msg}</div>}

      <div className="card mb-4">
        <div className="card-header">Thông tin cá nhân</div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input type="email" name="email" className="form-control"
                     value={profile.email} disabled />
            </div>
            <div className="col-md-6">
              <label className="form-label">Username</label>
              <input type="text" name="username" className="form-control"
                     value={profile.username} disabled />
            </div>
            <div className="col-md-6">
              <label className="form-label">First Name</label>
              <input type="text" name="firstName" className="form-control"
                     value={profile.firstName || ""} onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Last Name</label>
              <input type="text" name="lastName" className="form-control"
                     value={profile.lastName || ""} onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Phone</label>
              <input type="text" name="phone" className="form-control"
                     value={profile.phone || ""} onChange={handleChange} />
            </div>
            <div className="col-12">
              <button className="btn btn-primary" onClick={saveProfile}>
                Lưu thông tin
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">Đổi mật khẩu</div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Mật khẩu hiện tại</label>
              <input type="password" className="form-control"
                     value={passwords.current}
                     onChange={e => setPasswords(p => ({...p, current: e.target.value}))}/>
            </div>
            <div className="col-md-4">
              <label className="form-label">Mật khẩu mới</label>
              <input type="password" className="form-control"
                     value={passwords.new1}
                     onChange={e => setPasswords(p => ({...p, new1: e.target.value}))}/>
            </div>
            <div className="col-md-4">
              <label className="form-label">Xác nhận mật khẩu mới</label>
              <input type="password" className="form-control"
                     value={passwords.new2}
                     onChange={e => setPasswords(p => ({...p, new2: e.target.value}))}/>
            </div>
            <div className="col-12">
              <button className="btn btn-warning" onClick={changePassword}>
                Đổi mật khẩu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

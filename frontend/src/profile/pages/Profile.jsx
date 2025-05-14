// src/profile/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, updateProfile } from "../../services/profileService";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile]       = useState(null);
  const [msg, setMsg]               = useState("");
  const [justCompleted, setJustCompleted] = useState(false);

  // 1) Chỉ load profile, không redirect
  useEffect(() => {
    getProfile()
      .then(res => setProfile(res.data))
      .catch(() => setMsg("Không thể tải profile"));
  }, []);

  if (!profile) return <div>Loading...</div>;

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await updateProfile(profile);
      const updated = res.data;
      setProfile(updated);
      setMsg("Cập nhật thành công!");

      // 2) Nếu lần đầu hoàn thiện (profileCompleted vừa chuyển từ false → true)
      if (updated.profileCompleted && !profile.profileCompleted && !justCompleted) {
        setJustCompleted(true);
        navigate("/home");
      }
    } catch {
      setMsg("Cập nhật thất bại.");
    }
  };

  return (
    <div className="container mt-4">
      <h2>My Profile</h2>
      {msg && <div className="alert alert-info">{msg}</div>}
      <form onSubmit={handleSubmit}>
        {/* First Name */}
        <div className="mb-3">
          <label>First Name</label>
          <input
            className="form-control"
            value={profile.firstName || ""}
            onChange={e => setProfile({ ...profile, firstName: e.target.value })}
          />
        </div>
        {/* Last Name */}
        <div className="mb-3">
          <label>Last Name</label>
          <input
            className="form-control"
            value={profile.lastName || ""}
            onChange={e => setProfile({ ...profile, lastName: e.target.value })}
          />
        </div>
        {/* Phone */}
        <div className="mb-3">
          <label>Phone</label>
          <input
            className="form-control"
            value={profile.phone || ""}
            onChange={e => setProfile({ ...profile, phone: e.target.value })}
          />
        </div>
        {/* Avatar URL */}
        <div className="mb-3">
          <label>Avatar URL</label>
          <input
            className="form-control"
            value={profile.avatarUrl || ""}
            onChange={e => setProfile({ ...profile, avatarUrl: e.target.value })}
          />
        </div>
        {/* Height */}
        <div className="mb-3">
          <label>Height (cm)</label>
          <input
            type="number"
            className="form-control"
            value={profile.height || ""}
            onChange={e => setProfile({ ...profile, height: +e.target.value })}
          />
        </div>
        {/* Weight */}
        <div className="mb-3">
          <label>Weight (kg)</label>
          <input
            type="number"
            className="form-control"
            value={profile.weight || ""}
            onChange={e => setProfile({ ...profile, weight: +e.target.value })}
          />
        </div>
        {/* Aim */}
        <div className="mb-3">
          <label>Aim</label>
          <select
            className="form-select"
            value={profile.aim || ""}
            onChange={e => setProfile({ ...profile, aim: e.target.value })}
          >
            <option value="">Select</option>
            <option value="lose_weight">Lose Weight</option>
            <option value="gain_muscle">Gain Muscle</option>
            <option value="maintain">Maintain</option>
          </select>
        </div>
        {/* BMI (disabled) */}
        <div className="mb-3">
          <label>BMI</label>
          <input
            className="form-control"
            value={profile.bmi?.toFixed(2) || ""}
            disabled
          />
        </div>
        <button type="submit" className="btn btn-primary w-100">
          Save Profile
        </button>
      </form>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import adminService from "../../services/adminService";

export default function SystemInfoPage() {
  const [info, setInfo]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Gọi đúng hàm trong adminService
        const res = await adminService.getSystemInfo();
        setInfo(res.data);
      } catch (err) {
        console.error("Lỗi khi load System Info:", err);
        alert("Failed to load system info.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Loading system info...</div>;
  if (!info) return <div>No system information available.</div>;

  return (
    <div>
      <h2>System Info</h2>
      <pre>{JSON.stringify(info, null, 2)}</pre>
    </div>
  );
}

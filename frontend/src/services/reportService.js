// src/services/reportService.js
import { API } from "./api";

/**
 * Lấy tất cả report có status = PENDING từ backend cho cả mod và admin.
 * - Với mod: gọi /api/mod/reports
 * - Với admin: gọi /api/admin/reports
 * Ở đây chỉ cung cấp hàm hỗ trợ chung, nếu cần phân biệt thì bạn có thể tách thành 2 hàm.
 */

function getPendingReportsForMod() {
	// GET /api/mod/reports
	return API.get("/api/mod/reports");
}

function getPendingReportsForAdmin() {
	// GET /api/admin/reports
	return API.get("/api/admin/reports");
}

function reviewReportAsMod(reportId, action) {
	// PUT /api/mod/reports/{reportId}/review?action=…
	return API.put(`/api/mod/reports/${reportId}/review`, null, {
		params: { action },
	});
}

function reviewReportAsAdmin(reportId, action) {
	// PUT /api/admin/reports/{reportId}/review?action=…
	return API.put(`/api/admin/reports/${reportId}/review`, null, {
		params: { action },
	});
}

const ReportService = {
	getPendingReportsForMod,
	getPendingReportsForAdmin,
	reviewReportAsMod,
	reviewReportAsAdmin,
};

export default ReportService;

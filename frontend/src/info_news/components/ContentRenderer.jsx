// src/info_news/components/ContentRenderer.jsx

import React from "react";
import PropTypes from "prop-types";
import { marked } from "marked";
import DOMPurify from "dompurify";
import "./ContentRenderer.css";

export default function ContentRenderer({ content }) {
	// 1) Nếu content undefined hoặc null → gán chuỗi rỗng
	const raw = content || "";

	// 2) Thay '\\n' (escape JSON) thành newline thực sự '\n'
	let text = raw.replace(/\\n/g, "\n");

	// 3) Chèn newline trước dấu "*" hoặc "•" nếu chúng nằm giữa một dòng
	//    Giữ nguyên logic table, không đụng đến dấu "|"
	text = text
		.replace(/([^\n])\s\*\s+/g, "$1\n* ")
		.replace(/([^\n])\s•\s+/g, "$1\n• ");

	// 3.b) Chèn newline trước dấu "·" (middle dot) nếu nằm giữa một dòng
	text = text.replace(/([^\n])\s·\s+/g, "$1\n· ");

	// 4) Chèn newline ngay sau mỗi lần xuất hiện "** "
	text = text.replace(/\*\*\s+/g, "**\n");

	// 5) Chuyển bất kỳ đoạn "**…**" (ở giữa câu) thành Markdown H2
	text = text.replace(/\*\*\s*([^*\r\n]+?)\s*\*\*/g, "\n\n## $1\n\n");

	// 6) Chuyển dòng kết thúc bằng "**" → coi như “heading-list” (Markdown H3)
	text = text.replace(/^(.+?)\*\*\s*$/gm, "\n\n### $1\n\n");

	// 7) Chèn newline trước mỗi “số thứ tự” (1. 2. 3.) nằm giữa một câu
	text = text.replace(/([^\n])(\d+)\.\s+/g, "$1\n$2. ");

	// 7.5) Nếu table dùng "||" làm dấu ngăn cách hàng (row), giữ nguyên logic:
	//      chuyển "||" thành newline để tách table nhỏ (nếu có)
	text = text.replace(/\s*\|\|\s*/g, "\n");

	// 8) Nếu toàn bộ một bảng nằm trên 1 dòng (chỉ chứa "||"), tách ra từng hàng
	text = text.replace(/[|]\s*[|]\s*/g, "\n|");

	// 9) Tách text thành “chunks” dựa trên 2+ newline
	const chunks = text.split(/\n{2,}/).filter((chunk) => {
		if (chunk.trim() === "**") {
			return false;
		}
		return chunk.trim() !== "";
	});

	// 10) Xử lý từng chunk: nếu chunk bắt đầu bằng "|" → parse thành table
	const processedChunks = chunks.map((chunk) => {
		const trimmedChunk = chunk.trim();

		if (trimmedChunk.startsWith("|")) {
			// ————————————
			// Normalize các dòng bắt đầu bằng '|' mà thiếu dấu '|' ở cuối
			const normalizedLines = trimmedChunk
				.split("\n")
				.map((r) => r.trim())
				.map((r) => {
					if (r.startsWith("|") && !r.endsWith("|")) {
						return r + " |";
					}
					return r;
				});
			const rows = normalizedLines.filter(
				(r) => r.startsWith("|") && r.endsWith("|"),
			);
			// ————————————

			// 10B) Nếu có ≥ 2 hàng → parse thành Markdown table
			if (rows.length >= 2) {
				// Header row (bỏ ký tự "|" đầu/cuối, split theo "|")
				const headerRow = rows[0]
					.replace(/^\||\|$/g, "")
					.split("|")
					.map((c) => c.trim());

				// Nếu hàng thứ hai chỉ chứa ký tự “|”, “-”, “:”, “space” thì đó là separator
				let dataRowsRaw;
				if (/^[|\s\-:]+$/.test(rows[1])) {
					dataRowsRaw = rows.slice(2);
				} else {
					dataRowsRaw = rows.slice(1);
				}

				// Build Markdown header + separator + data rows
				const headerMd = `| ${headerRow.join(" | ")} |`;
				const separatorMd = `| ${headerRow.map(() => "---").join(" | ")} |`;
				const dataMd = dataRowsRaw
					.map((row) => {
						const cells = row
							.replace(/^\||\|$/g, "")
							.split("|")
							.map((c) => c.trim());
						return `| ${cells.join(" | ")} |`;
					})
					.join("\n");

				return dataMd
					? `${headerMd}\n${separatorMd}\n${dataMd}`
					: `${headerMd}\n${separatorMd}`;
			}

			// 10C) Nếu chỉ có 1 hàng (rows.length === 1) → giữ nguyên chunk (không parse thành table)
			if (rows.length === 1) {
				return chunk;
			}

			// Nếu không đủ điều kiện table, giữ nguyên chunk
			return chunk;
		}

		// Nếu không phải table, giữ nguyên chunk
		return chunk;
	});

	// 11) Ghép các chunk vào thành Markdown hoàn chỉnh
	const markdownSource = processedChunks.join("\n\n");

	// 12) Parse Markdown → HTML
	const htmlFromMarkdown = marked.parse(markdownSource);

	// 13) Sanitize HTML
	const safeHTML = DOMPurify.sanitize(htmlFromMarkdown);

	// 14) Render HTML đã sanitize
	return (
		<div
			className="content-renderer"
			dangerouslySetInnerHTML={{ __html: safeHTML }}
		/>
	);
}

ContentRenderer.propTypes = {
	content: PropTypes.string,
};

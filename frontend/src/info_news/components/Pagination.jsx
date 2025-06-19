import React from "react";

function Pagination({
	itemsPerPage,
	totalItems,
	currentPage,
	paginate,
	pageIdPrefix,
}) {
	const pageNumbers = [];

	// Tính tổng số trang
	for (let i = 1; i <= Math.ceil(totalItems / itemsPerPage); i++) {
		pageNumbers.push(i);
	}

	// Giới hạn số nút hiển thị (hiển thị tối đa 5 nút)
	const MAX_BUTTONS = 5;
	let startPage = Math.max(1, currentPage - 2);
	let endPage = Math.min(pageNumbers.length, startPage + MAX_BUTTONS - 1);

	// Điều chỉnh nếu không đủ nút ở cuối
	if (endPage - startPage + 1 < MAX_BUTTONS && startPage > 1) {
		startPage = Math.max(1, endPage - MAX_BUTTONS + 1);
	}

	// Lấy các trang sẽ hiển thị
	const displayedPages = pageNumbers.slice(startPage - 1, endPage);

	return (
		<nav aria-label="Page navigation" className="mt-4">
			<ul className="pagination justify-content-center">
				{/* Nút Previous */}
				<li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
					<button
						className="page-link"
						onClick={() => currentPage > 1 && paginate(currentPage - 1)}
						aria-label="Previous"
						disabled={currentPage === 1}
					>
						<span aria-hidden="true">&laquo;</span>
					</button>
				</li>

				{/* Hiển thị nút trang đầu nếu không nằm trong vùng hiển thị */}
				{startPage > 1 && (
					<>
						<li className="page-item">
							<button
								className="page-link"
								onClick={() => paginate(1)}
								id={pageIdPrefix ? `${pageIdPrefix}-page-1` : undefined}
							>
								1
							</button>
						</li>
						{startPage > 2 && (
							<li className="page-item disabled">
								<span className="page-link">...</span>
							</li>
						)}
					</>
				)}

				{/* Hiển thị các nút trang */}
				{displayedPages.map((number) => (
					<li
						key={number}
						className={`page-item ${currentPage === number ? "active" : ""}`}
					>
						<button
							className="page-link"
							onClick={() => paginate(number)}
							id={pageIdPrefix ? `${pageIdPrefix}-page-${number}` : undefined}
						>
							{number}
						</button>
					</li>
				))}

				{/* Hiển thị nút trang cuối nếu không nằm trong vùng hiển thị */}
				{endPage < pageNumbers.length && (
					<>
						{endPage < pageNumbers.length - 1 && (
							<li className="page-item disabled">
								<span className="page-link">...</span>
							</li>
						)}
						<li className="page-item">
							<button
								className="page-link"
								onClick={() => paginate(pageNumbers.length)}
								id={
									pageIdPrefix
										? `${pageIdPrefix}-page-${pageNumbers.length}`
										: undefined
								}
							>
								{pageNumbers.length}
							</button>
						</li>
					</>
				)}

				{/* Nút Next */}
				<li
					className={`page-item ${currentPage === pageNumbers.length ? "disabled" : ""}`}
				>
					<button
						className="page-link"
						onClick={() =>
							currentPage < pageNumbers.length && paginate(currentPage + 1)
						}
						aria-label="Next"
						disabled={currentPage === pageNumbers.length}
					>
						<span aria-hidden="true">&raquo;</span>
					</button>
				</li>
			</ul>
		</nav>
	);
}

export default Pagination;

import React, { useEffect, useState } from "react";
import { fetchPlans } from "../../services/PlanService";
import { Link } from "react-router-dom";

export default function PlanList() {
	const [plans, setPlans] = useState([]);

	useEffect(() => {
		fetchPlans()
			.then((res) => setPlans(res.data))
			.catch((err) => {
				console.error("Failed to fetch plans:", {
					status: err.response?.status,
					data: err.response?.data,
					headers: err.response?.headers, // ✅ sửa dấu ; thành dấu ,
				});
			});
	}, []);

	return (
		<div className="container mt-5">
			<h2>My Workout Plans</h2>
			<ul className="list-group">
				{plans.map((p) => (
					<li
						key={p.id}
						className="list-group-item d-flex justify-content-between align-items-center"
					>
						{p.title}
						<Link to={`/plans/${p.id}`} className="btn btn-sm btn-primary">
							View
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}

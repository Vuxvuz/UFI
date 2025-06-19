// src/components/NewsCategory.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function CategoryList() {
	const categories = [
		{ name: "Nutrition", path: "/info-news/nutrition" },
		{ name: "Drugs", path: "/info-news/drug" },
		{ name: "Mental Health", path: "/info-news/mental" },
		{ name: "News", path: "/info-news/news" },
		{ name: "Diseases", path: "/info-news/health" },
	];

	return (
		<div className="list-group">
			{categories.map((category) => (
				<Link
					key={category.name}
					to={category.path}
					className="list-group-item list-group-item-action"
				>
					{category.name}
				</Link>
			))}
		</div>
	);
}

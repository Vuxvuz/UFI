import React from 'react';

export default function CategoryBadge({ category }) {
  // Handle null or undefined category
  if (!category) {
    return <span className="badge bg-secondary">general</span>;
  }
  
  let badgeClass = "badge ";
  
  // If category is an object with a name property (from CategoryDto)
  const categoryName = typeof category === 'object' && category.name 
    ? category.name 
    : category;
  
  switch (categoryName) {
    case "GENERAL":
      badgeClass += "bg-secondary";
      break;
    case "WORKOUT":
      badgeClass += "bg-primary";
      break;
    case "NUTRITION":
      badgeClass += "bg-success";
      break;
    case "SHOWOFF":
      badgeClass += "bg-warning text-dark";
      break;
    case "QUESTION":
      badgeClass += "bg-info";
      break;
    case "DISCUSSION":
      badgeClass += "bg-success";
      break;
    case "ANNOUNCEMENT":
      badgeClass += "bg-danger";
      break;
    default:
      badgeClass += "bg-secondary";
  }
  
  return (
    <span className={badgeClass}>
      {categoryName.toLowerCase()}
    </span>
  );
} 
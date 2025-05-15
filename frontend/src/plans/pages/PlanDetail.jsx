import React, { useEffect, useState } from "react";
import { fetchPlan } from "../../services/PlanService";
import { useParams, useNavigate } from "react-router-dom";

export default function PlanDetail() {
  const { planId } = useParams();
  const navigate   = useNavigate();
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    fetchPlan(planId).then(res => setPlan(res.data));
  }, [planId]);

  if (!plan) return <div>Loading…</div>;

  return (
    <div className="container mt-5">
      <button className="btn btn-link mb-3" onClick={() => navigate(-1)}>
        &larr; Back
      </button>
      <h2>{plan.title}</h2>
      <small className="text-muted">Created at: {new Date(plan.createdAt).toLocaleString()}</small>
      <ul className="mt-3">
        {plan.details.map((d, i) => (
          <li key={i}>{d}</li>
        ))}
      </ul>
    </div>
  );
}

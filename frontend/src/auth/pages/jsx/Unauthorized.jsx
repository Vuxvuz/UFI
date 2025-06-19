// src/auth/pages/Unauthorized.jsx
export default function Unauthorized() {
	return (
		<div className="container mt-5">
			<div className="row justify-content-center">
				<div className="col-md-6 text-center">
					<h1 className="display-4">401 Unauthorized</h1>
					<p className="lead">
						You do not have permission to access this resource.
					</p>
				</div>
			</div>
		</div>
	);
}

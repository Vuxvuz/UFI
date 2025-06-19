const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = (app) => {
	app.use(
		"/api",
		createProxyMiddleware({
			target: "http://localhost:8080",
			changeOrigin: true,
			secure: false,
			pathRewrite: {
				"^/api": "",
			},
		}),
	);

	app.use(
		"/ws-message",
		createProxyMiddleware({
			target: "http://localhost:8080",
			ws: true,
			changeOrigin: true,
		}),
	);
};

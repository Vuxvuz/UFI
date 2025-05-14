import React from "react";
import ReactDOM from "react-dom/client";       // nếu React 18+
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import "./index.css";       // nếu bạn có
import "./components/NavBar.css";  // CSS cho navbar
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <GoogleOAuthProvider clientId="436915109343-75aqli2lfjeh55fqsn5n6khlrqvqnl6m.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);

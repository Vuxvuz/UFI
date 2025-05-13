import React from "react";
import ReactDOM from "react-dom/client";       // nếu React 18+
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <GoogleOAuthProvider clientId="436915109343-75aqli2lfjeh55fqsn5n6khlrqvqnl6m.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);

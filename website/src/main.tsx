import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";
import "./styles/main.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Failed to find root element in website/index.html");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

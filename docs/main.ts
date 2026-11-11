import React from "react";
import { createRoot } from "react-dom/client";
import { DocsApp } from "./components/DocsApp.js";
import "./docs.css";

const rootEl = document.querySelector<HTMLElement>("#docs-root");
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(React.createElement(DocsApp));
}

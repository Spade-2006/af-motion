import { mountStudio } from "./mount.js";
import { createStudio } from "./playground.js";
import "./studio.css";

const root = document.querySelector<HTMLElement>("#studio-root");
if (!root) throw new Error("AF Studio root element was not found");

if (typeof window !== "undefined" && window.location.search.includes("legacy=true")) {
  createStudio(root);
} else {
  mountStudio(root);
}

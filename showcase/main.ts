import { createShowcase } from "./showcase.js";
import "./showcase.css";

const root = document.querySelector<HTMLElement>("#showcase-root");
if (!root) throw new Error("AF Motion showcase root element was not found");

createShowcase(root);

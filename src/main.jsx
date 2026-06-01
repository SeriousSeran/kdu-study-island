import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
import "./material-you-polish.css";
import "./island-dashboard.css";

const rootEl = document.getElementById("root");
const root = rootEl.__kduStudyRoot || (rootEl.__kduStudyRoot = createRoot(rootEl));
root.render(<App />);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

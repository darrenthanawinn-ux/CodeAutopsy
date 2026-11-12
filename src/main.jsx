import React from "react";
import { createRoot } from "react-dom/client";
import CodeAutopsy from "./CodeAutopsy.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CodeAutopsy />
  </React.StrictMode>
);

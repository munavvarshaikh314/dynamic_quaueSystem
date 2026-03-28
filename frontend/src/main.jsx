import React from "react";
import ReactDOM from "react-dom/client";
import Dashboard from "./components/Dashboard.jsx";
import DisplayScreen from "./components/DisplayScreen.jsx";
import "./index.css";

const path = window.location.pathname;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {path === "/display" ? <DisplayScreen /> : <Dashboard />}
  </React.StrictMode>
);
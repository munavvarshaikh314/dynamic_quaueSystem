import React from "react";
import ReactDOM from "react-dom/client";
import DisplayScreen from "./components/DisplayScreen.jsx";
import CustomerPortal from "./pages/CustomerPortal.jsx";
import OwnerPortal from "./pages/OwnerPortal.jsx";
import StaffPortal from "./pages/StaffPortal.jsx";
import "./index.css";

const path = window.location.pathname;

function resolvePage(pathname) {
  if (pathname === "/display") return <DisplayScreen />;
  if (pathname === "/staff") return <StaffPortal />;
  if (pathname === "/owner") return <OwnerPortal />;
  return <CustomerPortal />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>{resolvePage(path)}</React.StrictMode>
);

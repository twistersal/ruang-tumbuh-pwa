/** Style reminder — Pocket Field Notes: lightweight PWA bootstrap; no visual rules here. */
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => console.error("Registrasi offline tidak berhasil:", error));
  });
}

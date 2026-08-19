/** Style reminder — Pocket Field Notes: lightweight PWA bootstrap; no visual rules here. */
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./pages/nutrition-targets.css";
import "./pages/schedule.css";
import "./pages/journal-spine.css";
import "./pages/capture-layout.css";

createRoot(document.getElementById("root")!).render(<App />);

if (import.meta.env.DEV && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => registrations.forEach((registration) => registration.unregister()));
} else if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => console.error("Registrasi offline tidak berhasil:", error));
  });
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initLocalDb } from "./integrations/local-db/index.ts";

initLocalDb()
  .then(() => {
    createRoot(document.getElementById("root")!).render(<App />);
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    document.body.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif;">
        <h1>Error loading database</h1>
        <p>${err.message}</p>
        <p>Check console for details.</p>
      </div>
    `;
  });

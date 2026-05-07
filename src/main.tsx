import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { NeonAuthUIProvider } from "@neondatabase/neon-js/auth/react/ui";
import "@neondatabase/neon-js/ui/css";
import App from "./App";
import "./index.css";

import { FamilyProvider } from "./hooks/useFamilyStore";
import { neonAuth } from "./lib/auth";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <NeonAuthUIProvider authClient={neonAuth} redirectTo="/admin">
        <FamilyProvider>
          <App />
          <Analytics />
        </FamilyProvider>
      </NeonAuthUIProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

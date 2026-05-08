import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { NeonAuthUIProvider } from "@neondatabase/neon-js/auth/react/ui";
import "@neondatabase/neon-js/ui/css";
import App from "./App";
import "./index.css";

import { neonAuth } from "./lib/auth";
import { publishAuthToast } from "./lib/authErrorBus";

type NeonToastPayload = {
  message?: unknown;
  variant?: unknown;
};

const handleAuthToast = ({ message, variant = "default" }: NeonToastPayload) => {
  const normalizedMessage = typeof message === "string" ? message : "Authentication failed.";
  const normalizedVariant = typeof variant === "string" ? variant : "default";

  publishAuthToast({
    message: normalizedMessage,
    variant: normalizedVariant as "default" | "success" | "error" | "warning" | "info",
  });
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <NeonAuthUIProvider authClient={neonAuth} redirectTo="/app" toast={handleAuthToast}>
        <App />
        <Analytics />
      </NeonAuthUIProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

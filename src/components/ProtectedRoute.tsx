import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getNeonAuthToken } from "../lib/auth";

type Props = { children: ReactNode };

export const ProtectedRoute = ({ children }: Props) => {
  const location = useLocation();
  const [status, setStatus] = useState<"loading" | "ok" | "redirect">("loading");

  useEffect(() => {
    let cancelled = false;
    getNeonAuthToken({ retries: 4, delayMs: 250 }).then((token) => {
      if (!cancelled) setStatus(token ? "ok" : "redirect");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background">
        <div className="animate-pulse rounded-2xl bg-sage-green/15 p-8">
          <p className="text-sm font-semibold text-text-muted">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (status === "redirect") {
    return <Navigate to="/auth/sign-in" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

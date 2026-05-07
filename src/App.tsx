import { AnimatePresence, motion } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Navbar, Footer } from "./components/Layout";
import { iconStroke } from "./components/ui";
import { familyConfig } from "./config";
import { useFamilyStore } from "./hooks/useFamilyStore";
import { useSiteConfigEffects } from "./hooks/useSiteConfigEffects";
import { GalleryPage } from "./pages/GalleryPage";
import { HomePage } from "./pages/HomePage";
import { LandingPage } from "./pages/LandingPage";
import { MemberProfilePage } from "./pages/MemberProfilePage";
import { MembersPage } from "./pages/MembersPage";
import { TimelinePage } from "./pages/TimelinePage";
import { TreePage } from "./pages/TreePage";
import { Check, AlertTriangle, Info, XCircle, X } from "lucide-react";

import AdminLayout from "./admin/layouts/AdminLayout";
import { AdminDashboardPage } from "./admin/pages/AdminDashboardPage";
import { AdminMembersPage } from "./admin/pages/AdminMembersPage";
import { AdminGalleryPage } from "./admin/pages/AdminGalleryPage";
import { AdminTimelinePage } from "./admin/pages/AdminTimelinePage";
import { AdminNotFoundPage } from "./admin/pages/AdminNotFoundPage";
import { useAdminAuth } from "./admin/hooks/useAdminAuth";
import { AdminLoginPage } from "./admin/pages/AdminLoginPage";

export default function App() {
  const location = useLocation();
  const { toasts, dismissToast } = useFamilyStore();
  const auth = useAdminAuth();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAuthRoute = location.pathname.startsWith("/auth");
  const isLandingRoute = location.pathname === "/landing" || location.pathname.startsWith("/landing/");
  useSiteConfigEffects();

  if (auth.isLoading && (isAdminRoute || isAuthRoute)) {
    return null;
  }

  if (!auth.isAuthenticated && isAdminRoute) {
    return <AdminLoginPage />;
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {!isAdminRoute && !isLandingRoute && !isAuthRoute && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/auth/*" element={<AdminLoginPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/silsilah" element={<TreePage />} />
          <Route path="/anggota" element={<MembersPage />} />
          <Route path="/anggota/:id" element={<MemberProfilePage />} />
          <Route path="/galeri" element={familyConfig.features.gallery ? <GalleryPage /> : <Navigate to="/" replace />} />
          <Route path="/linimasa" element={familyConfig.features.timeline ? <TimelinePage /> : <Navigate to="/" replace />} />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="members" element={<AdminMembersPage />} />
            <Route path="gallery" element={familyConfig.features.gallery ? <AdminGalleryPage /> : <Navigate to="/admin" replace />} />
            <Route path="timeline" element={familyConfig.features.timeline ? <AdminTimelinePage /> : <Navigate to="/admin" replace />} />
            <Route path="*" element={<AdminNotFoundPage />} />
          </Route>
        </Routes>
      </AnimatePresence>
      {!isAdminRoute && !isLandingRoute && !isAuthRoute && <Footer />}

      {/* Global Toast Container */}
      <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              className={`flex min-h-12 w-[calc(100vw-2rem)] max-w-md items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-warm sm:w-auto sm:px-5 ${
                toast.tone === "success" ? "border-sage-green/20 bg-surface text-text-primary" :
                toast.tone === "warning" ? "border-warning/20 bg-surface text-warning" :
                "border-border-soft bg-surface text-text-primary"
              }`}
            >
              <span className={`grid h-7 w-7 place-items-center rounded-full ${
                toast.tone === "success" ? "bg-sage-green/15 text-dark-green" :
                toast.tone === "warning" ? "bg-warning/15 text-warning" :
                "bg-surface-soft text-text-muted"
              }`}>
                {toast.tone === "success" && <Check className="h-4 w-4" strokeWidth={iconStroke} />}
                {toast.tone === "warning" && <AlertTriangle className="h-4 w-4" strokeWidth={iconStroke} />}
                {toast.tone === "info" && <Info className="h-4 w-4" strokeWidth={iconStroke} />}
                {toast.tone === "error" && <XCircle className="h-4 w-4" strokeWidth={iconStroke} />}
              </span>
              <span className="flex-1">{toast.message}</span>
              <button 
                onClick={() => dismissToast(toast.id)}
                className="ml-2 rounded-full p-1 hover:bg-surface-soft transition"
              >
                <X className="h-4 w-4 text-text-muted" strokeWidth={iconStroke} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

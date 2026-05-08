import { AnimatePresence } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Navbar, Footer } from "./components/Layout";
import { familyConfig } from "./config";
import { useSiteConfigEffects } from "./hooks/useSiteConfigEffects";
import { GalleryPage } from "./pages/GalleryPage";
import { LandingPage } from "./pages/LandingPage";
import { MemberProfilePage } from "./pages/MemberProfilePage";
import { MembersPage } from "./pages/MembersPage";
import { TimelinePage } from "./pages/TimelinePage";
import { TreePage } from "./pages/TreePage";
import { SpaceListPage } from "./pages/SpaceListPage";
import { SpaceDashboard } from "./pages/SpaceDashboard";
import { SpaceLayout } from "./layouts/SpaceLayout";
import { SpaceProvider } from "./hooks/useSpaceStore";

import { AdminLoginPage } from "./admin/pages/AdminLoginPage";

export default function App() {
  const location = useLocation();
  const isAuthRoute = location.pathname.startsWith("/auth");
  const isLandingRoute = location.pathname === "/" || location.pathname === "/landing" || location.pathname.startsWith("/landing/");
  const isAppRoute = location.pathname.startsWith("/app");
  useSiteConfigEffects();

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {!isAppRoute && !isLandingRoute && !isAuthRoute && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/auth/*" element={<AdminLoginPage />} />

          {/* Private routes - app/workspace */}
          <Route path="/app" element={<SpaceListPage />} />
          <Route
            path="/app/:spaceSlug/*"
            element={
              <SpaceProvider>
                <SpaceLayout />
              </SpaceProvider>
            }
          >
            <Route index element={<SpaceDashboard />} />
            <Route path="tree" element={<TreePage />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="members/:memberId" element={<MemberProfilePage />} />
            <Route path="timeline" element={<TimelinePage />} />
            <Route path="gallery" element={familyConfig.features.gallery ? <GalleryPage /> : <Navigate to="." replace />} />
          </Route>

          {/* Catch-all: redirect to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      {!isAppRoute && !isLandingRoute && !isAuthRoute && <Footer />}

      {/* Global Toast Container - only for non-app routes */}
      {!isAppRoute && (
        <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-3">
          <AnimatePresence>
            {/* Toasts from old family store - now replaced by space store */}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

import { AnimatePresence } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Navbar, Footer } from "./components/Layout";
import { useSiteConfigEffects } from "./hooks/useSiteConfigEffects";
import { PlatformLayout } from "./layouts/PlatformLayout";
import { GalleryPage } from "./pages/GalleryPage";
import { LandingPage } from "./pages/LandingPage";
import { MemberProfilePage } from "./pages/MemberProfilePage";
import { MembersPage } from "./pages/MembersPage";
import { AuthPage } from "./pages/AuthPage";
import { TimelinePage } from "./pages/TimelinePage";
import { TreePage } from "./pages/TreePage";
import { SpaceListPage } from "./pages/SpaceListPage";
import { SpaceDashboard } from "./pages/SpaceDashboard";
import { SpaceLayout } from "./layouts/SpaceLayout";
import { SpaceProvider } from "./hooks/useSpaceStore";
import { StoriesPage } from "./pages/StoriesPage";
import { SpaceSettingsPage } from "./pages/SpaceSettingsPage";
import { PlatformDashboard } from "./pages/platform/PlatformDashboard";
import { PlatformSpacesPage } from "./pages/platform/PlatformSpacesPage";
import { PlatformStatsPage } from "./pages/platform/PlatformStatsPage";
import { PlatformSystemPage } from "./pages/platform/PlatformSystemPage";
import { PlatformUsersPage } from "./pages/platform/PlatformUsersPage";

export default function App() {
  const location = useLocation();
  const isAuthRoute = location.pathname.startsWith("/auth");
  const isLandingRoute = location.pathname === "/" || location.pathname === "/landing" || location.pathname.startsWith("/landing/");
  const isAppRoute = location.pathname.startsWith("/app");
  const isPlatformRoute = location.pathname.startsWith("/platform");
  useSiteConfigEffects();

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {!isAppRoute && !isPlatformRoute && !isLandingRoute && !isAuthRoute && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/auth/*" element={<AuthPage />} />

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
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="stories" element={<StoriesPage />} />
            <Route path="settings" element={<SpaceSettingsPage />} />
          </Route>

          {/* Platform operator console */}
          <Route path="/platform" element={<PlatformLayout />}>
            <Route index element={<PlatformDashboard />} />
            <Route path="stats" element={<PlatformStatsPage />} />
            <Route path="users" element={<PlatformUsersPage />} />
            <Route path="spaces" element={<PlatformSpacesPage />} />
            <Route path="system" element={<PlatformSystemPage />} />
          </Route>

          {/* Catch-all: redirect to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      {!isAppRoute && !isPlatformRoute && !isLandingRoute && !isAuthRoute && <Footer />}

      {/* Global Toast Container - only for non-app routes */}
      {!isAppRoute && !isPlatformRoute && (
        <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-3">
          <AnimatePresence>
            {/* Toasts from old family store - now replaced by space store */}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

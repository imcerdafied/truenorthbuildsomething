import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import { Layout } from "@/components/layout/Layout";
import { HomePage } from "@/pages/HomePage";
import { OKRsPage } from "@/pages/OKRsPage";
import { OKRDetailPage } from "@/pages/OKRDetailPage";
import { CreateOKRPage } from "@/pages/CreateOKRPage";
import { CheckInPage } from "@/pages/CheckInPage";
import { QBRPage } from "@/pages/QBRPage";
import { TeamReviewPage } from "@/pages/TeamReviewPage";
import { ExportsPage } from "@/pages/ExportsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { AboutPage } from "@/pages/AboutPage";
import { AuthPage } from "@/pages/AuthPage";
import { OrganizationSetupPage } from "@/pages/OrganizationSetupPage";
import { FirstOutcomePage } from "@/pages/FirstOutcomePage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { MemberOnlyRoute } from "@/components/auth/MemberOnlyRoute";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

const App = () => (
    <TooltipProvider>
      <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<AuthPage />} />
              
              {/* Protected routes */}
              <Route path="/setup" element={
                <ProtectedRoute requireSetup={false}>
                  <OrganizationSetupPage />
                </ProtectedRoute>
              } />

              <Route path="/first-outcome" element={
                <ProtectedRoute>
                  <MemberOnlyRoute>
                    <FirstOutcomePage />
                  </MemberOnlyRoute>
                </ProtectedRoute>
              } />
              
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<HomePage />} />
                <Route path="okrs" element={<OKRsPage />} />
                <Route path="okrs/create" element={<CreateOKRPage />} />
                <Route path="okrs/:okrId" element={<OKRDetailPage />} />
                <Route path="checkin" element={<CheckInPage />} />
                <Route path="qbr" element={<QBRPage />} />
                <Route path="team-review" element={<TeamReviewPage />} />
                <Route path="exports" element={<ExportsPage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
      </ErrorBoundary>
    </TooltipProvider>
);

export default App;

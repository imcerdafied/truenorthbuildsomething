import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import { Layout } from "@/components/layout/Layout";
import { HomePage } from "@/pages/HomePage";
import { OKRsPage } from "@/pages/OKRsPage";
import { OKRDetailPage } from "@/pages/OKRDetailPage";
import { CreateOKRPage } from "@/pages/CreateOKRPage";
import { CheckInPage } from "@/pages/CheckInPage";
import { AlignmentPage } from "@/pages/AlignmentPage";
import { QBRPage } from "@/pages/QBRPage";
import { ExportsPage } from "@/pages/ExportsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { AuthPage } from "@/pages/AuthPage";
import { OrganizationSetupPage } from "@/pages/OrganizationSetupPage";
import { FirstOutcomePage } from "@/pages/FirstOutcomePage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
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
                  <FirstOutcomePage />
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
                <Route path="alignment" element={<AdminRoute><AlignmentPage /></AdminRoute>} />
                <Route path="qbr" element={<QBRPage />} />
                <Route path="exports" element={<ExportsPage />} />
                <Route path="settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

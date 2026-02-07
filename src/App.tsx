import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { Layout } from "@/components/layout/Layout";
import { HomePage } from "@/pages/HomePage";
import { OKRsPage } from "@/pages/OKRsPage";
import { OKRDetailPage } from "@/pages/OKRDetailPage";
import { CheckInPage } from "@/pages/CheckInPage";
import { AlignmentPage } from "@/pages/AlignmentPage";
import { QBRPage } from "@/pages/QBRPage";
import { ExportsPage } from "@/pages/ExportsPage";
import { SettingsPage } from "@/pages/SettingsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="okrs" element={<OKRsPage />} />
              <Route path="okrs/:okrId" element={<OKRDetailPage />} />
              <Route path="checkin" element={<CheckInPage />} />
              <Route path="alignment" element={<AlignmentPage />} />
              <Route path="qbr" element={<QBRPage />} />
              <Route path="exports" element={<ExportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

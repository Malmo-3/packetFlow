import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import WorkWithUs from "./pages/WorkWithUs";

import SenderDashboard from "./pages/sender/SenderDashboard";
import SenderCreatePackage from "./pages/sender/SenderCreatePackage";
import SenderShipments from "./pages/sender/SenderShipments";
import PackageDetail from "./pages/PackageDetail";

import RecipientDashboard from "./pages/recipient/RecipientDashboard";
import RecipientTrack from "./pages/recipient/RecipientTrack";
import RecipientTrackResult from "./pages/recipient/RecipientTrackResult";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminRoutes from "./pages/admin/AdminRoutes";
import AdminPackages from "./pages/admin/AdminPackages";
import AdminWebhooks from "./pages/admin/AdminWebhooks";

import CarrierPackages from "./pages/carrier/CarrierPackages";
import CarrierRoutes from "./pages/carrier/CarrierRoutes";
import NotificationsPage from "./pages/Notifications";

const queryClient = new QueryClient();

const shell = (allow: Parameters<typeof ProtectedRoute>[0]["allow"], element: JSX.Element) => (
  <ProtectedRoute allow={allow}>
    <AppShell>{element}</AppShell>
  </ProtectedRoute>
);

const App = () => (
  <ThemeProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/work-with-us" element={<WorkWithUs />} />

            {/* Public tracking by code (also used by signed-in recipients) */}
            <Route path="/track/:code" element={<RecipientTrackResult />} />

            {/* Sender */}
            <Route path="/sender" element={shell(["sender"], <SenderDashboard />)} />
            <Route path="/sender/packages" element={shell(["sender"], <SenderShipments />)} />
            <Route path="/sender/packages/new" element={shell(["sender"], <SenderCreatePackage />)} />
            <Route path="/sender/packages/:id" element={shell(["sender"], <PackageDetail />)} />

            {/* Recipient */}
            <Route path="/recipient" element={shell(["recipient"], <RecipientDashboard />)} />
            <Route path="/recipient/track" element={shell(["recipient"], <RecipientTrack />)} />

            {/* Admin only */}
            <Route path="/admin" element={shell(["admin"], <AdminDashboard />)} />
            <Route path="/admin/users" element={shell(["admin"], <AdminUsers />)} />
            <Route path="/admin/routes" element={shell(["admin"], <AdminRoutes />)} />
            <Route path="/admin/packages" element={shell(["admin"], <AdminPackages />)} />
            <Route path="/admin/webhooks" element={shell(["admin"], <AdminWebhooks />)} />

            {/* Carrier — own namespace, no overlap with /admin */}
            <Route path="/carrier/packages" element={shell(["carrier"], <CarrierPackages />)} />
            <Route path="/carrier/routes" element={shell(["carrier"], <CarrierRoutes />)} />

            {/* Notifications — accessible to all authenticated roles */}
            <Route path="/notifications" element={shell(["sender", "recipient", "carrier", "admin"], <NotificationsPage />)} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;

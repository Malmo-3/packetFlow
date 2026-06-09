import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
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
import SenderCreatePackage from "./features/packages/SenderCreatePackage";
import SenderShipments from "./features/packages/SenderShipments";
import PackageDetail from "./pages/PackageDetail";

import RecipientDashboard from "./pages/recipient/RecipientDashboard";
import RecipientTrack from "./pages/recipient/RecipientTrack";
import RecipientTrackResult from "./pages/recipient/RecipientTrackResult";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTrips from "./pages/admin/AdminTrips";
import AdminPackages from "./features/packages/AdminPackages";
import AdminWebhooks from "./pages/admin/AdminWebhooks";
import AdminApplications from "./pages/admin/AdminApplications";

import CarrierPackages from "./features/packages/CarrierPackages";
import CarrierTrips from "./pages/carrier/CarrierTrips";
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
            <Route path="/admin/trips" element={shell(["admin"], <AdminTrips />)} />
            {/* Back-compat: old /admin/routes URL redirects to /admin/trips */}
            <Route path="/admin/routes" element={<Navigate to="/admin/trips" replace />} />
            <Route path="/admin/packages" element={shell(["admin"], <AdminPackages />)} />
            <Route path="/admin/webhooks" element={shell(["admin"], <AdminWebhooks />)} />
            <Route path="/admin/applications" element={shell(["admin"], <AdminApplications />)} />

            {/* Carrier — own namespace, no overlap with /admin */}
            <Route path="/carrier/packages" element={shell(["carrier"], <CarrierPackages />)} />
            <Route path="/carrier/trips" element={shell(["carrier"], <CarrierTrips />)} />
            {/* Back-compat: old /carrier/routes URL redirects to /carrier/trips */}
            <Route path="/carrier/routes" element={<Navigate to="/carrier/trips" replace />} />

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

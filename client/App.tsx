import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { UserProvider } from "@/context/UserContext";

// Auth Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

// Main Pages
import Dashboard from "./pages/Dashboard";
import InvoiceUpload from "./pages/InvoiceUpload";
import InvoiceList from "./pages/InvoiceList";
import Inventory from "./pages/Inventory";
import GSTReports from "./pages/GSTReports";
import Analytics from "./pages/Analytics";
import Chatbot from "./pages/Chatbot";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Expenses from "./pages/Expenses";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    {/* Landing Page */}
    <Route path="/" element={<Landing />} />

    {/* Auth Routes */}
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />

    {/* Main Routes with Layout */}
    <Route element={<MainLayout />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/upload" element={<InvoiceUpload />} />
      <Route path="/invoices" element={<InvoiceList />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/gst-reports" element={<GSTReports />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/chatbot" element={<Chatbot />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/expenses" element={<Expenses />} />
    </Route>

    {/* Catch-all */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

const AppWithProviders = () => (
  <UserProvider>
    <App />
  </UserProvider>
);

function AppWrapper() {
  useEffect(() => {
    // Use landing page dark theme across the whole app
    try {
      document.documentElement.classList.add('dark');
    } catch (e) {
      // noop for non-browser environments
    }
    return () => {
      try {
        document.documentElement.classList.remove('dark');
      } catch (e) {}
    };
  }, []);

  return <AppWithProviders />;
}

createRoot(document.getElementById("root")!).render(<AppWrapper />);

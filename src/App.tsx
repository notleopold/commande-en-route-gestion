import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import ClerkAuth from "./pages/ClerkAuth";
import Suppliers from "./pages/Suppliers";
import SupplierDetail from "./pages/SupplierDetail";
import OrderDetail from "./pages/OrderDetail";
import OrderEdit from "./pages/OrderEdit";
import ProductDetail from "./pages/ProductDetail";
import Products from "./pages/Products";
import Clients from "./pages/Clients";
import Orders from "./pages/Orders";
import Groupage from "./pages/Groupage";
import Documents from "./pages/Documents";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import ClerkUsers from "./pages/ClerkUsers";
import Profile from "./pages/Profile";
import Organizations from "./pages/Organizations";
import Settings from "./pages/Settings";
import TrashManagement from "./pages/TrashManagement";
import Transitaires from "./pages/Transitaires";
import NotFound from "./pages/NotFound";
import { ClerkProtectedRoute } from "./components/ClerkProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ClerkProtectedRoute><Index /></ClerkProtectedRoute>} />
          <Route path="/auth" element={<ClerkAuth />} />
          <Route path="/suppliers" element={<ClerkProtectedRoute><Suppliers /></ClerkProtectedRoute>} />
          <Route path="/suppliers/:id" element={<ClerkProtectedRoute><SupplierDetail /></ClerkProtectedRoute>} />
          <Route path="/orders/:id" element={<ClerkProtectedRoute><OrderDetail /></ClerkProtectedRoute>} />
          <Route path="/orders/:id/edit" element={<ClerkProtectedRoute><OrderEdit /></ClerkProtectedRoute>} />
          <Route path="/products/:id" element={<ClerkProtectedRoute><ProductDetail /></ClerkProtectedRoute>} />
          <Route path="/products" element={<ClerkProtectedRoute><Products /></ClerkProtectedRoute>} />
          <Route path="/clients" element={<ClerkProtectedRoute><Clients /></ClerkProtectedRoute>} />
          <Route path="/orders" element={<ClerkProtectedRoute><Orders /></ClerkProtectedRoute>} />
          <Route path="/transitaires" element={<ClerkProtectedRoute><Transitaires /></ClerkProtectedRoute>} />
          <Route path="/containers" element={<Navigate to="/groupage" replace />} />
          <Route path="/groupage" element={<ClerkProtectedRoute><Groupage /></ClerkProtectedRoute>} />
          <Route path="/documents" element={<ClerkProtectedRoute><Documents /></ClerkProtectedRoute>} />
          <Route path="/reports" element={<ClerkProtectedRoute><Reports /></ClerkProtectedRoute>} />
            <Route path="/users" element={<ClerkProtectedRoute><Users /></ClerkProtectedRoute>} />
            <Route path="/clerk-users" element={<ClerkProtectedRoute><ClerkUsers /></ClerkProtectedRoute>} />
            <Route path="/profile" element={<ClerkProtectedRoute><Profile /></ClerkProtectedRoute>} />
            <Route path="/organizations" element={<ClerkProtectedRoute><Organizations /></ClerkProtectedRoute>} />
            <Route path="/settings" element={<ClerkProtectedRoute><Settings /></ClerkProtectedRoute>} />
            <Route path="/trash" element={<ClerkProtectedRoute><TrashManagement /></ClerkProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

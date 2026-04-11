import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BusinessProvider } from './context/BusinessContext';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import OrdersHistoryPage from './pages/OrdersHistoryPage';
import StatsPage from './pages/StatsPage';
import ProductsPage from './pages/ProductsPage';
import CustomersPage from './pages/CustomersPage';
import ExpensesPage from './pages/ExpensesPage';
import TenantHomeRedirect from './components/TenantHomeRedirect';
import { Toaster } from "@/components/ui/sonner";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }
    return <>{children}</>;
};

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />

                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute>
                                <AdminLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<AdminDashboardPage />} />
                    </Route>

                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <BusinessProvider>
                                    <DashboardLayout />
                                </BusinessProvider>
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<TenantHomeRedirect />} />
                        <Route path="history" element={<OrdersHistoryPage />} />
                        <Route path="stats" element={<StatsPage />} />
                        <Route path="products" element={<ProductsPage />} />
                        <Route path="customers" element={<CustomersPage />} />
                        <Route path="expenses" element={<ExpensesPage />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
                <Toaster position="bottom-right" richColors />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;

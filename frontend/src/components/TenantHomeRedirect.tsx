import { Navigate } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import OrdersPage from '../pages/OrdersPage';

/**
 * Raíz del dashboard: pedidos, o redirección a estadísticas si suscripción vencida.
 */
export default function TenantHomeRedirect() {
    const { currentBusiness, isLoading } = useBusiness();
    const { logout } = useAuth();

    if (isLoading) {
        return (
            <div className="p-8 text-center text-gray-600">
                Cargando...
            </div>
        );
    }

    if (currentBusiness?.billingStatus === 'VENCIDO') {
        return <Navigate to="/dashboard/stats" replace />;
    }

    if (!currentBusiness) {
        return (
            <div className="mx-auto max-w-xl rounded-xl border border-[#E5D9D1] bg-white p-6 text-center space-y-3">
                <h2 className="text-lg font-semibold text-[#262626]">Sesión no disponible</h2>
                <p className="text-sm text-gray-600">
                    No pudimos cargar tu negocio activo. Volvé a iniciar sesión para continuar.
                </p>
                <Button className="bg-[#F24452] hover:bg-[#F23D3D]" onClick={logout}>
                    Ir a login
                </Button>
            </div>
        );
    }

    return <OrdersPage />;
}

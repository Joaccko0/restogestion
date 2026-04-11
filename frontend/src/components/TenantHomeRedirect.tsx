import { Navigate } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import OrdersPage from '../pages/OrdersPage';

/**
 * Raíz del dashboard: pedidos, o redirección a estadísticas si suscripción vencida.
 */
export default function TenantHomeRedirect() {
    const { currentBusiness, isLoading } = useBusiness();

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

    return <OrdersPage />;
}

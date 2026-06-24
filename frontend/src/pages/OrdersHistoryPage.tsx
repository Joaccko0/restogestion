import { RefreshCw, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBusiness } from '../context/BusinessContext';
import { useOrdersHistoric } from '../hooks/useOrdersHistoric';
import { OrdersHistoryView } from '../components/OrdersHistoryView';

export default function OrdersHistoryPage() {
    const { currentBusiness } = useBusiness();
    const { orders, cashShifts, loading, loadOrdersHistoric } = useOrdersHistoric(
        currentBusiness?.id
    );

    return (
        <div className="app-page">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#262626] flex items-center gap-2">
                        <History className="h-7 w-7 text-[#F24452]" />
                        Historial de pedidos
                    </h2>
                    <p className="text-gray-500 mt-0.5">
                        Consultá y filtrá todos los pedidos del negocio
                    </p>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void loadOrdersHistoric()}
                    disabled={loading}
                    className="border-[#E5D9D1] text-gray-600 hover:bg-[#F2EDE4] shrink-0 self-start sm:self-auto touch-target"
                >
                    <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </Button>
            </div>

            <OrdersHistoryView orders={orders} cashShifts={cashShifts} loading={loading} />
        </div>
    );
}

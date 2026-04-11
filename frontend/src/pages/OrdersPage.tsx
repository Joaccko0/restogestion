/**
 * Página principal de gestión de órdenes (Pedidos)
 * Tablero Kanban con drag & drop
 * Requiere caja abierta para crear/gestionar pedidos
 */

import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBusiness } from '../context/BusinessContext';
import { useOrders } from '../hooks/useOrders';
import { useProducts } from '../hooks/useProducts';
import { useCombos } from '../hooks/useCombos';
import { useCustomers } from '../hooks/useCustomers';
import { useCashShift } from '../hooks/useCashShift';
import { KanbanBoard } from '../components/KanbanBoard';
import { OrderDetailsDialog } from '../components/OrderDetailsDialog';
import { CreateOrderDialog } from '../components/CreateOrderDialog';
import { CashShiftStatus } from '../components/CashShiftStatus';
import { OpenCashDialog } from '../components/OpenCashDialog';
import { CloseCashDialog } from '../components/CloseCashDialog';
import type { OrderResponse, OrderStatus } from '../types/order.types';

/**
 * Página principal: Tablero Kanban de Pedidos
 */
export default function OrdersPage() {
    const { currentBusiness } = useBusiness();
    const {
        orders,
        loading,
        loadOrders,
        createOrder,
        updateOrderStatus,
        updateOrderDetails,
        cancelOrder
    } = useOrders(currentBusiness?.id);

    const { products } = useProducts(currentBusiness?.id ?? null);
    const { combos } = useCombos(currentBusiness?.id ?? null);
    const { customers, loadCustomers } = useCustomers(currentBusiness?.id || null);

    // Gestión de CashShift
    const { openCashShift, loading: cashLoading, openCash, closeCash } = useCashShift();
    const [showOpenCashDialog, setShowOpenCashDialog] = useState(false);
    const [showCloseCashDialog, setShowCloseCashDialog] = useState(false);

    const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);

    const handleOrderClick = (order: OrderResponse) => {
        setSelectedOrder(order);
        setShowDetails(true);
    };

    const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
        await updateOrderStatus(orderId, newStatus);
    };

    const handleCancelOrder = async (orderId: number) => {
        await cancelOrder(orderId);
        setShowDetails(false);
    };

    // Manejador para crear orden (validar que hay caja abierta)
    const handleCreateOrder = async (data: any) => {
        if (!openCashShift) {
            return false;
        }
        return createOrder(data);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F2EDE4] to-[#E5D9D1] p-6">
            <div className="max-w-[1800px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-[#0D0D0D]">
                            Pedidos
                        </h1>
                        <p className="text-sm text-[#262626] mt-1">
                            Gestión de pedidos en tiempo real
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadOrders}
                            disabled={loading}
                            className="border-[#E5D9D1]"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Actualizar
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => setShowCreateDialog(true)}
                            disabled={!openCashShift}
                            className="bg-[#F24452] hover:bg-[#F23D3D] disabled:opacity-50"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Nuevo Pedido
                        </Button>
                    </div>
                </div>

                {/* Estado de Caja */}
                <CashShiftStatus
                    cashShift={openCashShift}
                    onOpenClick={() => setShowOpenCashDialog(true)}
                    onCloseClick={() => setShowCloseCashDialog(true)}
                    loading={cashLoading}
                />
                {/* Estadísticas rápidas (solo mostrar si hay caja abierta) */}
                {openCashShift && (
                    <div className="grid grid-cols-4 gap-4">
                        <StatCard
                            title="Pendientes"
                            count={orders.filter(o => o.orderStatus === 'PENDING').length}
                            color="bg-amber-500"
                        />
                        <StatCard
                            title="En Preparación"
                            count={orders.filter(o => o.orderStatus === 'PREPARING').length}
                            color="bg-blue-500"
                        />
                        <StatCard
                            title="Listos"
                            count={orders.filter(o => o.orderStatus === 'READY').length}
                            color="bg-green-500"
                        />
                        <StatCard
                            title="Entregados"
                            count={orders.filter(o => o.orderStatus === 'DELIVERED').length}
                            color="bg-gray-500"
                        />
                    </div>
                )}

                {/* Tablero Kanban */}
                {openCashShift ? (
                    loading && orders.length === 0 ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <RefreshCw className="w-8 h-8 animate-spin text-[#F24452] mx-auto mb-2" />
                                <p className="text-sm text-gray-500">Cargando pedidos...</p>
                            </div>
                        </div>
                    ) : (
                        <KanbanBoard
                            orders={orders}
                            onOrderClick={handleOrderClick}
                            onStatusChange={handleStatusChange}
                        />
                    )
                ) : null}
            </div>

            {/* Dialogs */}
            <OrderDetailsDialog
                order={selectedOrder}
                open={showDetails}
                onOpenChange={setShowDetails}
                onCancel={handleCancelOrder}
                onUpdateDetails={updateOrderDetails}
            />

            <CreateOrderDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onSubmit={handleCreateOrder}
                products={products}
                combos={combos}
                customers={customers}
                businessId={currentBusiness?.id || 0}
                onCustomersChanged={loadCustomers}
            />

            <OpenCashDialog
                open={showOpenCashDialog}
                onOpenChange={setShowOpenCashDialog}
                onSubmit={openCash}
                loading={cashLoading}
            />

            <CloseCashDialog
                open={showCloseCashDialog}
                onOpenChange={setShowCloseCashDialog}
                onSubmit={closeCash}
                cashShift={openCashShift}
                orders={orders}
                onClosed={loadOrders}
                loading={cashLoading}
            />
        </div>
    );
}

/**
 * Tarjeta de estadística
 */
function StatCard({ title, count, color }: { title: string; count: number; color: string }) {
    return (
        <div className="bg-white p-4 rounded-lg border-2 border-[#E5D9D1] shadow-sm">
            <div className="flex items-center gap-3">
                <div className={`w-2 h-12 rounded-full ${color}`} />
                <div>
                    <div className="text-2xl font-bold text-[#0D0D0D]">{count}</div>
                    <div className="text-xs text-gray-600">{title}</div>
                </div>
            </div>
        </div>
    );
}

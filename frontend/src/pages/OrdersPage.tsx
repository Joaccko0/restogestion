/**
 * Página principal de gestión de órdenes (Pedidos)
 * Tablero Kanban con drag & drop
 * Requiere caja abierta para crear/gestionar pedidos
 */

import { useState } from 'react';
import { Plus, RefreshCw, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBusiness } from '../context/BusinessContext';
import { useOrders } from '../hooks/useOrders';
import { useProducts } from '../hooks/useProducts';
import { useCombos } from '../hooks/useCombos';
import { useCustomers } from '../hooks/useCustomers';
import { useCashShift } from '../hooks/useCashShift';
import { useMenuCategories } from '../hooks/useMenuCategories';
import { KanbanBoard } from '../components/KanbanBoard';
import { MobileOrdersBoard } from '../components/MobileOrdersBoard';
import { OrderDetailsDialog } from '../components/OrderDetailsDialog';
import { CreateOrderDialog } from '../components/CreateOrderDialog';
import { CashShiftStatus } from '../components/CashShiftStatus';
import { OpenCashDialog } from '../components/OpenCashDialog';
import { CloseCashDialog } from '../components/CloseCashDialog';
import { DeliveryFeeDialog } from '../components/DeliveryFeeDialog';
import type { OrderResponse, OrderStatus } from '../types/order.types';

/**
 * Página principal: Tablero Kanban de Pedidos
 */
export default function OrdersPage() {
    const { currentBusiness, refreshBusiness } = useBusiness();
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
    const { categories: menuCategories } = useMenuCategories(currentBusiness?.id || null);
    const [showOpenCashDialog, setShowOpenCashDialog] = useState(false);
    const [showCloseCashDialog, setShowCloseCashDialog] = useState(false);

    const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showDeliveryFeeDialog, setShowDeliveryFeeDialog] = useState(false);

    const handleOrderClick = (order: OrderResponse) => {
        setSelectedOrder(order);
        setShowDetails(true);
    };

    const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
        await updateOrderStatus(orderId, newStatus);
    };

    const handleMarkPaid = async (orderId: number) => {
        const updated = await updateOrderDetails(orderId, { paymentStatus: 'PAID' });
        if (updated && selectedOrder?.id === orderId) {
            setSelectedOrder(updated);
        }
    };

    const handleUpdateDetails = async (
        orderId: number,
        details: Parameters<typeof updateOrderDetails>[1]
    ) => {
        const updated = await updateOrderDetails(orderId, details);
        if (updated && selectedOrder?.id === orderId) {
            setSelectedOrder(updated);
        }
        return updated;
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
        <div className="app-page">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#0D0D0D]">
                            Pedidos
                        </h1>
                        <p className="text-sm text-[#262626] mt-1">
                            Gestión de pedidos en tiempo real
                        </p>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeliveryFeeDialog(true)}
                            className="border-[#E5D9D1] text-gray-600 touch-target"
                        >
                            <Truck className="w-4 h-4 mr-1.5" />
                            Delivery ${currentBusiness?.deliveryFee ?? 0}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadOrders}
                            disabled={loading}
                            className="border-[#E5D9D1] touch-target"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Actualizar
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => setShowCreateDialog(true)}
                            disabled={!openCashShift}
                            className="bg-[#F24452] hover:bg-[#F23D3D] disabled:opacity-50 touch-target"
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
                        <>
                            <MobileOrdersBoard
                                orders={orders}
                                onOrderClick={handleOrderClick}
                                onStatusChange={handleStatusChange}
                                onMarkPaid={handleMarkPaid}
                            />
                            <div className="hidden md:block">
                                <KanbanBoard
                                    orders={orders}
                                    onOrderClick={handleOrderClick}
                                    onStatusChange={handleStatusChange}
                                    onMarkPaid={handleMarkPaid}
                                />
                            </div>
                        </>
                    )
                ) : null}

            {/* Dialogs */}
            <OrderDetailsDialog
                order={selectedOrder}
                open={showDetails}
                onOpenChange={setShowDetails}
                businessId={currentBusiness?.id || 0}
                customers={customers}
                products={products}
                combos={combos}
                onCustomersChanged={loadCustomers}
                onCancel={handleCancelOrder}
                onUpdateDetails={handleUpdateDetails}
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
                deliveryFee={currentBusiness?.deliveryFee ?? 0}
            />

            <DeliveryFeeDialog
                open={showDeliveryFeeDialog}
                onOpenChange={setShowDeliveryFeeDialog}
                businessId={currentBusiness?.id ?? 0}
                currentFee={currentBusiness?.deliveryFee ?? 0}
                onSaved={() => void refreshBusiness()}
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
                menuCategories={menuCategories}
                onClosed={loadOrders}
                loading={cashLoading}
            />
        </div>
    );
}

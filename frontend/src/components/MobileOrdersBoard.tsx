import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CreditCard, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '../lib/utils';
import { formatTimeAR } from '../lib/datetime';
import type { OrderResponse, OrderStatus } from '../types/order.types';
import { OrderStatus as OS, OrderStatusLabels, PaymentStatusLabels } from '../types/order.types';

interface MobileOrdersBoardProps {
    orders: OrderResponse[];
    onOrderClick: (order: OrderResponse) => void;
    onStatusChange: (orderId: number, newStatus: OrderStatus) => Promise<void>;
    onMarkPaid?: (orderId: number) => void;
}

const MOBILE_STATUSES: OrderStatus[] = [OS.PENDING, OS.PREPARING, OS.READY, OS.DELIVERED];

export function MobileOrdersBoard({
    orders,
    onOrderClick,
    onStatusChange,
    onMarkPaid,
}: MobileOrdersBoardProps) {
    const [activeStatus, setActiveStatus] = useState<OrderStatus>(OS.PENDING);
    const [movingOrderId, setMovingOrderId] = useState<number | null>(null);

    const ordersByStatus = useMemo(() => {
        return MOBILE_STATUSES.reduce(
            (acc, status) => {
                acc[status] = orders.filter((order) => order.orderStatus === status);
                return acc;
            },
            {} as Record<OrderStatus, OrderResponse[]>
        );
    }, [orders]);

    useEffect(() => {
        if (ordersByStatus[activeStatus]?.length > 0) return;
        const firstWithOrders = MOBILE_STATUSES.find((status) => ordersByStatus[status]?.length > 0);
        if (firstWithOrders) {
            setActiveStatus(firstWithOrders);
        }
    }, [ordersByStatus, activeStatus]);

    const activeOrders = ordersByStatus[activeStatus] ?? [];

    const moveOrder = async (orderId: number, targetStatus: OrderStatus) => {
        setMovingOrderId(orderId);
        try {
            await onStatusChange(orderId, targetStatus);
            setActiveStatus(targetStatus);
        } finally {
            setMovingOrderId(null);
        }
    };

    return (
        <div className="md:hidden space-y-3">
            <div className="rounded-xl border border-[#E5D9D1] bg-white p-3">
                <p className="text-xs text-gray-500 mb-2">Vista móvil por estado</p>
                <div className="grid grid-cols-2 gap-2">
                    {MOBILE_STATUSES.map((status) => {
                        const count = ordersByStatus[status]?.length ?? 0;
                        const isActive = status === activeStatus;
                        return (
                            <button
                                key={status}
                                type="button"
                                onClick={() => setActiveStatus(status)}
                                className={`rounded-lg border px-3 py-2 text-left ${
                                    isActive
                                        ? 'border-[#F24452] bg-[#F24452]/10'
                                        : 'border-[#E5D9D1] bg-[#F8F4EF]'
                                }`}
                            >
                                <p className={`text-xs ${isActive ? 'text-[#F24452]' : 'text-gray-500'}`}>
                                    {OrderStatusLabels[status]}
                                </p>
                                <p className="font-semibold text-[#262626]">{count}</p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {activeOrders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#E5D9D1] bg-white p-6 text-center">
                    <p className="text-sm text-gray-600">
                        No hay pedidos en <strong>{OrderStatusLabels[activeStatus]}</strong>
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {activeOrders.map((order) => {
                        const currentIdx = MOBILE_STATUSES.indexOf(order.orderStatus);
                        const prevStatus = currentIdx > 0 ? MOBILE_STATUSES[currentIdx - 1] : null;
                        const nextStatus =
                            currentIdx < MOBILE_STATUSES.length - 1 ? MOBILE_STATUSES[currentIdx + 1] : null;
                        const isMoving = movingOrderId === order.id;

                        return (
                            <article
                                key={order.id}
                                className="rounded-xl border border-[#E5D9D1] bg-white p-4 shadow-sm space-y-3"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-semibold text-[#262626]">Pedido #{order.id}</p>
                                        <p className="text-xs text-gray-500">
                                            {order.customerName || 'Sin cliente'} · {formatTimeAR(order.createdAt)}
                                        </p>
                                    </div>
                                    <p className="font-bold text-[#262626] tabular-nums whitespace-nowrap shrink-0">
                                        {formatCurrency(order.total)}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge className="bg-[#F2EDE4] text-[#262626] border border-[#E5D9D1]">
                                        {OrderStatusLabels[order.orderStatus]}
                                    </Badge>
                                    <Badge
                                        className={
                                            order.paymentStatus === 'PAID'
                                                ? 'bg-emerald-500 text-white border-0'
                                                : 'bg-[#F24452] text-white border-0'
                                        }
                                    >
                                        {PaymentStatusLabels[order.paymentStatus]}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant="outline"
                                        className="touch-target border-[#E5D9D1]"
                                        onClick={() => onOrderClick(order)}
                                    >
                                        <Eye className="h-4 w-4 mr-1.5" />
                                        Ver detalle
                                    </Button>
                                    {order.paymentStatus !== 'PAID' && onMarkPaid ? (
                                        <Button
                                            className="touch-target bg-[#F24452] hover:bg-[#F23D3D]"
                                            onClick={() => onMarkPaid(order.id)}
                                        >
                                            <CreditCard className="h-4 w-4 mr-1.5" />
                                            Cobrar
                                        </Button>
                                    ) : (
                                        <div />
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant="outline"
                                        className="touch-target border-[#E5D9D1]"
                                        disabled={!prevStatus || isMoving}
                                        onClick={() => prevStatus && void moveOrder(order.id, prevStatus)}
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-1.5" />
                                        {prevStatus ? OrderStatusLabels[prevStatus] : 'Sin anterior'}
                                    </Button>
                                    <Button
                                        className="touch-target bg-[#262626] hover:bg-[#1a1a1a] text-white"
                                        disabled={!nextStatus || isMoving}
                                        onClick={() => nextStatus && void moveOrder(order.id, nextStatus)}
                                    >
                                        {nextStatus ? OrderStatusLabels[nextStatus] : 'Estado final'}
                                        <ArrowRight className="h-4 w-4 ml-1.5" />
                                    </Button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

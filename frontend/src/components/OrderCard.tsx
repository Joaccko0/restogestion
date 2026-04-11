/**
 * Tarjeta individual de pedido para el tablero Kanban
 * Muestra información resumida del pedido
 */

import { Clock, Package, CreditCard, MapPin, User, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { OrderResponse } from '../types/order.types';
import {
    PaymentMethodLabels,
    DeliveryMethodLabels,
} from '../types/order.types';

interface OrderCardProps {
    order: OrderResponse;
    onClick?: () => void;
    isDragging?: boolean;
}

/**
 * Tarjeta de pedido para el Kanban
 * Clickeable para ver detalles
 */
export function OrderCard({ order, onClick, isDragging }: OrderCardProps) {
    const timeAgo = formatTimeAgo(order.createdAt);

    return (
        <Card
            onClick={onClick}
            className={`p-3 cursor-pointer hover:shadow-md transition-all duration-200 bg-white border-2 ${
                isDragging ? 'opacity-50 rotate-2' : ''
            }`}
        >
            {/* Header: ID, tiempo y método de entrega */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-[#F24452]" />
                    <span className="font-semibold text-sm text-[#0D0D0D]">
                        Pedido #{order.id}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {/* ESTADO DE PAGO - MUY VISIBLE */}
                    {order.paymentStatus === 'PAID' ? (
                        <Badge className="text-[11px] py-1 px-2 bg-green-500 text-white border-0 font-semibold">
                            ✓ PAGADO
                        </Badge>
                    ) : (
                        <Badge className="text-[11px] py-1 px-2 bg-red-500 text-white border-0 font-semibold">
                            ⚠ NO PAGADO
                        </Badge>
                    )}
                    <Badge variant="secondary" className="text-[10px] py-0.5 px-2">
                        {DeliveryMethodLabels[order.deliveryMethod]}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {timeAgo}
                    </div>
                </div>
            </div>

            {/* Cliente */}
            {order.customerName && (
                <div className="flex items-center gap-1 mb-2 text-xs text-[#262626] truncate">
                    <User className="w-3 h-3 text-gray-600" />
                    <span className="font-medium">{order.customerName}</span>
                </div>
            )}

            {/* Dirección de entrega (si aplica) */}
            {order.deliveryMethod === 'DELIVERY' && order.deliveryAddress && (
                <div className="flex items-center gap-1 mb-2 text-xs text-[#404040]">
                    <MapPin className="w-3 h-3 text-[#F24452]" />
                    <span className="truncate">{order.deliveryAddress}</span>
                </div>
            )}

            {/* Items como chips, con overflow count */}
            <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-xs text-[#262626]">Items</div>
                    <div className="text-[11px] text-gray-500">{order.items.length}</div>
                </div>
                <div className="flex flex-wrap gap-1">
                    {order.items.slice(0, 3).map((item, index) => (
                        <Badge key={index} variant="secondary" className="text-[10px] px-2 py-0.5">
                            {item.name}{item.quantity > 1 ? ` x${item.quantity}` : ''}
                        </Badge>
                    ))}
                    {order.items.length > 3 && (
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5">+{order.items.length - 3}</Badge>
                    )}
                </div>
            </div>

            {/* Footer: Datos y total */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E5D9D1] items-center">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                        <CreditCard className="w-3 h-3" />
                        {PaymentMethodLabels[order.paymentMethod]}
                    </div>
                    {order.deliveryMethod === 'DELIVERY' && (
                        <div className="flex items-center gap-1 text-[11px] text-gray-600 truncate">
                            <Check className="w-3 h-3 text-green-600" />
                            <span className="truncate">Entrega</span>
                        </div>
                    )}
                </div>
                <div className="text-sm font-bold text-[#F24452] text-right">
                    ${order.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </div>
            </div>

            {/* Nota: estado de pago ya se muestra en el header si aplica */}
        </Card>
    );
}

/**
 * Formatear tiempo relativo (hace X minutos)
 */
function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
}

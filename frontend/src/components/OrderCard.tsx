/**
 * Tarjeta individual de pedido para el tablero Kanban
 */

import {
    Clock,
    CreditCard,
    MapPin,
    Truck,
    Store,
    UtensilsCrossed,
    GripVertical,
    Banknote,
    Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OrderResponse, DeliveryMethod } from '../types/order.types';
import { PaymentMethodLabels, DeliveryMethodLabels } from '../types/order.types';
import { formatCurrency } from '../lib/utils';
import { cn } from '../lib/utils';
import { formatDateAR, parseApiDateTime } from '../lib/datetime';

interface OrderCardProps {
    order: OrderResponse;
    onClick?: () => void;
    onMarkPaid?: (orderId: number) => void;
    isDragging?: boolean;
}

const DELIVERY_CONFIG: Record<DeliveryMethod, { icon: typeof Truck }> = {
    DELIVERY: { icon: Truck },
    PICKUP: { icon: Store },
    DINE_IN: { icon: UtensilsCrossed },
};

function formatTimeAgo(dateString: string): string {
    const date = parseApiDateTime(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    return formatDateAR(dateString, { day: '2-digit', month: 'short' });
}

function isUrgent(createdAt: string, diffMinsThreshold = 25): boolean {
    const diffMins = Math.floor((Date.now() - parseApiDateTime(createdAt).getTime()) / 60000);
    return diffMins >= diffMinsThreshold;
}

export function OrderCard({ order, onClick, onMarkPaid, isDragging }: OrderCardProps) {
    const isPaid = order.paymentStatus === 'PAID';
    const timeAgo = formatTimeAgo(order.createdAt);
    const urgent = order.orderStatus === 'PENDING' && isUrgent(order.createdAt);
    const delivery = DELIVERY_CONFIG[order.deliveryMethod];
    const DeliveryIcon = delivery.icon;

    const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
    const previewItems = order.items.slice(0, 3);
    const hiddenCount = order.items.length - previewItems.length;

    return (
        <article
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick?.();
                }
            }}
            className={cn(
                'group relative overflow-hidden rounded-xl border bg-white text-left shadow-sm',
                'transition-all duration-200 cursor-grab active:cursor-grabbing',
                'hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-300',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F24452]/40',
                isDragging && 'opacity-90 rotate-1 scale-[1.02] shadow-xl ring-2 ring-[#F24452]/30',
                isPaid ? 'border-[#E5D9D1]' : 'border-[#F24452]/40',
                urgent && !isDragging && 'ring-1 ring-[#F24452]/25'
            )}
        >
            <div
                className={cn(
                    'absolute left-0 top-0 bottom-0 w-1',
                    isPaid ? 'bg-[#E5D9D1]' : 'bg-[#F24452]'
                )}
            />

            <div className="pl-3.5 pr-3 py-3 space-y-2.5">
                {/* Fila 1: ID, grip, tiempo */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <GripVertical className="h-4 w-4 text-gray-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="text-lg font-bold text-gray-900 leading-none">
                            #{order.id}
                        </span>
                        {urgent && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[#F2EDE4] text-[#262626] border border-[#E5D9D1]">
                                Demora
                            </span>
                        )}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100 shrink-0">
                        <Clock className="h-3 w-3" />
                        {timeAgo}
                    </span>
                </div>

                {/* Tipo de entrega */}
                <div className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border border-[#E5D9D1] bg-[#F2EDE4]/80 text-[#262626]">
                    <DeliveryIcon className="h-3.5 w-3.5 text-[#F24452]" />
                    {DeliveryMethodLabels[order.deliveryMethod]}
                </div>

                {/* Cliente */}
                {order.customerName ? (
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                            {order.customerName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-800 truncate">
                            {order.customerName}
                        </span>
                    </div>
                ) : (
                    <p className="text-xs text-gray-400 italic">Sin cliente</p>
                )}

                {/* Dirección delivery */}
                {order.deliveryMethod === 'DELIVERY' && order.deliveryAddress && (
                    <div className="flex items-start gap-2 rounded-lg bg-[#F2EDE4]/50 border border-[#E5D9D1] px-2.5 py-2">
                        <MapPin className="h-3.5 w-3.5 text-[#F24452] shrink-0 mt-0.5" />
                        <p className="text-xs text-[#262626] leading-snug line-clamp-2">
                            {order.deliveryAddress}
                        </p>
                    </div>
                )}

                {/* Items */}
                <div className="rounded-lg bg-[#F2EDE4]/60 border border-[#E5D9D1]/80 px-2.5 py-2 space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                            Pedido
                        </span>
                        <span className="text-[10px] font-medium text-gray-500">
                            {totalQty} {totalQty === 1 ? 'unidad' : 'unidades'}
                        </span>
                    </div>
                    <ul className="space-y-0.5">
                        {previewItems.map((item, index) => (
                            <li
                                key={index}
                                className="flex items-baseline gap-1.5 text-xs text-gray-800"
                            >
                                <span className="text-[#F24452] font-bold shrink-0">
                                    {item.quantity}×
                                </span>
                                <span className="truncate">{item.name}</span>
                            </li>
                        ))}
                        {hiddenCount > 0 && (
                            <li className="text-[11px] text-gray-500 pl-4">
                                +{hiddenCount} producto{hiddenCount !== 1 ? 's' : ''} más
                            </li>
                        )}
                    </ul>
                </div>

                {/* Footer: método + total + cobro */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <CreditCard className="h-3.5 w-3.5 text-gray-400" />
                            <span>{PaymentMethodLabels[order.paymentMethod]}</span>
                        </div>
                        <p className="text-base font-bold text-[#F24452] tabular-nums">
                            {formatCurrency(order.total)}
                        </p>
                    </div>

                    {isPaid ? (
                        <div className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#F2EDE4] border border-[#E5D9D1] text-[#262626] text-xs font-semibold">
                            <Check className="h-3.5 w-3.5 text-[#F24452]" />
                            Cobrado
                        </div>
                    ) : onMarkPaid ? (
                        <Button
                            type="button"
                            size="sm"
                            className="w-full h-9 bg-[#F24452] hover:bg-[#F23D3D] text-white font-semibold shadow-sm cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                onMarkPaid(order.id);
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            <Banknote className="h-4 w-4 mr-1.5" />
                            Cobrar {formatCurrency(order.total)}
                        </Button>
                    ) : null}
                </div>
            </div>
        </article>
    );
}

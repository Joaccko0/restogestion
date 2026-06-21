/**
 * Columna de estado para el tablero Kanban
 */

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ClipboardList, ChefHat, CheckCircle2, PackageCheck, Inbox } from 'lucide-react';
import type { OrderResponse, OrderStatus } from '../types/order.types';
import { OrderStatusLabels } from '../types/order.types';
import { OrderCard } from './OrderCard';
import { cn } from '../lib/utils';

interface KanbanColumnProps {
    status: OrderStatus;
    orders: OrderResponse[];
    onOrderClick: (order: OrderResponse) => void;
    onMarkPaid?: (orderId: number) => void;
}

const COLUMN_ICONS: Record<OrderStatus, typeof ClipboardList> = {
    PENDING: ClipboardList,
    PREPARING: ChefHat,
    READY: CheckCircle2,
    DELIVERED: PackageCheck,
    CANCELLED: Inbox,
};

export function KanbanColumn({ status, orders, onOrderClick, onMarkPaid }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id: status });
    const Icon = COLUMN_ICONS[status];
    const orderIds = orders.map((o) => o.id.toString());

    return (
        <div className="flex-1 min-w-[300px] max-w-[360px] flex flex-col">
            <div className="relative mb-3 overflow-hidden rounded-xl border border-[#E5D9D1] bg-white shadow-sm">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F24452]/70" />
                <div className="flex items-center justify-between pl-4 pr-3 py-3">
                    <div className="flex items-center gap-2 text-[#262626]">
                        <Icon className="h-4 w-4 text-gray-500" />
                        <h3 className="font-semibold text-sm">{OrderStatusLabels[status]}</h3>
                    </div>
                    <span className="min-w-[1.75rem] text-center text-xs font-bold px-2 py-0.5 rounded-full bg-[#F2EDE4] text-[#262626] border border-[#E5D9D1]">
                        {orders.length}
                    </span>
                </div>
            </div>

            <div
                ref={setNodeRef}
                className={cn(
                    'flex-1 space-y-3 min-h-[520px] p-2.5 rounded-xl border-2 border-dashed border-[#E5D9D1] bg-[#F2EDE4]/30 transition-colors',
                    isOver && 'border-[#F24452]/40 bg-[#F2EDE4]/60'
                )}
            >
                <SortableContext items={orderIds} strategy={verticalListSortingStrategy}>
                    {orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                            <Inbox className="h-8 w-8 text-gray-300 mb-2" />
                            <p className="text-sm text-gray-500 font-medium">Sin pedidos</p>
                            <p className="text-xs text-gray-400 mt-0.5">Arrastrá acá</p>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <SortableOrderCard
                                key={order.id}
                                order={order}
                                onClick={() => onOrderClick(order)}
                                onMarkPaid={onMarkPaid}
                            />
                        ))
                    )}
                </SortableContext>
            </div>
        </div>
    );
}

function SortableOrderCard({
    order,
    onClick,
    onMarkPaid,
}: {
    order: OrderResponse;
    onClick: () => void;
    onMarkPaid?: (orderId: number) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: order.id.toString() });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <OrderCard order={order} onClick={onClick} onMarkPaid={onMarkPaid} isDragging={isDragging} />
        </div>
    );
}

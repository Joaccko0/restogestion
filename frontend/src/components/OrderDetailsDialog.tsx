/**
 * Dialog para mostrar detalles completos de una orden
 */

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, CreditCard, MapPin, User, Package, X } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import type { OrderResponse, PaymentMethod, DeliveryMethod, PaymentStatus } from '../types/order.types';
import {
    OrderStatusLabels,
    PaymentMethod as PM,
    DeliveryMethod as DM,
    PaymentStatus as PS
} from '../types/order.types';
import { ConfirmDialog } from './ConfirmDialog';

interface OrderDetailsDialogProps {
    order: OrderResponse | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCancel?: (orderId: number) => void;
    onUpdateDetails?: (orderId: number, details: { paymentStatus?: PaymentStatus; paymentMethod?: PaymentMethod; deliveryMethod?: DeliveryMethod }) => void;
}

/**
 * Dialog con información completa del pedido
 */
export function OrderDetailsDialog({
    order,
    open,
    onOpenChange,
    onCancel,
    onUpdateDetails
}: OrderDetailsDialogProps) {
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
    const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | ''>('');
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>('');
    const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

    useEffect(() => {
        if (order && open) {
            setPaymentMethod(order.paymentMethod);
            setDeliveryMethod(order.deliveryMethod);
            setPaymentStatus(order.paymentStatus);
        }
    }, [order, open]);

    if (!order) return null;

    const createdDate = new Date(order.createdAt).toLocaleString('es-AR', {
        dateStyle: 'short',
        timeStyle: 'short'
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-[#F24452]" />
                        Pedido #{order.id}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {/* Información general */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Estado del pedido */}
                        <div className="space-y-1">
                            <div className="text-xs text-gray-500">Estado del Pedido</div>
                            <div className="font-semibold text-sm">
                                {OrderStatusLabels[order.orderStatus]}
                            </div>
                        </div>

                        {/* Estado del pago (editable) */}
                        <div className="space-y-1">
                            <div className="text-xs text-gray-500">Estado del Pago</div>
                            <Select value={paymentStatus} onValueChange={(val) => {
                                setPaymentStatus(val as PaymentStatus);
                                if (onUpdateDetails && order) {
                                    onUpdateDetails(order.id, { paymentStatus: val as PaymentStatus });
                                }
                            }}>
                                <SelectTrigger className="h-9 w-full bg-[#F2EDE4] border-[#E5D9D1] focus:border-[#F24452] focus:ring-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent side="bottom" className="bg-[#F2EDE4] border border-[#E5D9D1]">
                                    <SelectItem value={PS.PENDING}>Pendiente</SelectItem>
                                    <SelectItem value={PS.PAID}>Pagado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Método de pago */}
                        <div className="space-y-1.5">
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                <CreditCard className="w-3 h-3" />
                                Método de Pago
                            </div>
                            <Select value={paymentMethod} onValueChange={(val) => {
                                setPaymentMethod(val as PaymentMethod);
                                if (onUpdateDetails && order) {
                                    onUpdateDetails(order.id, { paymentMethod: val as PaymentMethod });
                                }
                            }}>
                                <SelectTrigger className="h-9 w-full bg-[#F2EDE4] border-[#E5D9D1] focus:border-[#F24452] focus:ring-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent side="bottom" className="bg-[#F2EDE4] border border-[#E5D9D1]">
                                    <SelectItem value={PM.CASH}>Efectivo</SelectItem>
                                    <SelectItem value={PM.CARD}>Tarjeta</SelectItem>
                                    <SelectItem value={PM.TRANSFER}>Transferencia</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Método de entrega */}
                        <div className="space-y-1.5">
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                Método de Entrega
                            </div>
                            <Select value={deliveryMethod} onValueChange={(val) => {
                                setDeliveryMethod(val as DeliveryMethod);
                                if (onUpdateDetails && order) {
                                    onUpdateDetails(order.id, { deliveryMethod: val as DeliveryMethod });
                                }
                            }}>
                                <SelectTrigger className="h-9 w-full bg-[#F2EDE4] border-[#E5D9D1] focus:border-[#F24452] focus:ring-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent side="bottom" className="bg-[#F2EDE4] border border-[#E5D9D1]">
                                    <SelectItem value={DM.PICKUP}>Retiro</SelectItem>
                                    <SelectItem value={DM.DELIVERY}>Delivery</SelectItem>
                                    <SelectItem value={DM.DINE_IN}>Salón</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Cliente */}
                        {order.customerName && (
                            <div className="col-span-2 space-y-1">
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    Cliente
                                </div>
                                <div className="font-medium text-sm">{order.customerName}</div>
                            </div>
                        )}

                        {/* Fecha */}
                        <div className="col-span-2 space-y-1">
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Fecha de Creación
                            </div>
                            <div className="font-medium text-sm">{createdDate}</div>
                        </div>
                    </div>

                    <Separator />

                    {/* Items del pedido */}
                    <div>
                        <h4 className="font-semibold text-sm mb-3">Detalle del Pedido</h4>
                        <div className="space-y-2">
                            {order.items.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between bg-[#F2EDE4] p-3 rounded-lg"
                                >
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">{item.name}</div>
                                        <div className="text-xs text-gray-600">
                                            ${item.unitPrice.toLocaleString('es-AR', {
                                                minimumFractionDigits: 2
                                            })}{' '}
                                            × {item.quantity}
                                        </div>
                                    </div>
                                    <div className="font-semibold text-sm text-[#F24452]">
                                        {formatCurrency(item.subtotal)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Total */}
                    <div className="flex items-center justify-between bg-[#F24452]/10 p-4 rounded-lg">
                        <div className="font-bold text-lg">TOTAL</div>
                        <div className="font-bold text-2xl text-[#F24452]">
                            {formatCurrency(order.total)}
                        </div>
                    </div>
                </div>

                {/* Footer con botón cancelar (solo si no está delivered o cancelled) */}
                {onCancel &&
                    order.orderStatus !== 'DELIVERED' &&
                    order.orderStatus !== 'CANCELLED' && (
                        <div className="border-t border-[#E5D9D1] pt-4 flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cerrar
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => setConfirmCancelOpen(true)}
                                className="bg-[#F23D3D] hover:bg-[#F24452]"
                            >
                                <X className="w-4 h-4 mr-1" />
                                Cancelar Pedido
                            </Button>
                        </div>
                    )}

                <ConfirmDialog
                    open={confirmCancelOpen}
                    onOpenChange={setConfirmCancelOpen}
                    onConfirm={() => {
                        if (onCancel) {
                            onCancel(order.id);
                        }
                        setConfirmCancelOpen(false);
                        onOpenChange(false);
                    }}
                    title="Cancelar pedido"
                    description="¿Estás seguro de cancelar este pedido?"
                    confirmText="Sí, cancelar"
                    cancelText="No, volver"
                    variant="destructive"
                />
            </DialogContent>
        </Dialog>
    );
}

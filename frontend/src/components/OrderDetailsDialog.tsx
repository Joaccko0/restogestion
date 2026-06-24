/**
 * Dialog para editar pedido: ítems, pago dividido, delivery
 */

import { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
    Clock,
    MapPin,
    User,
    Package,
    X,
    Banknote,
    Check,
    Undo2,
    Plus,
    Trash2,
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { formatDateTimeAR } from '../lib/datetime';
import type {
    OrderResponse,
    PaymentMethod,
    DeliveryMethod,
    PaymentStatus,
    OrderPaymentRequest,
} from '../types/order.types';
import {
    PaymentMethod as PM,
    DeliveryMethod as DM,
    PaymentStatus as PS,
    DeliveryMethodLabels,
    PaymentMethodLabels,
} from '../types/order.types';
import type { Customer } from '../types/customer.types';
import type { Product, Combo } from '../types/inventory.types';
import { CustomerAddressSelector } from './CustomerAddressSelector';
import { ConfirmDialog } from './ConfirmDialog';
import {
    OrderItemsEditor,
    orderItemsToCart,
    cartToOrderItems,
    type EditCartItem,
} from './OrderItemsEditor';
import { toast } from 'sonner';

interface PaymentLine {
    method: PaymentMethod;
    amount: string;
}

interface OrderDetailsDialogProps {
    order: OrderResponse | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    businessId: number;
    customers: Customer[];
    products: Product[];
    combos: Combo[];
    onCustomersChanged: () => void;
    onCancel?: (orderId: number) => void;
    onUpdateDetails?: (
        orderId: number,
        details: {
            paymentStatus?: PaymentStatus;
            paymentMethod?: PaymentMethod;
            deliveryMethod?: DeliveryMethod;
            customerId?: number;
            addressId?: number;
            manualAddress?: string;
            deliveryFee?: number;
            items?: ReturnType<typeof cartToOrderItems>;
            payments?: OrderPaymentRequest[];
        }
    ) => Promise<boolean | OrderResponse | null | void>;
}

export function OrderDetailsDialog({
    order,
    open,
    onOpenChange,
    businessId,
    customers,
    products,
    combos,
    onCustomersChanged,
    onCancel,
    onUpdateDetails,
}: OrderDetailsDialogProps) {
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
    const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | ''>('');
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>('');
    const [customerId, setCustomerId] = useState<number | undefined>();
    const [addressId, setAddressId] = useState<number | undefined>();
    const [manualAddress, setManualAddress] = useState('');
    const [showAddressSelector, setShowAddressSelector] = useState(false);
    const [showCustomerPicker, setShowCustomerPicker] = useState(false);
    const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
    const [deliveryFeeInput, setDeliveryFeeInput] = useState('');
    const [cart, setCart] = useState<EditCartItem[]>([]);
    const [initialCartJson, setInitialCartJson] = useState('');
    const [savingItems, setSavingItems] = useState(false);
    const [splitPayment, setSplitPayment] = useState(false);
    const [paymentLines, setPaymentLines] = useState<PaymentLine[]>([]);

    useEffect(() => {
        if (order && open) {
            setPaymentMethod(order.paymentMethod);
            setDeliveryMethod(order.deliveryMethod);
            setPaymentStatus(order.paymentStatus);
            setCustomerId(order.customerId ?? undefined);
            setAddressId(order.addressId ?? undefined);
            setManualAddress(
                order.deliveryMethod === DM.DELIVERY && !order.addressId && order.deliveryAddress
                    ? order.deliveryAddress
                    : ''
            );
            setShowAddressSelector(false);
            setShowCustomerPicker(false);
            setDeliveryFeeInput(
                order.deliveryFee != null && order.deliveryFee > 0
                    ? String(order.deliveryFee)
                    : ''
            );

            const nextCart = orderItemsToCart(order.items);
            setCart(nextCart);
            setInitialCartJson(JSON.stringify(nextCart));

            const hasSplit = (order.payments?.length ?? 0) > 1;
            setSplitPayment(hasSplit);
            if (order.payments && order.payments.length > 0) {
                setPaymentLines(
                    order.payments.map((p) => ({
                        method: p.paymentMethod,
                        amount: String(p.amount),
                    }))
                );
            } else {
                setPaymentLines([
                    {
                        method: order.paymentMethod || PM.CASH,
                        amount: String(order.total),
                    },
                ]);
            }
        }
    }, [order, open]);

    const itemsDirty = useMemo(
        () => JSON.stringify(cart) !== initialCartJson,
        [cart, initialCartJson]
    );

    if (!order) return null;

    const isPaid = paymentStatus === PS.PAID;
    const isDelivery = deliveryMethod === DM.DELIVERY;
    const hasDeliveryDestination = isDelivery && (!!addressId || !!manualAddress.trim());
    const createdDate = formatDateTimeAR(order.createdAt);
    const canAssignCustomer =
        order.orderStatus !== 'DELIVERED' &&
        order.orderStatus !== 'CANCELLED' &&
        !customerId &&
        !order.customerName;

    const paymentLinesSum = paymentLines.reduce(
        (sum, line) => sum + (parseFloat(line.amount) || 0),
        0
    );

    const displayAddress = () => {
        if (!isDelivery) return null;
        if (manualAddress.trim()) return manualAddress;
        if (addressId && customerId) {
            const customer = customers.find((c) => c.id === customerId);
            const addr = customer?.addresses.find((a) => a.id === addressId);
            if (addr) {
                return `${addr.street} ${addr.number}${addr.description ? ` — ${addr.description}` : ''}`;
            }
        }
        return order.deliveryAddress;
    };

    const applyDeliveryUpdate = async (payload: {
        customerId?: number;
        addressId?: number;
        manualAddress?: string;
    }) => {
        const result = await onUpdateDetails?.(order.id, {
            deliveryMethod: DM.DELIVERY,
            customerId: payload.customerId,
            addressId: payload.addressId,
            manualAddress: payload.manualAddress,
        });
        if (result !== false) {
            setCustomerId(payload.customerId);
            setAddressId(payload.addressId);
            setManualAddress(payload.manualAddress || '');
        }
    };

    const handleDeliveryMethodChange = async (val: DeliveryMethod) => {
        if (val === DM.DELIVERY) {
            setDeliveryMethod(DM.DELIVERY);
            if (hasDeliveryDestination || order.deliveryAddress) {
                await onUpdateDetails?.(order.id, { deliveryMethod: DM.DELIVERY });
            } else {
                setShowAddressSelector(true);
            }
            return;
        }

        setDeliveryMethod(val);
        setCustomerId(order.customerId ?? undefined);
        setAddressId(undefined);
        setManualAddress('');
        await onUpdateDetails?.(order.id, { deliveryMethod: val });
    };

    const handleSaveItems = async () => {
        if (order.orderStatus === 'DELIVERED') {
            toast.error('No se pueden modificar ítems de un pedido entregado');
            return;
        }
        if (cart.length === 0) {
            toast.error('El pedido debe tener al menos un ítem');
            return;
        }
        setSavingItems(true);
        const result = await onUpdateDetails?.(order.id, { items: cartToOrderItems(cart) });
        setSavingItems(false);
        if (result !== false) {
            const nextCart = orderItemsToCart(
                (typeof result === 'object' && result?.items) || cart.map((c) => ({
                    productId: c.type === 'product' ? c.id : null,
                    comboId: c.type === 'combo' ? c.id : null,
                    name: c.name,
                    unitPrice: c.price,
                    quantity: c.quantity,
                }))
            );
            setCart(nextCart);
            setInitialCartJson(JSON.stringify(nextCart));
            if (typeof result === 'object' && result) {
                setPaymentLines([{ method: paymentMethod || PM.CASH, amount: String(result.total) }]);
            }
            toast.success('Ítems actualizados');
        }
    };

    const buildPaymentsPayload = (): OrderPaymentRequest[] | null => {
        if (!splitPayment) {
            const method = (paymentMethod || PM.CASH) as PaymentMethod;
            return [{ paymentMethod: method, amount: order.total }];
        }
        const lines = paymentLines
            .map((line) => ({
                paymentMethod: line.method,
                amount: parseFloat(line.amount) || 0,
            }))
            .filter((l) => l.amount > 0);
        if (lines.length === 0) return null;
        return lines;
    };

    const handleMarkPaid = async () => {
        if (itemsDirty) {
            toast.error('Guardá los ítems antes de cobrar');
            return;
        }
        const payments = buildPaymentsPayload();
        if (!payments) {
            toast.error('Configurá al menos un pago');
            return;
        }
        const sum = payments.reduce((s, p) => s + p.amount, 0);
        if (Math.abs(sum - order.total) > 0.01) {
            toast.error(
                `La suma (${formatCurrency(sum)}) debe coincidir con el total (${formatCurrency(order.total)})`
            );
            return;
        }
        const result = await onUpdateDetails?.(order.id, {
            paymentStatus: PS.PAID,
            payments,
            paymentMethod: splitPayment ? undefined : payments[0].paymentMethod,
        });
        if (result !== false) {
            setPaymentStatus(PS.PAID);
        }
    };

    const handleMarkUnpaid = async () => {
        const result = await onUpdateDetails?.(order.id, { paymentStatus: PS.PENDING });
        if (result !== false) {
            setPaymentStatus(PS.PENDING);
        }
    };

    const addPaymentLine = () => {
        setPaymentLines((lines) => [
            ...lines,
            { method: PM.CASH, amount: '' },
        ]);
    };

    const deliveryAddressText = displayAddress();

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="bg-white max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
                    <DialogHeader className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-gray-100">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Package className="w-5 h-5 text-[#F24452]" />
                            Pedido #{order.id}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-5">
                        <div className="rounded-xl border border-[#E5D9D1] bg-[#F2EDE4]/40 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Total a cobrar
                                    </p>
                                    <p className="text-2xl font-bold text-[#F24452] tabular-nums">
                                        {formatCurrency(order.total)}
                                    </p>
                                    {(order.deliveryFee ?? 0) > 0 && isDelivery && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Incluye envío {formatCurrency(order.deliveryFee!)}
                                        </p>
                                    )}
                                </div>
                                {isPaid && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#262626] text-sm font-semibold border border-[#E5D9D1]">
                                        <Check className="h-4 w-4 text-[#F24452]" />
                                        Cobrado
                                    </span>
                                )}
                            </div>

                            {!isPaid && (
                                <div className="space-y-3 pt-1 border-t border-[#E5D9D1]/60">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs text-gray-600">Pago dividido</Label>
                                        <Button
                                            type="button"
                                            variant={splitPayment ? 'default' : 'outline'}
                                            size="sm"
                                            className={
                                                splitPayment
                                                    ? 'h-7 bg-[#F24452] hover:bg-[#F23D3D] text-white'
                                                    : 'h-7 border-[#E5D9D1]'
                                            }
                                            onClick={() => setSplitPayment((v) => !v)}
                                        >
                                            {splitPayment ? 'Activado' : 'Desactivado'}
                                        </Button>
                                    </div>

                                    {!splitPayment ? (
                                        <Select
                                            value={paymentMethod}
                                            onValueChange={(val) => {
                                                setPaymentMethod(val as PaymentMethod);
                                                onUpdateDetails?.(order.id, {
                                                    paymentMethod: val as PaymentMethod,
                                                });
                                            }}
                                        >
                                            <SelectTrigger className="h-9 bg-white border-[#E5D9D1]">
                                                <SelectValue placeholder="Método de pago" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white">
                                                <SelectItem value={PM.CASH}>
                                                    {PaymentMethodLabels[PM.CASH]}
                                                </SelectItem>
                                                <SelectItem value={PM.CARD}>
                                                    {PaymentMethodLabels[PM.CARD]}
                                                </SelectItem>
                                                <SelectItem value={PM.TRANSFER}>
                                                    {PaymentMethodLabels[PM.TRANSFER]}
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="space-y-2">
                                            {paymentLines.map((line, idx) => (
                                                <div key={idx} className="flex gap-2 items-center">
                                                    <Select
                                                        value={line.method}
                                                        onValueChange={(val) => {
                                                            setPaymentLines((lines) =>
                                                                lines.map((l, i) =>
                                                                    i === idx
                                                                        ? {
                                                                              ...l,
                                                                              method: val as PaymentMethod,
                                                                          }
                                                                        : l
                                                                )
                                                            );
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-9 flex-1 bg-white border-[#E5D9D1]">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white">
                                                            <SelectItem value={PM.CASH}>Efectivo</SelectItem>
                                                            <SelectItem value={PM.CARD}>Tarjeta</SelectItem>
                                                            <SelectItem value={PM.TRANSFER}>
                                                                Transferencia
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        placeholder="Monto"
                                                        value={line.amount}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setPaymentLines((lines) =>
                                                                lines.map((l, i) =>
                                                                    i === idx ? { ...l, amount: val } : l
                                                                )
                                                            );
                                                        }}
                                                        className="h-9 w-28 bg-white border-[#E5D9D1] text-right"
                                                    />
                                                    {paymentLines.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 shrink-0"
                                                            onClick={() =>
                                                                setPaymentLines((lines) =>
                                                                    lines.filter((_, i) => i !== idx)
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-4 w-4 text-gray-400" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 border-[#E5D9D1] w-full"
                                                onClick={addPaymentLine}
                                            >
                                                <Plus className="h-3.5 w-3.5 mr-1" />
                                                Agregar medio de pago
                                            </Button>
                                            {paymentLinesSum > 0 && (
                                                <p
                                                    className={`text-xs text-right tabular-nums ${
                                                        Math.abs(paymentLinesSum - order.total) < 0.01
                                                            ? 'text-emerald-600'
                                                            : 'text-[#F24452]'
                                                    }`}
                                                >
                                                    Suma: {formatCurrency(paymentLinesSum)} /{' '}
                                                    {formatCurrency(order.total)}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <Button
                                        type="button"
                                        size="lg"
                                        className="w-full h-12 bg-[#F24452] hover:bg-[#F23D3D] text-white text-base font-bold"
                                        onClick={() => void handleMarkPaid()}
                                    >
                                        <Banknote className="h-5 w-5 mr-2" />
                                        Cobrar {formatCurrency(order.total)}
                                    </Button>
                                </div>
                            )}

                            {isPaid && (
                                <div className="space-y-2">
                                    {order.payments && order.payments.length > 0 ? (
                                        <ul className="text-sm space-y-1">
                                            {order.payments.map((p, i) => (
                                                <li
                                                    key={i}
                                                    className="flex justify-between text-gray-600"
                                                >
                                                    <span>{PaymentMethodLabels[p.paymentMethod]}</span>
                                                    <span className="tabular-nums font-medium">
                                                        {formatCurrency(p.amount)}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        paymentMethod && (
                                            <p className="text-sm text-gray-600">
                                                {PaymentMethodLabels[paymentMethod]}
                                            </p>
                                        )
                                    )}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full border-[#E5D9D1]"
                                        onClick={() => void handleMarkUnpaid()}
                                    >
                                        <Undo2 className="h-4 w-4 mr-1.5" />
                                        Marcar como pendiente
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    Entrega
                                </div>
                                <Select
                                    value={deliveryMethod}
                                    onValueChange={(val) =>
                                        void handleDeliveryMethodChange(val as DeliveryMethod)
                                    }
                                >
                                            <SelectTrigger className="h-10 w-full bg-white border-gray-300">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        <SelectItem value={DM.PICKUP}>
                                            {DeliveryMethodLabels[DM.PICKUP]}
                                        </SelectItem>
                                        <SelectItem value={DM.DELIVERY}>
                                            {DeliveryMethodLabels[DM.DELIVERY]}
                                        </SelectItem>
                                        <SelectItem value={DM.DINE_IN}>
                                            {DeliveryMethodLabels[DM.DINE_IN]}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Creado
                                </div>
                                <div className="font-medium text-sm pt-2 break-words">{createdDate}</div>
                            </div>

                            {isDelivery && (
                                <>
                                    <div className="col-span-2 rounded-xl border border-[#E5D9D1] bg-[#F2EDE4]/30 p-3 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Costo de envío
                                            </span>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={deliveryFeeInput}
                                                onChange={(e) => setDeliveryFeeInput(e.target.value)}
                                                onBlur={() => {
                                                    const fee = parseFloat(deliveryFeeInput) || 0;
                                                    void onUpdateDetails?.(order.id, { deliveryFee: fee });
                                                }}
                                                className="h-10 w-32 text-right bg-white border-[#E5D9D1]"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-2 rounded-xl border border-[#E5D9D1] bg-[#F2EDE4]/30 p-3 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Destino
                                            </span>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="h-8 border-[#E5D9D1] text-[#F24452]"
                                                onClick={() => setShowAddressSelector(true)}
                                            >
                                                <MapPin className="h-3.5 w-3.5 mr-1" />
                                                {hasDeliveryDestination ? 'Cambiar' : 'Elegir'}
                                            </Button>
                                        </div>
                                        {hasDeliveryDestination && deliveryAddressText ? (
                                            <p className="text-sm text-[#262626]">{deliveryAddressText}</p>
                                        ) : (
                                            <p className="text-sm text-gray-500">Sin destino</p>
                                        )}
                                    </div>
                                </>
                            )}

                            {canAssignCustomer ? (
                                <div className="col-span-2 rounded-xl border border-dashed border-[#E5D9D1] bg-[#F2EDE4]/30 p-3 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            Cliente
                                        </span>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="h-8 border-[#E5D9D1] text-[#F24452]"
                                            onClick={() => setShowCustomerPicker(true)}
                                        >
                                            <User className="h-3.5 w-3.5 mr-1" />
                                            Asignar cliente
                                        </Button>
                                    </div>
                                    <p className="text-sm text-gray-500">Sin cliente asignado</p>
                                </div>
                            ) : (customerId || order.customerName) ? (
                                <div className="col-span-2 space-y-1">
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        Cliente
                                    </div>
                                    <div className="font-medium text-sm">
                                        {customers.find((c) => c.id === customerId)?.name ||
                                            order.customerName}
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <Separator />

                        <OrderItemsEditor
                            cart={cart}
                            onCartChange={setCart}
                            products={products}
                            combos={combos}
                            onSave={() => void handleSaveItems()}
                            saving={savingItems}
                            dirty={itemsDirty}
                            readOnly={order.orderStatus === 'DELIVERED'}
                        />
                    </div>

                    {onCancel &&
                        order.orderStatus !== 'DELIVERED' &&
                        order.orderStatus !== 'CANCELLED' && (
                            <div className="border-t border-gray-100 px-4 sm:px-6 py-4 flex flex-col-reverse sm:flex-row justify-between gap-2 bg-gray-50/50">
                                <Button variant="outline" onClick={() => onOpenChange(false)} className="touch-target">
                                    Cerrar
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => setConfirmCancelOpen(true)}
                                    className="bg-[#F23D3D] hover:bg-[#F24452] touch-target"
                                >
                                    <X className="w-4 h-4 mr-1" />
                                    Cancelar pedido
                                </Button>
                            </div>
                        )}

                    <ConfirmDialog
                        open={confirmCancelOpen}
                        onOpenChange={setConfirmCancelOpen}
                        onConfirm={() => {
                            onCancel?.(order.id);
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

            <CustomerAddressSelector
                open={showAddressSelector}
                onOpenChange={setShowAddressSelector}
                customers={customers}
                businessId={businessId}
                isDelivery
                initialCustomerId={customerId}
                initialAddressId={addressId}
                initialManualAddress={manualAddress}
                onConfirm={(data) => {
                    void applyDeliveryUpdate({
                        customerId: data.customerId,
                        addressId: data.addressId,
                        manualAddress: data.manualAddress,
                    });
                }}
                onCustomersChanged={onCustomersChanged}
            />

            <CustomerAddressSelector
                open={showCustomerPicker}
                onOpenChange={setShowCustomerPicker}
                customers={customers}
                businessId={businessId}
                isDelivery={false}
                initialCustomerId={customerId}
                onConfirm={(data) => {
                    if (!data.customerId) return;
                    void (async () => {
                        const result = await onUpdateDetails?.(order.id, {
                            customerId: data.customerId,
                        });
                        if (result !== false) {
                            setCustomerId(data.customerId);
                            toast.success('Cliente asignado');
                        }
                    })();
                }}
                onCustomersChanged={onCustomersChanged}
            />
        </>
    );
}

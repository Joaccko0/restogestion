/**
 * Dialog para crear un nuevo pedido
 * Permite seleccionar productos/combos, asociar cliente y dirección, método de pago y entrega
 */

import { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Minus, Trash2, User, MapPin, AlertCircle } from 'lucide-react';
import type { Product, Combo } from '../types/inventory.types';
import type { CreateOrderRequest, OrderItemRequest, PaymentMethod, DeliveryMethod } from '../types/order.types';
import type { Customer } from '../types/customer.types';
import { PaymentMethod as PM, DeliveryMethod as DM } from '../types/order.types';
// import { CustomerService } from '../services/customer.service';
import { CustomerAddressSelector } from './CustomerAddressSelector';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';

interface CreateOrderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: CreateOrderRequest) => Promise<boolean>;
    products: Product[];
    combos: Combo[];
    customers: Customer[];
    businessId: number;
    onCustomersChanged: () => void;
    deliveryFee?: number;
}

interface CartItem {
    type: 'product' | 'combo';
    id: number;
    name: string;
    price: number;
    quantity: number;
}

/**
 * Dialog para crear nuevo pedido
 */
export function CreateOrderDialog({
    open,
    onOpenChange,
    onSubmit,
    products,
    combos,
    customers,
    businessId,
    onCustomersChanged,
    deliveryFee = 0,
}: CreateOrderDialogProps) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PM.CASH);
    const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(DM.PICKUP);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>(undefined);
    const [selectedAddressId, setSelectedAddressId] = useState<number | undefined>(undefined);
    const [manualAddress, setManualAddress] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCustomerAddressDialog, setShowCustomerAddressDialog] = useState(false);
    const [deliveryFeeInput, setDeliveryFeeInput] = useState('');

    const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
    const selectedAddress = useMemo(() => {
        if (!selectedCustomerId) return null;
        const customer = customers.find(c => c.id === selectedCustomerId);
        return customer?.addresses.find(a => a.id === selectedAddressId);
    }, [selectedCustomerId, selectedAddressId, customers]);

    // Resetear al abrir
    useEffect(() => {
        if (open) {
            setCart([]);
            setPaymentMethod(PM.CASH);
            setDeliveryMethod(DM.PICKUP);
            setSelectedCustomerId(undefined);
            setSelectedAddressId(undefined);
            setManualAddress('');
            setShowCustomerAddressDialog(false);
            setDeliveryFeeInput(deliveryFee > 0 ? String(deliveryFee) : '');
        }
    }, [open, deliveryFee]);

    // Resetear dirección al cambiar método; abrir selector si es delivery
    useEffect(() => {
        setSelectedAddressId(undefined);
        setManualAddress('');
        if (deliveryMethod === DM.DELIVERY) {
            setShowCustomerAddressDialog(true);
            setDeliveryFeeInput(deliveryFee > 0 ? String(deliveryFee) : '');
        }
    }, [deliveryMethod, deliveryFee]);

    const addToCart = (type: 'product' | 'combo', id: number, name: string, price: number) => {
        const existing = cart.find(item => item.type === type && item.id === id);
        
        if (existing) {
            setCart(cart.map(item =>
                item.type === type && item.id === id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart([...cart, { type, id, name, price, quantity: 1 }]);
        }
    };

    const updateQuantity = (type: string, id: number, delta: number) => {
        setCart(cart.map(item => {
            if (item.type === type && item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (type: string, id: number) => {
        setCart(cart.filter(item => !(item.type === type && item.id === id)));
    };

    const parsedDeliveryFee =
        deliveryMethod === DM.DELIVERY ? parseFloat(deliveryFeeInput) || 0 : 0;
    const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = cartSubtotal + parsedDeliveryFee;

    const handleSubmit = async () => {
        if (cart.length === 0) {
            toast.error('Agrega al menos un producto al carrito');
            return;
        }

        // Validar dirección si es delivery
        if (deliveryMethod === DM.DELIVERY && !selectedAddressId && !manualAddress) {
            toast.error('Selecciona una dirección o ingresa una dirección manual');
            return;
        }

        const items: OrderItemRequest[] = cart.map(item => {
            const orderItem: any = {
                quantity: item.quantity
            };
            
            if (item.type === 'product') {
                orderItem.productId = item.id;
            } else {
                orderItem.comboId = item.id;
            }
            
            return orderItem;
        });

        const request: CreateOrderRequest = {
            deliveryMethod,
            paymentMethod,
            items,
            customerId: selectedCustomerId,
            addressId: deliveryMethod === DM.DELIVERY ? selectedAddressId : undefined,
            manualAddress: deliveryMethod === DM.DELIVERY && manualAddress ? manualAddress : undefined,
            deliveryFee: deliveryMethod === DM.DELIVERY ? parsedDeliveryFee : undefined,
        };

        console.log('Enviando request:', JSON.stringify(request, null, 2));

        setIsSubmitting(true);
        const success = await onSubmit(request);
        setIsSubmitting(false);

        if (success) {
            setCart([]);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white max-w-6xl w-full flex flex-col p-0 gap-0">
                <DialogHeader className="px-4 sm:px-6 py-4 border-b border-[#E5D9D1]">
                    <DialogTitle>Nuevo Pedido</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 flex-1 overflow-y-auto lg:overflow-hidden px-4 sm:px-6 py-4 sm:py-5">
                    {/* Columna izquierda: Productos y combos */}
                    <ScrollArea className="max-h-[45vh] lg:max-h-[620px] lg:pr-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Productos */}
                            <div>
                                <h4 className="font-semibold text-sm mb-2">Productos</h4>
                                <div className="space-y-2">
                                    {products.filter(p => p.active).map(product => (
                                        <div
                                            key={product.id}
                                            className="flex items-center justify-between p-2 bg-[#F2EDE4] rounded hover:bg-[#E5D9D1] transition-colors"
                                        >
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{product.title}</div>
                                                <div className="text-xs text-gray-600">
                                                    {formatCurrency(product.price)}
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => addToCart('product', product.id, product.title, product.price)}
                                                className="bg-[#F24452] hover:bg-[#F23D3D] h-9 w-9"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Combos */}
                            {combos.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-sm mb-2">Combos</h4>
                                    <div className="space-y-2">
                                        {combos.filter(c => c.active).map(combo => (
                                            <div
                                                key={combo.id}
                                                className="flex items-center justify-between p-2 bg-[#F2EDE4] rounded hover:bg-[#E5D9D1] transition-colors"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm">{combo.name}</div>
                                                    <div className="text-xs text-gray-600">
                                                        {formatCurrency(combo.price)}
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    onClick={() => addToCart('combo', combo.id, combo.name, combo.price)}
                                                    className="bg-[#F24452] hover:bg-[#F23D3D] h-9 w-9"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Columna derecha: Carrito y opciones */}
                    <div className="flex flex-col gap-4 pb-2">
                        {/* Carrito */}
                        <div className="flex-1 border-2 border-[#E5D9D1] rounded-lg p-3 overflow-y-auto min-h-[180px]">
                            <h4 className="font-semibold text-sm mb-2">Carrito ({cart.length})</h4>
                            {cart.length === 0 ? (
                                <div className="text-center text-sm text-gray-400 py-8">
                                    Agregá productos al carrito
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {cart.map((item, index) => (
                                        <div key={index} className="flex items-center gap-2 bg-[#F2EDE4] p-2 rounded">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-xs truncate">{item.name}</div>
                                                <div className="text-xs text-gray-600">
                                                    {formatCurrency(item.price)}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-8 w-8"
                                                    onClick={() => updateQuantity(item.type, item.id, -1)}
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </Button>
                                                <span className="text-xs font-medium w-6 text-center">
                                                    {item.quantity}
                                                </span>
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-8 w-8"
                                                    onClick={() => updateQuantity(item.type, item.id, 1)}
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-red-500"
                                                    onClick={() => removeFromCart(item.type, item.id)}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Opciones */}
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="grid gap-1.5">
                                    <Label className="text-sm">Método de Pago</Label>
                                    <Select value={paymentMethod} onValueChange={(val) => setPaymentMethod(val as PaymentMethod)}>
                                        <SelectTrigger className="h-11 bg-[#F2EDE4] border-[#E5D9D1] focus:border-[#F24452] focus:ring-0 overflow-hidden text-ellipsis whitespace-nowrap">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#F2EDE4] border border-[#E5D9D1] shadow-lg max-h-[260px]">
                                            <SelectItem value={PM.CASH}>Efectivo</SelectItem>
                                            <SelectItem value={PM.CARD}>Tarjeta</SelectItem>
                                            <SelectItem value={PM.TRANSFER}>Transferencia</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-1.5">
                                    <Label className="text-sm">Método de Entrega</Label>
                                    <Select value={deliveryMethod} onValueChange={(val) => setDeliveryMethod(val as DeliveryMethod)}>
                                        <SelectTrigger className="h-11 bg-[#F2EDE4] border-[#E5D9D1] focus:border-[#F24452] focus:ring-0 overflow-hidden text-ellipsis whitespace-nowrap">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#F2EDE4] border border-[#E5D9D1] shadow-lg max-h-[260px]">
                                            <SelectItem value={DM.PICKUP}>Retiro</SelectItem>
                                            <SelectItem value={DM.DELIVERY}>Delivery</SelectItem>
                                            <SelectItem value={DM.DINE_IN}>Salón</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Cliente / destino de entrega */}
                            <div
                                className={`border-2 rounded-lg p-3 space-y-2 ${
                                    deliveryMethod === DM.DELIVERY &&
                                    !selectedAddressId &&
                                    !manualAddress
                                        ? 'border-[#F24452]/30 bg-[#F2EDE4]/50'
                                        : 'border-[#E5D9D1] bg-[#F2EDE4]/30'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                                        {deliveryMethod === DM.DELIVERY ? (
                                            <>
                                                <MapPin className="h-4 w-4 text-[#F24452]" />
                                                Destino de entrega
                                            </>
                                        ) : (
                                            <>
                                                <User className="h-4 w-4 text-gray-600" />
                                                Cliente
                                            </>
                                        )}
                                    </Label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => setShowCustomerAddressDialog(true)}
                                        className="bg-[#F24452] hover:bg-[#d93a48] cursor-pointer h-10 shrink-0"
                                    >
                                        {deliveryMethod === DM.DELIVERY ? (
                                            <>
                                                <MapPin className="w-4 h-4 mr-1" />
                                                {selectedAddressId || manualAddress
                                                    ? 'Cambiar'
                                                    : 'Elegir destino'}
                                            </>
                                        ) : (
                                            <>
                                                <User className="w-4 h-4 mr-1" />
                                                {selectedCustomerId ? 'Cambiar' : 'Elegir'}
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {deliveryMethod === DM.DELIVERY ? (
                                    selectedAddressId && selectedCustomer ? (
                                        <div className="bg-white rounded-lg border border-[#F24452]/20 p-3 space-y-2">
                                            <div className="flex items-start gap-2">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F24452] text-white text-xs font-bold">
                                                    {selectedCustomer.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm text-gray-900">
                                                        {selectedCustomer.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {selectedCustomer.phone}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2 pt-2 border-t border-gray-100">
                                                <MapPin className="h-4 w-4 text-[#F24452] shrink-0 mt-0.5" />
                                                <p className="text-sm text-gray-800 leading-snug">
                                                    {selectedAddress!.street} {selectedAddress!.number}
                                                    {selectedAddress!.description &&
                                                        ` — ${selectedAddress!.description}`}
                                                </p>
                                            </div>
                                        </div>
                                    ) : manualAddress ? (
                                        <div className="bg-white rounded-lg border border-[#F24452]/20 p-3">
                                            <p className="text-xs text-gray-500 mb-1">
                                                Dirección manual (sin cliente)
                                            </p>
                                            <p className="text-sm text-gray-800 flex items-start gap-2">
                                                <MapPin className="h-4 w-4 text-[#F24452] shrink-0 mt-0.5" />
                                                {manualAddress}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-2 text-sm text-gray-600 p-1">
                                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#F24452]" />
                                            <span>
                                                Elegí cliente y dirección en un solo paso con{' '}
                                                <strong>Elegir destino</strong>
                                            </span>
                                        </div>
                                    )
                                ) : selectedCustomerId && selectedCustomer ? (
                                    <div className="bg-white p-2 rounded border">
                                        <div className="text-sm font-medium">{selectedCustomer.name}</div>
                                        <div className="text-xs text-gray-500">{selectedCustomer.phone}</div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-500 italic p-1">
                                        Sin cliente (opcional)
                                    </div>
                                )}
                            </div>

                            {/* Total */}
                            <div className="space-y-1.5">
                                {deliveryMethod === DM.DELIVERY && (
                                    <div className="flex items-center justify-between text-sm text-gray-600 px-1 gap-2">
                                        <span className="flex items-center gap-1 shrink-0">
                                            <MapPin className="h-3.5 w-3.5 text-[#F24452]" />
                                            Costo envío
                                        </span>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={deliveryFeeInput}
                                            onChange={(e) => setDeliveryFeeInput(e.target.value)}
                                            className="h-10 w-32 text-right bg-[#F2EDE4] border-[#E5D9D1] ml-auto"
                                        />
                                    </div>
                                )}
                                <div className="flex items-center justify-between text-sm text-gray-600 px-1">
                                    <span>Subtotal</span>
                                    <span className="tabular-nums">{formatCurrency(cartSubtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between bg-[#F24452]/10 p-3 rounded-lg">
                                    <span className="font-bold">TOTAL</span>
                                    <span className="font-bold text-lg text-[#F24452] tabular-nums">
                                        {formatCurrency(total)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-4 sm:px-6 py-4 border-t border-[#E5D9D1] bg-gray-50/70">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="cursor-pointer touch-target">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={cart.length === 0 || isSubmitting}
                        className="bg-[#F24452] hover:bg-[#F23D3D] cursor-pointer touch-target"
                    >
                        {isSubmitting ? 'Creando...' : 'Crear Pedido'}
                    </Button>
                </DialogFooter>

                            {/* Dialog para seleccionar cliente y dirección */}
                            <CustomerAddressSelector
                                open={showCustomerAddressDialog}
                                onOpenChange={setShowCustomerAddressDialog}
                                customers={customers}
                                businessId={businessId}
                                isDelivery={deliveryMethod === DM.DELIVERY}
                                initialCustomerId={selectedCustomerId}
                                initialAddressId={selectedAddressId}
                                initialManualAddress={manualAddress}
                                onConfirm={(data) => {
                                    setSelectedCustomerId(data.customerId);
                                    setSelectedAddressId(data.addressId);
                                    setManualAddress(data.manualAddress || '');
                                }}
                                onCustomersChanged={onCustomersChanged}
                            />
            </DialogContent>
        </Dialog>
    );
}

/**
 * Editor de ítems del pedido (agregar / quitar / cantidades)
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import type { Product, Combo } from '../types/inventory.types';
import type { OrderItemRequest } from '../types/order.types';

export interface EditCartItem {
    type: 'product' | 'combo';
    id: number;
    name: string;
    price: number;
    quantity: number;
}

interface OrderItemsEditorProps {
    cart: EditCartItem[];
    onCartChange: (cart: EditCartItem[]) => void;
    products: Product[];
    combos: Combo[];
    onSave: () => void;
    saving?: boolean;
    dirty?: boolean;
    readOnly?: boolean;
}

export function orderItemsToCart(
    items: { productId: number | null; comboId: number | null; name: string; unitPrice: number; quantity: number }[]
): EditCartItem[] {
    return items.map((item) => ({
        type: item.productId != null ? 'product' : 'combo',
        id: (item.productId ?? item.comboId)!,
        name: item.name,
        price: item.unitPrice,
        quantity: item.quantity,
    }));
}

export function cartToOrderItems(cart: EditCartItem[]): OrderItemRequest[] {
    return cart.map((item) => ({
        quantity: item.quantity,
        ...(item.type === 'product' ? { productId: item.id } : { comboId: item.id }),
    }));
}

export function OrderItemsEditor({
    cart,
    onCartChange,
    products,
    combos,
    onSave,
    saving = false,
    dirty = false,
    readOnly = false,
}: OrderItemsEditorProps) {
    const [catalogOpen, setCatalogOpen] = useState(false);

    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

    if (readOnly) {
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Detalle del pedido</h4>
                    <span className="text-xs text-gray-500">Pedido entregado — sin cambios</span>
                </div>
                <div className="space-y-2">
                    {cart.map((item) => (
                        <div
                            key={`${item.type}-${item.id}`}
                            className="flex items-center justify-between bg-[#F2EDE4]/50 p-3 rounded-lg border border-[#E5D9D1]/60"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">
                                    {item.quantity}× {item.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {formatCurrency(item.price)} c/u
                                </div>
                            </div>
                            <div className="font-semibold text-sm text-[#262626] tabular-nums">
                                {formatCurrency(item.price * item.quantity)}
                            </div>
                        </div>
                    ))}
                </div>
                {cart.length > 0 && (
                    <div className="flex justify-between text-sm px-1">
                        <span className="text-gray-500">Subtotal ítems</span>
                        <span className="font-semibold tabular-nums">{formatCurrency(subtotal)}</span>
                    </div>
                )}
            </div>
        );
    }

    const addToCart = (type: 'product' | 'combo', id: number, name: string, price: number) => {
        const existing = cart.find((i) => i.type === type && i.id === id);
        if (existing) {
            onCartChange(
                cart.map((i) =>
                    i.type === type && i.id === id ? { ...i, quantity: i.quantity + 1 } : i
                )
            );
        } else {
            onCartChange([...cart, { type, id, name, price, quantity: 1 }]);
        }
    };

    const updateQty = (type: string, id: number, delta: number) => {
        onCartChange(
            cart
                .map((i) => {
                    if (i.type === type && i.id === id) {
                        return { ...i, quantity: i.quantity + delta };
                    }
                    return i;
                })
                .filter((i) => i.quantity > 0)
        );
    };

    const removeItem = (type: string, id: number) => {
        onCartChange(cart.filter((i) => !(i.type === type && i.id === id)));
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Detalle del pedido</h4>
                {dirty && (
                    <Button
                        type="button"
                        size="sm"
                        className="h-10 bg-[#F24452] hover:bg-[#F23D3D] text-white"
                        onClick={onSave}
                        disabled={saving || cart.length === 0}
                    >
                        {saving ? 'Guardando...' : 'Guardar ítems'}
                    </Button>
                )}
            </div>

            <div className="space-y-2">
                {cart.map((item) => (
                    <div
                        key={`${item.type}-${item.id}`}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 bg-[#F2EDE4]/70 p-3 rounded-lg border border-[#E5D9D1]/60"
                    >
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{item.name}</div>
                            <div className="text-xs text-gray-500">
                                {formatCurrency(item.price)} c/u
                            </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 border-[#E5D9D1]"
                                onClick={() => updateQty(item.type, item.id, -1)}
                            >
                                <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-sm font-semibold tabular-nums">
                                {item.quantity}
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 border-[#E5D9D1]"
                                onClick={() => updateQty(item.type, item.id, 1)}
                            >
                                <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-[#F24452]"
                                onClick={() => removeItem(item.type, item.id)}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                        <div className="font-semibold text-sm text-[#F24452] tabular-nums w-full sm:w-20 text-right shrink-0">
                            {formatCurrency(item.price * item.quantity)}
                        </div>
                    </div>
                ))}
                {cart.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                        Agregá al menos un producto al pedido
                    </p>
                )}
            </div>

            <div className="rounded-xl border border-[#E5D9D1] overflow-hidden">
                <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-white hover:bg-[#FFF9F5] text-sm font-medium text-[#262626]"
                    onClick={() => setCatalogOpen((v) => !v)}
                >
                    <span className="flex items-center gap-1.5">
                        <Plus className="h-4 w-4 text-[#F24452]" />
                        Agregar productos
                    </span>
                    {catalogOpen ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                </button>
                {catalogOpen && (
                    <div className="border-t border-[#E5D9D1] p-3 max-h-48 overflow-y-auto space-y-3 bg-[#F2EDE4]/30">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1.5">Productos</p>
                            <div className="flex flex-wrap gap-1.5">
                                {products
                                    .filter((p) => p.active)
                                    .map((p) => (
                                        <Button
                                            key={p.id}
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-xs border-[#E5D9D1] bg-white hover:bg-[#F24452]/10"
                                            onClick={() =>
                                                addToCart('product', p.id, p.title, p.price)
                                            }
                                        >
                                            {p.title}
                                        </Button>
                                    ))}
                            </div>
                        </div>
                        {combos.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-gray-500 mb-1.5">Combos</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {combos
                                        .filter((c) => c.active)
                                        .map((c) => (
                                            <Button
                                                key={c.id}
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-7 text-xs border-[#E5D9D1] bg-white hover:bg-[#F24452]/10"
                                                onClick={() =>
                                                    addToCart('combo', c.id, c.name, c.price)
                                                }
                                            >
                                                {c.name}
                                            </Button>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {cart.length > 0 && (
                <div className="flex justify-between text-sm px-1">
                    <span className="text-gray-500">Subtotal ítems</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(subtotal)}</span>
                </div>
            )}
        </div>
    );
}

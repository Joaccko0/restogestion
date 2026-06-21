/**
 * Dialog separado para cargar resumen manual al cerrar caja (opcional).
 */

import { useEffect, useRef, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClipboardList, CreditCard, Banknote, ArrowLeftRight } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import type { ManualCashSummary } from '../types/cashshift.types';
import { hasManualSummary } from '../types/cashshift.types';
import { PaymentMethod, PaymentMethodLabels } from '../types/order.types';
import type { MenuCategory } from '../services/menuCategory.service';

interface CloseCashManualSummaryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    menuCategories: MenuCategory[];
    systemTotalCollected: number;
    systemPaymentBreakdown: Record<PaymentMethod, number>;
    value: ManualCashSummary | null;
    onSave: (summary: ManualCashSummary | null) => void;
}

const PAYMENT_METHODS: PaymentMethod[] = [
    PaymentMethod.CASH,
    PaymentMethod.CARD,
    PaymentMethod.TRANSFER,
];

const paymentIcons: Record<PaymentMethod, typeof Banknote> = {
    [PaymentMethod.CASH]: Banknote,
    [PaymentMethod.CARD]: CreditCard,
    [PaymentMethod.TRANSFER]: ArrowLeftRight,
};

export function CloseCashManualSummaryDialog({
    open,
    onOpenChange,
    menuCategories,
    systemTotalCollected,
    systemPaymentBreakdown,
    value,
    onSave,
}: CloseCashManualSummaryDialogProps) {
    const discardOnCloseRef = useRef(false);
    const [manualTotal, setManualTotal] = useState('');
    const [paymentAmounts, setPaymentAmounts] = useState<Record<PaymentMethod, string>>({
        CASH: '',
        CARD: '',
        TRANSFER: '',
    });
    const [categoryAmounts, setCategoryAmounts] = useState<Record<string, string>>({});
    const [categoryQuantities, setCategoryQuantities] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!open) return;
        discardOnCloseRef.current = false;
        setManualTotal(
            value?.manualTotalCollected != null ? String(value.manualTotalCollected) : ''
        );
        setPaymentAmounts({
            CASH: value?.paymentBreakdown?.find((p) => p.method === 'CASH')?.amount?.toString() ?? '',
            CARD: value?.paymentBreakdown?.find((p) => p.method === 'CARD')?.amount?.toString() ?? '',
            TRANSFER:
                value?.paymentBreakdown?.find((p) => p.method === 'TRANSFER')?.amount?.toString() ??
                '',
        });
        const amounts: Record<string, string> = {};
        const quantities: Record<string, string> = {};
        value?.categorySales?.forEach((cs) => {
            if (cs.amount != null) amounts[cs.category] = String(cs.amount);
            if (cs.quantity != null) quantities[cs.category] = String(cs.quantity);
        });
        setCategoryAmounts(amounts);
        setCategoryQuantities(quantities);
    }, [open, value]);

    const paymentSum = PAYMENT_METHODS.reduce((sum, method) => {
        const n = parseFloat(paymentAmounts[method]);
        return sum + (isNaN(n) ? 0 : n);
    }, 0);

    const categoryAmountSum = Object.values(categoryAmounts).reduce((sum, v) => {
        const n = parseFloat(v);
        return sum + (isNaN(n) ? 0 : n);
    }, 0);

    const categoryQuantitySum = Object.values(categoryQuantities).reduce((sum, v) => {
        const n = Number(v);
        return sum + (Number.isFinite(n) ? Math.floor(n) : 0);
    }, 0);

    const buildSummary = (): ManualCashSummary | null => {
        const summary: ManualCashSummary = {};

        if (manualTotal.trim()) {
            const parsed = parseFloat(manualTotal);
            if (!isNaN(parsed) && parsed >= 0) {
                summary.manualTotalCollected = parsed;
            }
        }

        const payments = PAYMENT_METHODS.map((method) => {
            const val = paymentAmounts[method];
            if (!val?.trim()) return null;
            const amount = parseFloat(val);
            if (isNaN(amount) || amount <= 0) return null;
            return { method, amount };
        }).filter(Boolean) as ManualCashSummary['paymentBreakdown'];
        if (payments && payments.length > 0) {
            summary.paymentBreakdown = payments;
        }

        const categories = menuCategories
            .map((cat) => {
                const amountStr = categoryAmounts[cat.code];
                const qtyStr = categoryQuantities[cat.code];
                const amount =
                    amountStr?.trim() && !Number.isNaN(Number(amountStr)) && Number(amountStr) > 0
                        ? Number(amountStr)
                        : undefined;
                const quantity =
                    qtyStr?.trim() && !Number.isNaN(Number(qtyStr)) && Number(qtyStr) >= 0
                        ? Math.floor(Number(qtyStr))
                        : undefined;
                if ((amount != null && amount > 0) || (quantity != null && quantity > 0)) {
                    return { category: cat.code, amount, quantity };
                }
                return null;
            })
            .filter(Boolean) as ManualCashSummary['categorySales'];
        if (categories && categories.length > 0) {
            summary.categorySales = categories;
        }

        return hasManualSummary(summary) ? summary : null;
    };

    const persistAndClose = () => {
        onSave(buildSummary());
        onOpenChange(false);
    };

    const handleDialogOpenChange = (nextOpen: boolean) => {
        if (!nextOpen && !discardOnCloseRef.current) {
            onSave(buildSummary());
        }
        discardOnCloseRef.current = false;
        onOpenChange(nextOpen);
    };

    const handleCancel = () => {
        discardOnCloseRef.current = true;
        onOpenChange(false);
    };

    const handleClear = () => {
        discardOnCloseRef.current = true;
        onSave(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleDialogOpenChange}>
            <DialogContent className="bg-white sm:max-w-[560px] max-h-[90vh] overflow-y-auto p-0 gap-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#E5D9D1]">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <ClipboardList className="w-5 h-5 text-[#F24452]" />
                        Resumen manual del día
                    </DialogTitle>
                    <DialogDescription>
                        Montos en pesos → gráfico $. Unidades vendidas → gráfico cantidad. Se
                        guarda al cerrar este diálogo.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 py-5 space-y-5">
                    <div className="rounded-lg bg-[#F2EDE4]/50 px-3 py-2 text-xs text-gray-600">
                        Sistema: total {formatCurrency(systemTotalCollected)} — Efectivo{' '}
                        {formatCurrency(systemPaymentBreakdown.CASH)}, Tarjeta{' '}
                        {formatCurrency(systemPaymentBreakdown.CARD)}, Transferencia{' '}
                        {formatCurrency(systemPaymentBreakdown.TRANSFER)}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="manualTotalDialog" className="text-sm">
                            Total recaudado del turno ($)
                        </Label>
                        <Input
                            id="manualTotalDialog"
                            type="number"
                            placeholder={
                                systemTotalCollected > 0
                                    ? systemTotalCollected.toFixed(2)
                                    : '0,00'
                            }
                            value={manualTotal}
                            onChange={(e) => setManualTotal(e.target.value)}
                            className="bg-[#F2EDE4] border-[#E5D9D1]"
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm">Por medio de pago ($)</Label>
                        <div className="space-y-2">
                            {PAYMENT_METHODS.map((method) => {
                                const Icon = paymentIcons[method];
                                return (
                                    <div key={method} className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 w-32 shrink-0 text-sm text-gray-700">
                                            <Icon className="h-4 w-4 text-[#F24452]" />
                                            {PaymentMethodLabels[method]}
                                        </div>
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                                                $
                                            </span>
                                            <Input
                                                type="number"
                                                placeholder={
                                                    systemPaymentBreakdown[method] > 0
                                                        ? systemPaymentBreakdown[method].toFixed(2)
                                                        : '0'
                                                }
                                                value={paymentAmounts[method]}
                                                onChange={(e) =>
                                                    setPaymentAmounts((prev) => ({
                                                        ...prev,
                                                        [method]: e.target.value,
                                                    }))
                                                }
                                                className="pl-7 h-9 bg-[#F2EDE4] border-[#E5D9D1] text-sm"
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {paymentSum > 0 && (
                            <p className="text-xs text-gray-500">
                                Suma medios de pago: {formatCurrency(paymentSum)}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2 rounded-xl border border-[#E5D9D1] p-4 bg-[#F2EDE4]/20">
                        <Label className="text-sm font-semibold text-[#262626]">
                            Montos por categoría ($)
                        </Label>
                        <p className="text-xs text-gray-500 -mt-1">
                            Para el gráfico &quot;Ventas por categoría ($)&quot;
                        </p>
                        <div className="space-y-2">
                            {menuCategories.map((cat) => (
                                <div key={`amount-${cat.code}`} className="flex items-center gap-3">
                                    <Label className="w-28 shrink-0 text-xs text-gray-600">
                                        {cat.name}
                                    </Label>
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                                            $
                                        </span>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={categoryAmounts[cat.code] || ''}
                                            onChange={(e) =>
                                                setCategoryAmounts((prev) => ({
                                                    ...prev,
                                                    [cat.code]: e.target.value,
                                                }))
                                            }
                                            className="pl-7 h-9 bg-[#F2EDE4] border-[#E5D9D1] text-sm"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        {categoryAmountSum > 0 && (
                            <p className="text-xs text-gray-500">
                                Suma montos: {formatCurrency(categoryAmountSum)}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2 rounded-xl border border-[#F24452]/30 p-4 bg-[#F24452]/5">
                        <Label className="text-sm font-semibold text-[#262626]">
                            Unidades vendidas por categoría
                        </Label>
                        <p className="text-xs text-gray-600 -mt-1">
                            Para el gráfico &quot;Ventas por categoría (cantidad)&quot; — no uses
                            pesos acá, solo cantidad de productos.
                        </p>
                        <div className="space-y-2">
                            {menuCategories.map((cat) => (
                                <div key={`qty-${cat.code}`} className="flex items-center gap-3">
                                    <Label className="w-28 shrink-0 text-xs text-gray-600">
                                        {cat.name}
                                    </Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={categoryQuantities[cat.code] || ''}
                                        onChange={(e) =>
                                            setCategoryQuantities((prev) => ({
                                                ...prev,
                                                [cat.code]: e.target.value,
                                            }))
                                        }
                                        className="h-9 bg-white border-[#E5D9D1] text-sm"
                                        min="0"
                                        step="1"
                                    />
                                </div>
                            ))}
                        </div>
                        {categoryQuantitySum > 0 && (
                            <p className="text-xs font-medium text-[#262626]">
                                Total unidades: {categoryQuantitySum}
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t border-[#E5D9D1] bg-gray-50/50 flex-col-reverse sm:flex-row gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        className="text-gray-500 sm:mr-auto"
                        onClick={handleClear}
                    >
                        Borrar resumen
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancel}>
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={persistAndClose}
                        className="bg-[#F24452] hover:bg-[#F23D3D]"
                    >
                        Listo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

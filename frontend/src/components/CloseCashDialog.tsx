/**
 * Dialog para cerrar caja con resumen del sistema y carga manual opcional (dialog separado)
 */

import { useState } from 'react';
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DollarSign, AlertTriangle, ClipboardList, Banknote, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { getOrderPaymentBreakdown } from '../lib/orderPayments';
import type { CashShiftResponse, CloseCashShiftRequest, ManualCashSummary } from '../types/cashshift.types';
import { hasManualSummary, manualSummaryToCloseRequest } from '../types/cashshift.types';
import type { OrderResponse } from '../types/order.types';
import type { MenuCategory } from '../services/menuCategory.service';
import { CloseCashManualSummaryDialog } from './CloseCashManualSummaryDialog';

interface CloseCashDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (request: CloseCashShiftRequest) => Promise<unknown>;
    cashShift: CashShiftResponse | null;
    orders: OrderResponse[];
    menuCategories: MenuCategory[];
    onClosed?: () => void;
    loading?: boolean;
}

export function CloseCashDialog({
    open,
    onOpenChange,
    onSubmit,
    cashShift,
    orders,
    menuCategories,
    onClosed,
    loading = false,
}: CloseCashDialogProps) {
    const [endAmount, setEndAmount] = useState('');
    const [error, setError] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [manualSummary, setManualSummary] = useState<ManualCashSummary | null>(null);
    const [showManualDialog, setShowManualDialog] = useState(false);

    const shiftOrders = orders.filter((o) => o.cashShiftId === cashShift?.id);
    const paidOrders = shiftOrders.filter(
        (o) => o.paymentStatus === 'PAID' && o.orderStatus !== 'CANCELLED'
    );
    const unpaidOrders = shiftOrders.filter(
        (o) => o.paymentStatus !== 'PAID' && o.orderStatus !== 'CANCELLED'
    );

    const paymentBreakdown = paidOrders.reduce(
        (acc, order) => {
            const breakdown = getOrderPaymentBreakdown(order);
            acc.CASH += breakdown.CASH;
            acc.CARD += breakdown.CARD;
            acc.TRANSFER += breakdown.TRANSFER;
            return acc;
        },
        { CASH: 0, CARD: 0, TRANSFER: 0 } as Record<string, number>
    );

    const systemTotalCollected =
        paymentBreakdown.CASH + paymentBreakdown.CARD + paymentBreakdown.TRANSFER;
    const cashSales = paymentBreakdown.CASH;
    const startAmount = cashShift?.startAmount || 0;
    const expectedInDrawer = startAmount + cashSales;

    const resetForm = () => {
        setEndAmount('');
        setError('');
        setShowConfirm(false);
        setManualSummary(null);
        setShowManualDialog(false);
    };

    const buildRequest = (physicalAmount: number): CloseCashShiftRequest => ({
        endAmount: physicalAmount,
        ...manualSummaryToCloseRequest(manualSummary),
    });

    const performClose = async (physicalAmount: number) => {
        try {
            await onSubmit(buildRequest(physicalAmount));
            resetForm();
            onOpenChange(false);
            onClosed?.();
        } catch (err) {
            console.error('Error closing cash:', err);
        }
    };

    const handleSubmit = async () => {
        setError('');
        if (!endAmount.trim()) {
            setError('Ingresá el efectivo que hay en la caja');
            return;
        }
        const amount = parseFloat(endAmount);
        if (isNaN(amount) || amount < 0) {
            setError('Monto inválido');
            return;
        }
        if (Math.abs(expectedInDrawer - amount) > 0.01) {
            setShowConfirm(true);
            return;
        }
        await performClose(amount);
    };

    const difference = expectedInDrawer - parseFloat(endAmount || '0');
    const manualLoaded = hasManualSummary(manualSummary);

    return (
        <>
            <Dialog
                open={open}
                onOpenChange={(v) => {
                    if (!loading) {
                        if (!v) resetForm();
                        onOpenChange(v);
                    }
                }}
            >
                <DialogContent className="bg-white sm:max-w-[560px] max-h-[90vh] overflow-y-auto p-0 gap-0">
                    <DialogHeader className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-[#E5D9D1]">
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <DollarSign className="w-5 h-5 text-[#F24452]" />
                            Cerrar caja
                        </DialogTitle>
                        <DialogDescription>
                            Verificá el efectivo en caja. El resumen manual se carga en un paso aparte.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-4 sm:px-6 py-5 space-y-4">
                        {unpaidOrders.length > 0 && (
                            <div className="flex items-start gap-3 p-3 rounded-xl border border-[#F24452]/30 bg-[#F24452]/5">
                                <AlertTriangle className="h-5 w-5 text-[#F24452] shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-semibold text-[#262626]">
                                        {unpaidOrders.length} pedido
                                        {unpaidOrders.length > 1 ? 's' : ''} sin cobrar
                                    </p>
                                    <p className="text-gray-600 mt-0.5">
                                        Revisá que estén cobrados antes de cerrar.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="rounded-xl border border-[#E5D9D1] overflow-hidden">
                            <div className="px-4 py-3 bg-[#F2EDE4]/60 border-b border-[#E5D9D1]">
                                <p className="text-sm font-semibold text-[#262626]">
                                    Resumen del sistema
                                </p>
                                <p className="text-xs text-gray-500">
                                    {paidOrders.length} pedidos cobrados en este turno
                                </p>
                            </div>
                            <div className="p-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Monto inicial</span>
                                    <span className="font-medium tabular-nums">
                                        {formatCurrency(startAmount)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Efectivo</span>
                                    <span className="font-medium tabular-nums text-[#262626]">
                                        {formatCurrency(cashSales)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tarjeta</span>
                                    <span className="font-medium tabular-nums text-[#262626]">
                                        {formatCurrency(paymentBreakdown.CARD)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Transferencia</span>
                                    <span className="font-medium tabular-nums text-[#262626]">
                                        {formatCurrency(paymentBreakdown.TRANSFER)}
                                    </span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-[#E5D9D1]">
                                    <span className="font-medium text-gray-700">Total recaudado</span>
                                    <span className="font-bold text-[#F24452] tabular-nums">
                                        {formatCurrency(systemTotalCollected)}
                                    </span>
                                </div>
                                <div className="flex justify-between p-2 rounded-lg bg-[#F2EDE4]/50">
                                    <span className="font-semibold text-[#262626]">
                                        Efectivo esperado en caja
                                    </span>
                                    <span className="font-bold tabular-nums">
                                        {formatCurrency(expectedInDrawer)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="endAmount" className="flex items-center gap-1.5">
                                <Banknote className="h-4 w-4 text-[#F24452]" />
                                Efectivo en caja (conteo físico) *
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                                    $
                                </span>
                                <Input
                                    id="endAmount"
                                    type="number"
                                    placeholder="0,00"
                                    value={endAmount}
                                    onChange={(e) => {
                                        setEndAmount(e.target.value);
                                        setError('');
                                    }}
                                    className="pl-8 h-11 bg-[#F2EDE4] border-[#E5D9D1]"
                                    min="0"
                                    step="0.01"
                                    disabled={loading}
                                />
                            </div>
                            {error && <p className="text-sm text-[#F23D3D]">{error}</p>}
                            {endAmount && Math.abs(difference) > 0.01 && (
                                <p className="text-sm text-amber-700 flex items-center gap-1.5">
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    Diferencia: {formatCurrency(Math.abs(difference))}{' '}
                                    {difference > 0 ? '(faltante)' : '(sobrante)'}
                                </p>
                            )}
                        </div>

                        <div className="rounded-xl border border-dashed border-[#E5D9D1] p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-start gap-2">
                                    <ClipboardList className="h-4 w-4 text-[#F24452] mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-[#262626]">
                                            Resumen manual del día
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Opcional — medios de pago, categorías y unidades
                                        </p>
                                        {manualLoaded && (
                                            <p className="text-xs text-emerald-700 flex items-center gap-1 mt-1">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Resumen cargado
                                                {manualSummary?.manualTotalCollected != null &&
                                                    ` · Total ${formatCurrency(manualSummary.manualTotalCollected)}`}
                                                {manualSummary?.categorySales?.some(
                                                    (c) => (c.quantity ?? 0) > 0
                                                ) && (
                                                    <span>
                                                        {' '}
                                                        ·{' '}
                                                        {manualSummary!.categorySales!.reduce(
                                                            (s, c) => s + (c.quantity ?? 0),
                                                            0
                                                        )}{' '}
                                                        u.
                                                    </span>
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="border-[#E5D9D1] shrink-0 touch-target"
                                    onClick={() => setShowManualDialog(true)}
                                >
                                    {manualLoaded ? 'Editar resumen' : 'Cargar resumen'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="px-4 sm:px-6 py-4 border-t border-[#E5D9D1] bg-gray-50/50">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="touch-target">
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => void handleSubmit()}
                            disabled={loading}
                            className="bg-[#F24452] hover:bg-[#F23D3D] touch-target"
                        >
                            {loading ? 'Cerrando...' : 'Cerrar caja'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <CloseCashManualSummaryDialog
                open={showManualDialog}
                onOpenChange={setShowManualDialog}
                menuCategories={menuCategories}
                systemTotalCollected={systemTotalCollected}
                systemPaymentBreakdown={{
                    CASH: paymentBreakdown.CASH,
                    CARD: paymentBreakdown.CARD,
                    TRANSFER: paymentBreakdown.TRANSFER,
                }}
                value={manualSummary}
                onSave={setManualSummary}
            />

            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                            Diferencia en caja
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-2 text-sm text-gray-600">
                                <p>
                                    Esperado:{' '}
                                    <strong>{formatCurrency(expectedInDrawer)}</strong> — Contado:{' '}
                                    <strong>{formatCurrency(parseFloat(endAmount))}</strong>
                                </p>
                                <p>
                                    Diferencia:{' '}
                                    <span className="font-semibold text-amber-700">
                                        {formatCurrency(Math.abs(difference))}
                                    </span>
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Volver</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={loading}
                            onClick={() => void performClose(parseFloat(endAmount))}
                            className="bg-[#F24452] hover:bg-[#F23D3D]"
                        >
                            Cerrar igual
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

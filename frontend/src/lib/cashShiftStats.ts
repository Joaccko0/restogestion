/**
 * Helpers para agregar estadísticas de cierres de caja (sistema + resumen manual).
 */

import type { CashShiftResponse } from '../types/cashshift.types';

export function toNum(value: unknown): number {
    if (value == null || value === '') return 0;
    const n = typeof value === 'number' ? value : parseFloat(String(value));
    return Number.isFinite(n) ? n : 0;
}

/** Unifica código (PIZZAS) y nombre (Pizzas) bajo el mismo label visible. */
export function normalizeCategoryLabel(
    raw: string | undefined | null,
    labelByCode: Record<string, string>
): string {
    if (!raw?.trim()) return labelByCode.OTROS ?? 'Otros';
    const trimmed = raw.trim();
    if (labelByCode[trimmed]) return labelByCode[trimmed];
    const byName = Object.entries(labelByCode).find(
        ([, name]) => name.toLowerCase() === trimmed.toLowerCase()
    );
    if (byName) return byName[1];
    return trimmed;
}

export function shiftHasManualData(shift: CashShiftResponse): boolean {
    if (shift.manualTotalCollected != null) return true;
    if ((shift.paymentBreakdown?.length ?? 0) > 0) return true;
    if ((shift.categorySales?.length ?? 0) > 0) return true;
    return false;
}

/** Turnos donde el resumen manual reemplaza ventas del sistema (montos / medios de pago). */
export function shiftReplacesSystemRevenue(shift: CashShiftResponse): boolean {
    if (shift.manualTotalCollected != null) return true;
    if ((shift.paymentBreakdown ?? []).some((entry) => toNum(entry.amount) > 0)) return true;
    if ((shift.categorySales ?? []).some((cs) => toNum(cs.amount) > 0)) return true;
    return false;
}

/** Ingresos del turno según resumen manual (total → medios de pago → suma categorías). */
export function manualShiftRevenue(shift: CashShiftResponse): number {
    if (shift.manualTotalCollected != null) {
        return toNum(shift.manualTotalCollected);
    }
    const paymentSum = (shift.paymentBreakdown ?? []).reduce(
        (sum, entry) => sum + toNum(entry.amount),
        0
    );
    if (paymentSum > 0) return paymentSum;
    return (shift.categorySales ?? []).reduce((sum, cs) => sum + toNum(cs.amount), 0);
}

export function addManualCategorySales(
    shift: CashShiftResponse,
    labelByCode: Record<string, string>,
    categoryTotals: Map<string, number>,
    categoryQuantityTotals: Map<string, number>,
    options: { includeAmounts?: boolean; includeQuantities?: boolean } = {}
) {
    const includeAmounts = options.includeAmounts ?? true;
    const includeQuantities = options.includeQuantities ?? true;

    (shift.categorySales ?? []).forEach((cs) => {
        const label = normalizeCategoryLabel(cs.category, labelByCode);
        const amount = toNum(cs.amount);
        const quantity = Math.floor(toNum(cs.quantity));
        if (includeAmounts && amount > 0) {
            categoryTotals.set(label, (categoryTotals.get(label) || 0) + amount);
        }
        if (includeQuantities && quantity > 0) {
            categoryQuantityTotals.set(
                label,
                (categoryQuantityTotals.get(label) || 0) + quantity
            );
        }
    });
}

export function aggregateCategoryQuantities(
    filteredShifts: CashShiftResponse[],
    systemPaidOrders: { cashShiftId?: number | null; items: { category?: string; quantity?: number }[] }[],
    labelByCode: Record<string, string>
): Map<string, number> {
    const totals = new Map<string, number>();

    const shiftsWithManualQty = new Set(
        filteredShifts
            .filter((shift) =>
                (shift.categorySales ?? []).some((cs) => Math.floor(toNum(cs.quantity)) > 0)
            )
            .map((s) => s.id)
    );

    filteredShifts.forEach((shift) => {
        (shift.categorySales ?? []).forEach((cs) => {
            const qty = Math.floor(toNum(cs.quantity));
            if (qty <= 0) return;
            const label = normalizeCategoryLabel(cs.category, labelByCode);
            totals.set(label, (totals.get(label) || 0) + qty);
        });
    });

    systemPaidOrders
        .filter((order) => !shiftsWithManualQty.has(order.cashShiftId ?? -1))
        .forEach((order) => {
            order.items.forEach((item) => {
                const qty = Math.floor(toNum(item.quantity));
                if (qty <= 0) return;
                const label = normalizeCategoryLabel(item.category, labelByCode);
                totals.set(label, (totals.get(label) || 0) + qty);
            });
        });

    return totals;
}

export function normalizeCashShiftResponse(shift: CashShiftResponse): CashShiftResponse {
    return {
        ...shift,
        manualTotalCollected:
            shift.manualTotalCollected != null ? toNum(shift.manualTotalCollected) : null,
        categorySales: (shift.categorySales ?? []).map((cs) => ({
            category: cs.category,
            amount: cs.amount != null ? toNum(cs.amount) : null,
            quantity: cs.quantity != null ? Math.floor(toNum(cs.quantity)) : null,
        })),
        paymentBreakdown: (shift.paymentBreakdown ?? []).map((entry) => ({
            method: entry.method,
            amount: toNum(entry.amount),
        })),
    };
}

export function addManualPaymentBreakdown(
    shift: CashShiftResponse,
    paymentTotals: Record<string, { amount: number; count: number }>
) {
    (shift.paymentBreakdown ?? []).forEach((entry) => {
        const method = entry.method;
        const amount = toNum(entry.amount);
        if (amount > 0 && paymentTotals[method]) {
            paymentTotals[method].amount += amount;
            paymentTotals[method].count += 1;
        }
    });
}

/**
 * Tipos para CashShift (Apertura y Cierre de Caja)
 */

import type { PaymentMethod } from './order.types';

export type CashShiftStatus = 'OPEN' | 'CLOSED';

export interface CategorySale {
    category: string;
    amount?: number | null;
    quantity?: number | null;
}

export interface PaymentMethodSale {
    method: PaymentMethod;
    amount: number;
}

export interface ManualCashSummary {
    manualTotalCollected?: number;
    paymentBreakdown?: PaymentMethodSale[];
    categorySales?: CategorySale[];
}

export interface CashShiftResponse {
    id: number;
    status: CashShiftStatus;
    startDate: string;
    endDate: string | null;
    startAmount: number;
    endAmount: number | null;
    manualTotalCollected: number | null;
    categorySales: CategorySale[];
    paymentBreakdown: PaymentMethodSale[];
}

export interface OpenCashShiftRequest {
    startAmount: number;
}

export interface CloseCashShiftRequest {
    endAmount: number;
    manualTotalCollected?: number;
    categorySales?: CategorySale[];
    paymentBreakdown?: PaymentMethodSale[];
}

export function hasManualSummary(data: ManualCashSummary | null | undefined): boolean {
    if (!data) return false;
    if (data.manualTotalCollected != null && data.manualTotalCollected >= 0) return true;
    if (data.paymentBreakdown?.some((p) => p.amount > 0)) return true;
    if (
        data.categorySales?.some(
            (c) => (c.amount != null && c.amount > 0) || (c.quantity != null && c.quantity > 0)
        )
    ) {
        return true;
    }
    return false;
}

export function manualSummaryToCloseRequest(
    summary: ManualCashSummary | null | undefined
): Pick<CloseCashShiftRequest, 'manualTotalCollected' | 'categorySales' | 'paymentBreakdown'> {
    if (!summary || !hasManualSummary(summary)) {
        return {};
    }

    const result: Pick<
        CloseCashShiftRequest,
        'manualTotalCollected' | 'categorySales' | 'paymentBreakdown'
    > = {};

    if (summary.manualTotalCollected != null && summary.manualTotalCollected >= 0) {
        result.manualTotalCollected = summary.manualTotalCollected;
    }

    const payments = (summary.paymentBreakdown ?? [])
        .map((p) => ({ method: p.method, amount: p.amount }))
        .filter((p) => !isNaN(p.amount) && p.amount > 0);
    if (payments.length > 0) {
        result.paymentBreakdown = payments;
    }

    const categories = (summary.categorySales ?? [])
        .map((c) => {
            const amount =
                c.amount != null && !Number.isNaN(Number(c.amount)) && Number(c.amount) > 0
                    ? Number(c.amount)
                    : null;
            const quantity =
                c.quantity != null && !Number.isNaN(Number(c.quantity)) && Number(c.quantity) > 0
                    ? Math.floor(Number(c.quantity))
                    : null;
            return { category: c.category, amount, quantity };
        })
        .filter(
            (c) => (c.amount != null && c.amount > 0) || (c.quantity != null && c.quantity > 0)
        );
    if (categories.length > 0) {
        result.categorySales = categories;
    }

    return result;
}

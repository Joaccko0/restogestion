/**
 * Tipos para CashShift (Apertura y Cierre de Caja)
 */

export type CashShiftStatus = 'OPEN' | 'CLOSED';

export interface CategorySale {
    category: string;
    amount: number;
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
}

export interface OpenCashShiftRequest {
    startAmount: number;
}

export interface CloseCashShiftRequest {
    endAmount: number;
    manualTotalCollected?: number;
    categorySales?: CategorySale[];
}

/**
 * Utilidades para pagos de pedidos (simple o dividido)
 */

import type { OrderResponse, PaymentMethod } from '../types/order.types';
import { PaymentMethod as PM } from '../types/order.types';

export type PaymentBreakdown = Record<PaymentMethod, number>;

export function getOrderPaymentBreakdown(order: OrderResponse): PaymentBreakdown {
    const breakdown: PaymentBreakdown = { [PM.CASH]: 0, [PM.CARD]: 0, [PM.TRANSFER]: 0 };

    if (order.payments && order.payments.length > 0) {
        for (const p of order.payments) {
            breakdown[p.paymentMethod] = (breakdown[p.paymentMethod] || 0) + p.amount;
        }
        return breakdown;
    }

    if (order.paymentStatus === 'PAID' && order.paymentMethod) {
        breakdown[order.paymentMethod] = order.total;
    }

    return breakdown;
}

export function orderPaidTotal(order: OrderResponse): number {
    const b = getOrderPaymentBreakdown(order);
    return b[PM.CASH] + b[PM.CARD] + b[PM.TRANSFER];
}

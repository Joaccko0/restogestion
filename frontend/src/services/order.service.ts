/**
 * Servicio para gestionar órdenes (pedidos)
 * Comunicación con API /api/orders
 */

import apiClient from '../api/client';
import type { OrderResponse, CreateOrderRequest, OrderStatus, OrderItemRequest, OrderPaymentRequest } from '../types/order.types';

export const OrderService = {
    /**
     * Obtener todas las órdenes de la caja abierta actual
     */
    async getOrders(businessId: number): Promise<OrderResponse[]> {
        const response = await apiClient.get<OrderResponse[]>('/orders', {
            params: { businessId }
        });
        return response.data;
    },

    /**
     * Obtener el historial completo de órdenes (todas las cajas)
     */
    async getOrdersHistoric(businessId: number): Promise<OrderResponse[]> {
        const response = await apiClient.get<OrderResponse[]>('/orders/historic', {
            params: { businessId }
        });
        return response.data;
    },

    /**
     * Crear una nueva orden
     */
    async createOrder(businessId: number, data: CreateOrderRequest): Promise<OrderResponse> {
        const response = await apiClient.post<OrderResponse>('/orders', data, {
            params: { businessId }
        });
        return response.data;
    },

    /**
     * Actualizar el estado de una orden
     * (PUT /api/orders/{id}?businessId=X con { orderStatus: "PREPARING" })
     */
    async updateOrderStatus(
        businessId: number,
        orderId: number,
        newStatus: OrderStatus
    ): Promise<OrderResponse> {
        const response = await apiClient.put<OrderResponse>(
            `/orders/${orderId}`,
            { orderStatus: newStatus },
            { params: { businessId } }
        );
        return response.data;
    },

    /**
     * Actualizar detalles de pago/entrega de una orden
     */
    async updateOrderDetails(
        businessId: number,
        orderId: number,
        details: {
            paymentStatus?: string;
            paymentMethod?: string;
            deliveryMethod?: string;
            customerId?: number;
            addressId?: number;
            manualAddress?: string;
            deliveryFee?: number;
            items?: OrderItemRequest[];
            payments?: OrderPaymentRequest[];
        }
    ): Promise<OrderResponse> {
        const response = await apiClient.patch<OrderResponse>(
            `/orders/${orderId}/details`,
            details,
            { params: { businessId } }
        );
        return response.data;
    },

    /**
     * Eliminar (cancelar) una orden
     */
    async cancelOrder(businessId: number, orderId: number): Promise<OrderResponse> {
        const response = await apiClient.put<OrderResponse>(
            `/orders/${orderId}`,
            { orderStatus: 'CANCELLED' },
            { params: { businessId } }
        );
        return response.data;
    }
};

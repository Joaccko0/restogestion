/**
 * Hook custom para gestión de órdenes
 * Maneja estado, carga de datos y operaciones CRUD
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { OrderService } from '../services/order.service';
import type {
    OrderResponse,
    CreateOrderRequest,
    OrderStatus,
    PaymentStatus,
    PaymentMethod,
    DeliveryMethod,
    OrderItemRequest,
    OrderPaymentRequest,
} from '../types/order.types';
import { OrderStatusLabels } from '../types/order.types';

interface UseOrdersReturn {
    orders: OrderResponse[];
    loading: boolean;
    error: string | null;
    loadOrders: () => Promise<void>;
    createOrder: (data: CreateOrderRequest) => Promise<boolean>;
    updateOrderStatus: (orderId: number, newStatus: OrderStatus) => Promise<boolean>;
    updateOrderDetails: (
        orderId: number,
        details: {
            paymentStatus?: PaymentStatus;
            paymentMethod?: PaymentMethod;
            deliveryMethod?: DeliveryMethod;
            customerId?: number;
            addressId?: number;
            manualAddress?: string;
            deliveryFee?: number;
            items?: OrderItemRequest[];
            payments?: OrderPaymentRequest[];
        }
    ) => Promise<OrderResponse | null>;
    cancelOrder: (orderId: number) => Promise<boolean>;
}

/**
 * Hook para gestión completa de órdenes
 */
export function useOrders(businessId: number | undefined): UseOrdersReturn {
    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Cargar todas las órdenes
     */
    const loadOrders = useCallback(async () => {
        if (!businessId) return;

        setLoading(true);
        setError(null);

        try {
            const data = await OrderService.getOrders(businessId);
            setOrders(data);
        } catch (err: any) {
            const message = err.response?.data?.message || 'Error al cargar órdenes';
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [businessId]);

    // Cargar órdenes al montar o cambiar businessId
    useEffect(() => {
        if (businessId) {
            loadOrders();
        } else {
            // Limpiar órdenes si no hay negocio seleccionado
            setOrders([]);
        }
    }, [businessId, loadOrders]);

    /**
     * Crear nueva orden
     */
    const createOrder = async (data: CreateOrderRequest): Promise<boolean> => {
        if (!businessId) return false;

        try {
            const newOrder = await OrderService.createOrder(businessId, data);
            setOrders(prev => [newOrder, ...prev]); // Agregar al inicio
            toast.success('Pedido creado', {
                description: `#${newOrder.id} creado correctamente`
            });
            return true;
        } catch (err: any) {
            const message = err.response?.data?.message || 'Error al crear pedido';
            toast.error('No se pudo crear el pedido', { description: message });
            return false;
        }
    };

    /**
     * Actualizar estado de una orden (para Kanban drag & drop)
     */
    const updateOrderStatus = async (
        orderId: number,
        newStatus: OrderStatus
    ): Promise<boolean> => {
        if (!businessId) return false;

        // Optimistic update: aplicar cambio local inmediatamente
        let previous: OrderResponse | null = null;
        setOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                previous = o;
                return { ...o, orderStatus: newStatus };
            }
            return o;
        }));

        try {
            const updatedOrder = await OrderService.updateOrderStatus(businessId, orderId, newStatus);
            // Reemplazar con la versión del servidor
            setOrders(prev => prev.map(o => (o.id === orderId ? updatedOrder : o)));
            toast.success('Estado actualizado', {
                description: OrderStatusLabels[newStatus]
            });
            return true;
        } catch (err: any) {
            // Revertir
            if (previous) {
                setOrders(prev => prev.map(o => (o.id === orderId ? previous as OrderResponse : o)));
            }
            const message = err.response?.data?.message || 'Error al actualizar estado';
            toast.error('No se pudo actualizar el estado', { description: message });
            return false;
        }
    };

    /**
     * Actualizar detalles (pago/entrega) de una orden
     */
    const updateOrderDetails = async (
        orderId: number,
        details: {
            paymentStatus?: PaymentStatus;
            paymentMethod?: PaymentMethod;
            deliveryMethod?: DeliveryMethod;
            customerId?: number;
            addressId?: number;
            manualAddress?: string;
            deliveryFee?: number;
            items?: OrderItemRequest[];
            payments?: OrderPaymentRequest[];
        }
    ): Promise<OrderResponse | null> => {
        if (!businessId) return null;

        let previous: OrderResponse | null = null;
        setOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                previous = o;
                return { ...o, ...details } as OrderResponse;
            }
            return o;
        }));

        try {
            const updatedOrder = await OrderService.updateOrderDetails(businessId, orderId, details);
            setOrders(prev => prev.map(o => (o.id === orderId ? updatedOrder : o)));
            if (details.paymentStatus === 'PAID') {
                toast.success('Cobro registrado', {
                    description: `Pedido #${orderId} marcado como pagado`,
                });
            } else {
                toast.success('Detalles actualizados');
            }
            return updatedOrder;
        } catch (err: any) {
            if (previous) {
                setOrders(prev => prev.map(o => (o.id === orderId ? previous as OrderResponse : o)));
            }
            const message = err.response?.data?.message || 'Error al actualizar detalles';
            toast.error('No se pudieron actualizar los detalles', { description: message });
            return null;
        }
    };

    /**
     * Cancelar una orden
     */
    const cancelOrder = async (orderId: number): Promise<boolean> => {
        if (!businessId) return false;

        try {
            const updated = await OrderService.cancelOrder(businessId, orderId);
            // Actualizar en el estado local (quedará como CANCELLED)
            setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
            toast.success('Pedido cancelado', {
                description: `#${orderId} marcado como cancelado`
            });
            return true;
        } catch (err: any) {
            const message = err.response?.data?.message || 'Error al cancelar pedido';
            toast.error('No se pudo cancelar el pedido', { description: message });
            return false;
        }
    };

    return {
        orders,
        loading,
        error,
        loadOrders,
        createOrder,
        updateOrderStatus,
        updateOrderDetails,
        cancelOrder
    };
}

/**
 * Servicio para gestionar CashShift (Apertura y Cierre de Caja)
 * Comunicación con API /api/cash-shifts
 */

import apiClient from '../api/client';
import type { CashShiftResponse, OpenCashShiftRequest, CloseCashShiftRequest } from '../types/cashshift.types';

export const CashShiftService = {
    /**
     * Obtener la caja abierta actual
     */
    async getOpenCashShift(businessId: number): Promise<CashShiftResponse | null> {
        try {
            const response = await apiClient.get<CashShiftResponse>('/cash-shifts/open', {
                params: { businessId }
            });
            return response.data;
        } catch (error: any) {
            // 404 o 204 significa que no hay caja abierta
            if (error.response?.status === 404 || error.response?.status === 204) {
                return null;
            }
            throw error;
        }
    },

    /**
     * Abrir una nueva caja
     */
    async openCashShift(businessId: number, startAmount: number): Promise<CashShiftResponse> {
        const response = await apiClient.post<CashShiftResponse>(
            '/cash-shifts',
            { startAmount } as OpenCashShiftRequest,
            { params: { businessId } }
        );
        return response.data;
    },

    /**
     * Cerrar la caja abierta
     */
    async closeCashShift(
        businessId: number,
        request: CloseCashShiftRequest
    ): Promise<CashShiftResponse> {
        const response = await apiClient.put<CashShiftResponse>(
            '/cash-shifts/close',
            request,
            { params: { businessId } }
        );
        return response.data;
    },

    /**
     * Obtener todas las cajas (historial)
     */
    async getAllCashShifts(businessId: number): Promise<CashShiftResponse[]> {
        const response = await apiClient.get<CashShiftResponse[]>('/cash-shifts', {
            params: { businessId }
        });
        return response.data;
    },

    /**
     * Obtener una caja específica por ID
     */
    async getCashShiftById(businessId: number, cashShiftId: number): Promise<CashShiftResponse> {
        const response = await apiClient.get<CashShiftResponse>(`/cash-shifts/${cashShiftId}`, {
            params: { businessId }
        });
        return response.data;
    }
};

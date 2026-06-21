/**
 * Hook personalizado para gestionar CashShift (Apertura y Cierre de Caja)
 */

import { useState, useCallback, useEffect } from 'react';
import { CashShiftService } from '../services/cashshift.service';
import { useBusiness } from '../context/BusinessContext';
import type { CashShiftResponse, CloseCashShiftRequest } from '../types/cashshift.types';
import { toast } from 'sonner';

export function useCashShift() {
    const { currentBusiness } = useBusiness();
    const businessId = currentBusiness?.id;
    const [openCashShift, setOpenCashShift] = useState<CashShiftResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Obtener la caja abierta actual
    const fetchOpenCashShift = useCallback(async () => {
        if (!businessId) return;
        setLoading(true);
        setError(null);
        try {
            const cashShift = await CashShiftService.getOpenCashShift(businessId);
            setOpenCashShift(cashShift);
        } catch (err: any) {
            const message = err.response?.data?.message || 'Error al obtener caja abierta';
            setError(message);
            console.error('Error fetching open cash shift:', err);
        } finally {
            setLoading(false);
        }
    }, [businessId]);

    // Abrir una nueva caja
    const openCash = useCallback(
        async (startAmount: number) => {
            if (!businessId) return;
            setLoading(true);
            setError(null);
            try {
                const cashShift = await CashShiftService.openCashShift(businessId, startAmount);
                setOpenCashShift(cashShift);
                toast.success(`Caja abierta con $${startAmount.toFixed(2)}`);
                return cashShift;
            } catch (err: any) {
                const message =
                    err.response?.data?.message || 'Error al abrir caja';
                setError(message);
                toast.error(message);
                console.error('Error opening cash shift:', err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [businessId]
    );

    // Cerrar la caja abierta
    const closeCash = useCallback(
        async (request: CloseCashShiftRequest) => {
            if (!businessId) return;
            setLoading(true);
            setError(null);
            try {
                await CashShiftService.closeCashShift(businessId, request);
                setOpenCashShift(null);
                    toast.success(`Caja cerrada — efectivo en caja: $${request.endAmount.toFixed(2)}`);
                return true;
            } catch (err: any) {
                const message =
                    err.response?.data?.message || 'Error al cerrar caja';
                setError(message);
                toast.error(message);
                console.error('Error closing cash shift:', err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [businessId]
    );

    // Cargar la caja abierta al montar el componente
    useEffect(() => {
        fetchOpenCashShift();
    }, [fetchOpenCashShift]);

    return {
        openCashShift,
        loading,
        error,
        openCash,
        closeCash,
        fetchOpenCashShift
    };
}

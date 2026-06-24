/**
 * Componente para mostrar el estado actual de la caja
 * Muestra si está abierta o cerrada, monto inicial, y botones de acción
 */

import { DollarSign, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '../lib/utils';
import { formatDateAR, formatTimeAR } from '../lib/datetime';
import type { CashShiftResponse } from '../types/cashshift.types';

interface CashShiftStatusProps {
    cashShift: CashShiftResponse | null;
    onOpenClick: () => void;
    onCloseClick: () => void;
    loading?: boolean;
}

export function CashShiftStatus({ cashShift, onOpenClick, onCloseClick, loading = false }: CashShiftStatusProps) {
    if (!cashShift) {
        return (
            <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">Caja Cerrada</p>
                                <p className="text-sm text-gray-600">Abre la caja para comenzar a registrar ventas</p>
                            </div>
                        </div>
                        <Button
                            onClick={onOpenClick}
                            disabled={loading}
                            className="bg-[#F24452] hover:bg-[#d63c47] touch-target self-start sm:self-auto"
                        >
                            Abrir Caja
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const timeOpen = formatTimeAR(cashShift.startDate);
    const dateOpen = formatDateAR(cashShift.startDate, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
                {/* Header con título y botón de cerrar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-800">Caja Abierta</p>
                                <Badge className="bg-green-600 hover:bg-green-700">ACTIVA</Badge>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {timeOpen}
                                </span>
                                <span className="capitalize">{dateOpen}</span>
                            </div>
                        </div>
                    </div>
                    {/* BOTÓN CERRAR CAJA */}
                    <Button
                        onClick={onCloseClick}
                        disabled={loading}
                        className="bg-[#F24452] hover:bg-[#d63c47] text-white touch-target self-start sm:self-auto"
                    >
                        Cerrar Caja
                    </Button>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-green-100">
                        <p className="text-xs text-gray-600 font-medium">Monto Inicial</p>
                        <p className="text-lg font-bold text-green-700">
                            {formatCurrency(cashShift.startAmount)}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-green-100">
                        <p className="text-xs text-gray-600 font-medium">Estado</p>
                        <p className="text-lg font-bold text-green-700">{cashShift.status}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-green-100">
                        <p className="text-xs text-gray-600 font-medium">Caja ID</p>
                        <p className="text-lg font-bold text-green-700">#{cashShift.id}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

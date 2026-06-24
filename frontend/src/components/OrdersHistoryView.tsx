/**
 * Vista de Historial de Pedidos con filtros
 */

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '../lib/utils';
import { formatDateAR, formatTimeAR } from '../lib/datetime';
import { Badge } from '@/components/ui/badge';
import {
    Calendar,
    FilterX,
    Wallet,
    History,
    DollarSign,
    CheckCircle2,
    Loader2,
    Filter,
    ChevronDown,
    ChevronUp,
    Search,
} from 'lucide-react';
import type { OrderResponse, OrderStatus, PaymentStatus, PaymentMethod } from '../types/order.types';
import type { CashShiftResponse } from '../types/cashshift.types';
import {
    OrderStatusLabels,
    OrderStatusColors,
    PaymentStatusLabels,
    PaymentMethodLabels,
} from '../types/order.types';

interface OrdersHistoryViewProps {
    orders: OrderResponse[];
    loading?: boolean;
    cashShifts?: CashShiftResponse[];
}

export function OrdersHistoryView({ orders, loading = false, cashShifts = [] }: OrdersHistoryViewProps) {
    const ALL = 'ALL';
    const [filtersOpen, setFiltersOpen] = useState(true);
    const [filterDateFrom, setFilterDateFrom] = useState<string>('');
    const [filterDateTo, setFilterDateTo] = useState<string>('');
    const [filterOrderStatus, setFilterOrderStatus] = useState<OrderStatus | typeof ALL>(ALL);
    const [filterPaymentStatus, setFilterPaymentStatus] = useState<PaymentStatus | typeof ALL>(ALL);
    const [filterPaymentMethod, setFilterPaymentMethod] = useState<PaymentMethod | typeof ALL>(ALL);
    const [filterCustomer, setFilterCustomer] = useState<string>('');
    const [filterCashShift, setFilterCashShift] = useState<number | typeof ALL>(ALL);

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const orderCashShift = cashShifts.find((cs) => cs.id === order.cashShiftId);

            if (filterDateFrom && orderCashShift) {
                const fromDate = new Date(filterDateFrom);
                fromDate.setHours(0, 0, 0, 0);
                const cashShiftDate = new Date(orderCashShift.startDate);
                cashShiftDate.setHours(0, 0, 0, 0);
                if (cashShiftDate < fromDate) return false;
            }

            if (filterDateTo && orderCashShift) {
                const toDate = new Date(filterDateTo);
                toDate.setHours(23, 59, 59, 999);
                const cashShiftDate = new Date(orderCashShift.startDate);
                cashShiftDate.setHours(0, 0, 0, 0);
                if (cashShiftDate > toDate) return false;
            }

            if (filterOrderStatus !== ALL && order.orderStatus !== filterOrderStatus) return false;
            if (filterPaymentStatus !== ALL && order.paymentStatus !== filterPaymentStatus) return false;
            if (filterPaymentMethod !== ALL && order.paymentMethod !== filterPaymentMethod) return false;

            if (
                filterCustomer &&
                !order.customerName?.toLowerCase().includes(filterCustomer.toLowerCase())
            ) {
                return false;
            }

            if (filterCashShift !== ALL && order.cashShiftId !== filterCashShift) return false;

            return true;
        });
    }, [
        orders,
        cashShifts,
        filterDateFrom,
        filterDateTo,
        filterOrderStatus,
        filterPaymentStatus,
        filterPaymentMethod,
        filterCustomer,
        filterCashShift,
    ]);

    const stats = useMemo(() => {
        const paid = filteredOrders.filter(
            (o) => o.paymentStatus === 'PAID' && o.orderStatus !== 'CANCELLED'
        );
        const totalRevenue = paid.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        return {
            count: filteredOrders.length,
            paidCount: paid.length,
            totalRevenue,
        };
    }, [filteredOrders]);

    const hasActiveFilters =
        filterDateFrom ||
        filterDateTo ||
        filterOrderStatus !== ALL ||
        filterPaymentStatus !== ALL ||
        filterPaymentMethod !== ALL ||
        filterCustomer ||
        filterCashShift !== ALL;

    const handleClearFilters = () => {
        setFilterDateFrom('');
        setFilterDateTo('');
        setFilterOrderStatus(ALL);
        setFilterPaymentStatus(ALL);
        setFilterPaymentMethod(ALL);
        setFilterCustomer('');
        setFilterCashShift(ALL);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-[#E5D9D1]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Pedidos</span>
                        <div className="p-2 bg-[#F24452]/10 rounded-lg">
                            <History className="h-4 w-4 text-[#F24452]" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-[#262626] tabular-nums">{stats.count}</p>
                    <p className="text-xs text-gray-400 mt-1">
                        {hasActiveFilters ? 'Con filtros aplicados' : 'Total en historial'}
                    </p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-[#E5D9D1]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Facturación</span>
                        <div className="p-2 bg-[#F2EDE4] rounded-lg">
                            <DollarSign className="h-4 w-4 text-[#262626]" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-[#F24452] tabular-nums">
                        {formatCurrency(stats.totalRevenue)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Pedidos pagados (filtrados)</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-[#E5D9D1]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Cobrados</span>
                        <div className="p-2 bg-[#F2EDE4] rounded-lg">
                            <CheckCircle2 className="h-4 w-4 text-[#262626]" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-[#262626] tabular-nums">{stats.paidCount}</p>
                    <p className="text-xs text-gray-400 mt-1">De {stats.count} pedidos visibles</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-[#E5D9D1] overflow-hidden">
                <button
                    type="button"
                    onClick={() => setFiltersOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#FFF9F5] transition-colors"
                >
                    <span className="flex items-center gap-2 text-sm font-semibold text-[#262626]">
                        <Filter className="h-4 w-4 text-[#F24452]" />
                        Filtros
                        {hasActiveFilters && (
                            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-[#F24452]/10 text-[#F24452]">
                                Activos
                            </span>
                        )}
                    </span>
                    {filtersOpen ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                </button>

                {filtersOpen && (
                    <div className="px-4 pb-4 space-y-4 border-t border-[#F2EDE4]">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="filterDateFrom" className="text-xs text-gray-500">
                                    Desde
                                </Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <Input
                                        id="filterDateFrom"
                                        type="date"
                                        value={filterDateFrom}
                                        onChange={(e) => setFilterDateFrom(e.target.value)}
                                        className="pl-10 h-11 bg-[#F2EDE4] border-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="filterDateTo" className="text-xs text-gray-500">
                                    Hasta
                                </Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <Input
                                        id="filterDateTo"
                                        type="date"
                                        value={filterDateTo}
                                        onChange={(e) => setFilterDateTo(e.target.value)}
                                        className="pl-10 h-11 bg-[#F2EDE4] border-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="filterCustomer" className="text-xs text-gray-500">
                                    Cliente
                                </Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        id="filterCustomer"
                                        placeholder="Nombre..."
                                        value={filterCustomer}
                                        onChange={(e) => setFilterCustomer(e.target.value)}
                                        className="pl-10 h-11 bg-[#F2EDE4] border-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="filterCashShift" className="text-xs text-gray-500">
                                    Caja
                                </Label>
                                <Select
                                    value={filterCashShift === ALL ? ALL : String(filterCashShift)}
                                    onValueChange={(value) =>
                                        setFilterCashShift(value === ALL ? ALL : Number(value))
                                    }
                                >
                                    <SelectTrigger className="h-11 bg-[#F2EDE4] border-none">
                                        <SelectValue placeholder="Todas" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#F2EDE4] border border-[#E5D9D1] max-h-[260px]">
                                        <SelectItem value={ALL}>Todas las cajas</SelectItem>
                                        {cashShifts.map((cs) => {
                                            const openDate = formatDateAR(cs.startDate, {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                            });
                                            return (
                                                <SelectItem key={cs.id} value={String(cs.id)}>
                                                    #{cs.id} · {openDate}
                                                    {!cs.endDate ? ' (abierta)' : ''}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-gray-500">Estado pedido</Label>
                                <Select
                                    value={filterOrderStatus}
                                    onValueChange={(v) =>
                                        setFilterOrderStatus(v as OrderStatus | typeof ALL)
                                    }
                                >
                                    <SelectTrigger className="h-11 bg-[#F2EDE4] border-none">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#F2EDE4] border border-[#E5D9D1]">
                                        <SelectItem value={ALL}>Todos</SelectItem>
                                        <SelectItem value="PENDING">Pendiente</SelectItem>
                                        <SelectItem value="PREPARING">En preparación</SelectItem>
                                        <SelectItem value="READY">Listo</SelectItem>
                                        <SelectItem value="DELIVERED">Entregado</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-gray-500">Estado pago</Label>
                                <Select
                                    value={filterPaymentStatus}
                                    onValueChange={(v) =>
                                        setFilterPaymentStatus(v as PaymentStatus | typeof ALL)
                                    }
                                >
                                    <SelectTrigger className="h-11 bg-[#F2EDE4] border-none">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#F2EDE4] border border-[#E5D9D1]">
                                        <SelectItem value={ALL}>Todos</SelectItem>
                                        <SelectItem value="PENDING">Pendiente</SelectItem>
                                        <SelectItem value="PAID">Pagado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-gray-500">Método de pago</Label>
                                <Select
                                    value={filterPaymentMethod}
                                    onValueChange={(v) =>
                                        setFilterPaymentMethod(v as PaymentMethod | typeof ALL)
                                    }
                                >
                                    <SelectTrigger className="h-11 bg-[#F2EDE4] border-none">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#F2EDE4] border border-[#E5D9D1]">
                                        <SelectItem value={ALL}>Todos</SelectItem>
                                        <SelectItem value="CASH">Efectivo</SelectItem>
                                        <SelectItem value="CARD">Tarjeta</SelectItem>
                                        <SelectItem value="TRANSFER">Transferencia</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                {hasActiveFilters && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleClearFilters}
                                        className="w-full border-[#E5D9D1] hover:bg-[#F2EDE4]"
                                    >
                                        <FilterX className="w-4 h-4 mr-2" />
                                        Limpiar filtros
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-[#E5D9D1] overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center gap-3 py-16 text-gray-500">
                        <Loader2 className="h-8 w-8 animate-spin text-[#F24452]" />
                        <span className="text-sm">Cargando pedidos...</span>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-16 text-center max-w-sm mx-auto">
                        <History className="h-10 w-10 text-[#E5D9D1]" />
                        <p className="text-sm font-medium text-[#262626]">
                            {orders.length === 0
                                ? 'Todavía no hay pedidos'
                                : 'Ningún pedido coincide con los filtros'}
                        </p>
                        {hasActiveFilters && orders.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClearFilters}
                                className="mt-1 border-[#E5D9D1]"
                            >
                                Limpiar filtros
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                    <div className="md:hidden space-y-3 p-3">
                        {filteredOrders.map((order) => {
                            const orderCashShift = cashShifts.find((cs) => cs.id === order.cashShiftId);
                            const orderTimeDisplay = formatTimeAR(order.createdAt);
                            const dateDisplay = orderCashShift
                                ? formatDateAR(orderCashShift.startDate, {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                  })
                                : formatDateAR(order.createdAt, {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                  });
                            const totalValue =
                                typeof order.total === 'number' ? order.total : Number(order.total);

                            return (
                                <article
                                    key={order.id}
                                    className="rounded-xl border border-[#E5D9D1] bg-white p-4 space-y-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-semibold text-[#262626]">Pedido #{order.id}</p>
                                            <p className="text-xs text-gray-500">
                                                Caja {order.cashShiftId ?? '—'} · {dateDisplay} {orderTimeDisplay}
                                            </p>
                                        </div>
                                        <p className="text-lg font-bold text-[#262626] tabular-nums">
                                            {formatCurrency(Number.isFinite(totalValue) ? totalValue : 0)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge className={`${OrderStatusColors[order.orderStatus]} border text-xs`}>
                                            {OrderStatusLabels[order.orderStatus]}
                                        </Badge>
                                        <Badge className={order.paymentStatus === 'PAID' ? 'bg-emerald-500/90 text-white border-0 text-xs' : 'bg-[#F24452]/90 text-white border-0 text-xs'}>
                                            {PaymentStatusLabels[order.paymentStatus]}
                                        </Badge>
                                        <span className="text-xs text-gray-600">
                                            {order.paymentMethod
                                                ? PaymentMethodLabels[order.paymentMethod]
                                                : 'Sin método'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700">
                                        {order.customerName || <span className="text-gray-400 italic">Sin cliente</span>}
                                    </p>
                                </article>
                            );
                        })}
                    </div>

                    <div className="overflow-x-auto hidden md:block">
                        <Table>
                            <TableHeader className="bg-gradient-to-r from-[#F2EDE4] to-[#F8F4F0]">
                                <TableRow className="border-b border-[#E5D9D1] hover:bg-transparent">
                                    <TableHead className="font-semibold text-[#262626]">#</TableHead>
                                    <TableHead className="font-semibold text-[#262626]">Caja</TableHead>
                                    <TableHead className="font-semibold text-[#262626]">Fecha</TableHead>
                                    <TableHead className="font-semibold text-[#262626]">Cliente</TableHead>
                                    <TableHead className="font-semibold text-[#262626]">Estado</TableHead>
                                    <TableHead className="font-semibold text-[#262626]">Pago</TableHead>
                                    <TableHead className="font-semibold text-[#262626] hidden md:table-cell">
                                        Método
                                    </TableHead>
                                    <TableHead className="text-right font-semibold text-[#262626]">
                                        Total
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.map((order) => {
                                    const orderCashShift = cashShifts.find(
                                        (cs) => cs.id === order.cashShiftId
                                    );
                                    const orderTimeDisplay = formatTimeAR(order.createdAt);
                                    const dateDisplay = orderCashShift
                                        ? formatDateAR(orderCashShift.startDate, {
                                              day: '2-digit',
                                              month: 'short',
                                              year: 'numeric',
                                          })
                                        : formatDateAR(order.createdAt, {
                                              day: '2-digit',
                                              month: 'short',
                                              year: 'numeric',
                                          });
                                    const totalValue =
                                        typeof order.total === 'number'
                                            ? order.total
                                            : Number(order.total);

                                    return (
                                        <TableRow
                                            key={order.id}
                                            className="border-b border-[#F2EDE4] hover:bg-[#FFF9F5]"
                                        >
                                            <TableCell className="font-medium text-[#262626]">
                                                #{order.id}
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                                                    <Wallet className="h-3 w-3 text-[#F24452]" />
                                                    {order.cashShiftId ?? '—'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-[#262626]">
                                                        {dateDisplay}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {orderTimeDisplay}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-600 max-w-[140px] truncate">
                                                {order.customerName || (
                                                    <span className="text-gray-400 italic">
                                                        Sin cliente
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={`${OrderStatusColors[order.orderStatus]} border text-xs`}
                                                >
                                                    {OrderStatusLabels[order.orderStatus]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {order.paymentStatus === 'PAID' ? (
                                                    <Badge className="bg-emerald-500/90 text-white border-0 text-xs">
                                                        {PaymentStatusLabels[order.paymentStatus]}
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-[#F24452]/90 text-white border-0 text-xs">
                                                        {PaymentStatusLabels[order.paymentStatus]}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell text-sm text-gray-600">
                                                {order.paymentMethod
                                                    ? PaymentMethodLabels[order.paymentMethod]
                                                    : '—'}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-[#262626] tabular-nums">
                                                {formatCurrency(
                                                    Number.isFinite(totalValue) ? totalValue : 0
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                    </>
                )}
            </div>
        </div>
    );
}

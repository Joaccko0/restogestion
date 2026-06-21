/**
 * Estadísticas — ventas, gastos, balance y categorías
 * Integra cierres de caja con resumen manual opcional
 */

import { useMemo, useState } from 'react';
import {
    RefreshCw,
    TrendingUp,
    Receipt,
    Wallet,
    BarChart3,
    Clock,
    Loader2,
    ClipboardList,
    type LucideIcon,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { useOrdersHistoric } from '../hooks/useOrdersHistoric';
import { useExpenses } from '../hooks/useExpenses';
import type { PaymentMethod } from '../types/order.types';
import { PaymentMethodLabels } from '../types/order.types';
import type { CashShiftResponse } from '../types/cashshift.types';
import { useMenuCategories } from '../hooks/useMenuCategories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '../lib/utils';
import { getOrderPaymentBreakdown } from '../lib/orderPayments';

const PIE_COLORS = ['#F24452', '#262626', '#8B7355', '#C4A882', '#E5D9D1', '#F2A444', '#6B7280'];

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

const toDateStart = (dateString: string) => {
    if (!dateString) return null;
    const [y, m, d] = dateString.split('-').map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
};

const toDateEnd = (dateString: string) => {
    if (!dateString) return null;
    const [y, m, d] = dateString.split('-').map(Number);
    return new Date(y, m - 1, d, 23, 59, 59, 999);
};

function shiftInRange(shift: CashShiftResponse, start: Date | null, end: Date | null) {
    const ref = shift.endDate || shift.startDate;
    const d = new Date(ref);
    if (Number.isNaN(d.getTime())) return false;
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
}

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
        x: cx + radius * Math.cos(angleInRadians),
        y: cy + radius * Math.sin(angleInRadians),
    };
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(cx, cy, radius, endAngle);
    const end = polarToCartesian(cx, cy, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

function PieChart({
    data,
    valueFormatter,
}: {
    data: { label: string; value: number }[];
    valueFormatter?: (v: number) => string;
}) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const fmt = valueFormatter ?? ((v: number) => String(v));

    if (!total) {
        return (
            <div className="flex items-center justify-center h-48 text-sm text-gray-500">
                Sin datos para graficar
            </div>
        );
    }

    let cumulative = 0;

    return (
        <div className="flex flex-col md:flex-row gap-6 items-center">
            <svg viewBox="0 0 200 200" className="w-52 h-52 shrink-0">
                {data.map((slice, index) => {
                    const startAngle = (cumulative / total) * 360;
                    cumulative += slice.value;
                    const endAngle = (cumulative / total) * 360;
                    return (
                        <path
                            key={slice.label}
                            d={describeArc(100, 100, 80, startAngle, endAngle)}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                            stroke="#fff"
                            strokeWidth="2"
                        />
                    );
                })}
            </svg>
            <div className="space-y-2 w-full min-w-0">
                {data.map((slice, index) => {
                    const percent = slice.value / total;
                    return (
                        <div key={slice.label} className="flex items-center justify-between text-sm gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <span
                                    className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                                />
                                <span className="text-gray-700 truncate">{slice.label}</span>
                            </div>
                            <div className="text-gray-500 shrink-0 tabular-nums text-right">
                                {fmt(slice.value)} · {formatPercent(percent)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function HourlyTrend({ counts }: { counts: number[] }) {
    const max = Math.max(...counts, 0);
    const labels = new Set([0, 4, 8, 12, 16, 20]);

    if (max === 0) {
        return (
            <div className="flex items-center justify-center h-40 text-sm text-gray-500">
                Sin pedidos en el rango
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div
                className="grid gap-0.5 h-40 items-end"
                style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}
            >
                {counts.map((count, hour) => {
                    const heightPercent =
                        count > 0 ? Math.max(8, Math.round((count / max) * 100)) : 0;
                    return (
                        <div
                            key={hour}
                            className="flex flex-col items-center justify-end h-full group relative"
                            title={`${hour}h — ${count} pedidos`}
                        >
                            {count > 0 && (
                                <div
                                    className="w-full rounded-t bg-[#F24452] group-hover:bg-[#F24452]/70 transition-colors"
                                    style={{ height: `${heightPercent}%` }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
            <div
                className="grid gap-0.5"
                style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}
            >
                {counts.map((_, hour) => (
                    <div key={hour} className="flex justify-center">
                        {labels.has(hour) && (
                            <span className="text-[9px] text-gray-500">{hour}h</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function StatsPage() {
    const { currentBusiness } = useBusiness();
    const { orders, cashShifts, loading, loadOrdersHistoric } = useOrdersHistoric(
        currentBusiness?.id
    );
    const { expenses } = useExpenses(currentBusiness?.id || null);
    const { labelByCode } = useMenuCategories(currentBusiness?.id || null);

    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');

    const dateStart = toDateStart(filterDateFrom);
    const dateEnd = toDateEnd(filterDateTo);

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const d = new Date(order.createdAt);
            if (Number.isNaN(d.getTime())) return false;
            if (dateStart && d < dateStart) return false;
            if (dateEnd && d > dateEnd) return false;
            return true;
        });
    }, [orders, filterDateFrom, filterDateTo]);

    const filteredShifts = useMemo(() => {
        return cashShifts.filter((s) => shiftInRange(s, dateStart, dateEnd));
    }, [cashShifts, filterDateFrom, filterDateTo]);

    const filteredExpenses = useMemo(() => {
        return expenses.filter((expense) => {
            const d = new Date(expense.date);
            if (Number.isNaN(d.getTime())) return false;
            if (dateStart && d < dateStart) return false;
            if (dateEnd && d > dateEnd) return false;
            return true;
        });
    }, [expenses, filterDateFrom, filterDateTo]);

    const stats = useMemo(() => {
        const manualShiftIds = new Set(
            filteredShifts
                .filter((s) => s.manualTotalCollected != null)
                .map((s) => s.id)
        );
        const manualShiftCount = manualShiftIds.size;

        const nonCancelled = filteredOrders.filter((o) => o.orderStatus !== 'CANCELLED');
        const paidOrders = nonCancelled.filter((o) => o.paymentStatus === 'PAID');
        const systemPaidOrders = paidOrders.filter(
            (o) => !manualShiftIds.has(o.cashShiftId ?? -1)
        );

        const orderRevenue = systemPaidOrders.reduce(
            (sum, o) => sum + (Number(o.total) || 0),
            0
        );
        const manualRevenue = filteredShifts
            .filter((s) => s.manualTotalCollected != null)
            .reduce((sum, s) => sum + (s.manualTotalCollected ?? 0), 0);
        const totalRevenue = orderRevenue + manualRevenue;

        const deliveryFeesTotal = systemPaidOrders.reduce(
            (sum, o) => sum + (Number(o.deliveryFee) || 0),
            0
        );

        const paidOrdersCount = paidOrders.length;
        const avgTicket = paidOrdersCount ? totalRevenue / paidOrdersCount : 0;

        const paymentTotals: Record<PaymentMethod, { amount: number; count: number }> = {
            CASH: { amount: 0, count: 0 },
            CARD: { amount: 0, count: 0 },
            TRANSFER: { amount: 0, count: 0 },
        };
        systemPaidOrders.forEach((order) => {
            const breakdown = getOrderPaymentBreakdown(order);
            (['CASH', 'CARD', 'TRANSFER'] as PaymentMethod[]).forEach((method) => {
                const amount = breakdown[method];
                if (amount > 0) {
                    paymentTotals[method].amount += amount;
                    paymentTotals[method].count += 1;
                }
            });
        });

        const itemsMap = new Map<string, { label: string; quantity: number; revenue: number }>();
        systemPaidOrders.forEach((order) => {
            order.items.forEach((item) => {
                const label = item.name || 'Sin nombre';
                const current = itemsMap.get(label) || { label, quantity: 0, revenue: 0 };
                current.quantity += item.quantity || 0;
                current.revenue += Number(item.subtotal) || 0;
                itemsMap.set(label, current);
            });
        });

        const categoryTotals = new Map<string, number>();
        systemPaidOrders.forEach((order) => {
            order.items.forEach((item) => {
                const cat = item.category || 'OTROS';
                const label = labelByCode[cat] || cat;
                categoryTotals.set(label, (categoryTotals.get(label) || 0) + Number(item.subtotal));
            });
            if (order.deliveryFee && order.deliveryFee > 0) {
                categoryTotals.set(
                    'Envíos',
                    (categoryTotals.get('Envíos') || 0) + order.deliveryFee
                );
            }
        });
        filteredShifts.forEach((shift) => {
            shift.categorySales?.forEach((cs) => {
                const label = labelByCode[cs.category] || cs.category;
                categoryTotals.set(label, (categoryTotals.get(label) || 0) + cs.amount);
            });
        });

        const categoryPieData = Array.from(categoryTotals.entries())
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value);

        const items = Array.from(itemsMap.values()).sort((a, b) => b.quantity - a.quantity);
        const productPieData = (() => {
            const top = items.slice(0, 6);
            const rest = items.slice(6);
            const restTotal = rest.reduce((sum, i) => sum + i.quantity, 0);
            const data = top.map((i) => ({ label: i.label, value: i.quantity }));
            if (restTotal > 0) data.push({ label: 'Otros', value: restTotal });
            return data;
        })();

        const hourCounts = new Array(24).fill(0);
        nonCancelled
            .filter((o) => !manualShiftIds.has(o.cashShiftId ?? -1))
            .forEach((order) => {
                const d = new Date(order.createdAt);
                if (!Number.isNaN(d.getTime())) hourCounts[d.getHours()] += 1;
            });

        return {
            totalRevenue,
            orderRevenue,
            manualRevenue,
            manualShiftCount,
            deliveryFeesTotal,
            totalOrders: filteredOrders.length,
            paidOrdersCount,
            cancelledCount: filteredOrders.filter((o) => o.orderStatus === 'CANCELLED').length,
            avgTicket,
            paymentTotals,
            items,
            productPieData,
            categoryPieData,
            hourCounts,
        };
    }, [filteredOrders, filteredShifts, labelByCode]);

    const expenseStats = useMemo(() => {
        const totalExpenses = filteredExpenses.reduce(
            (sum, e) => sum + (Number(e.total) || 0),
            0
        );
        const supplierTotals = new Map<string, number>();
        filteredExpenses.forEach((expense) => {
            const supplier = expense.supplierName || 'Sin proveedor';
            supplierTotals.set(supplier, (supplierTotals.get(supplier) || 0) + Number(expense.total));
        });
        const topSuppliers = Array.from(supplierTotals.entries())
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);

        return {
            totalExpenses,
            expenseCount: filteredExpenses.length,
            avgExpense: filteredExpenses.length ? totalExpenses / filteredExpenses.length : 0,
            topSuppliers,
        };
    }, [filteredExpenses]);

    const netIncome = stats.totalRevenue - expenseStats.totalExpenses;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#262626] flex items-center gap-2">
                        <BarChart3 className="h-7 w-7 text-[#F24452]" />
                        Estadísticas
                    </h2>
                    <p className="text-gray-500 mt-0.5">
                        Ventas, gastos y balance de tu negocio
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void loadOrdersHistoric()}
                    disabled={loading}
                    className="border-[#E5D9D1] shrink-0 self-start"
                >
                    <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </Button>
            </div>

            <Card className="bg-white border-[#E5D9D1]">
                <CardContent className="pt-5 pb-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label htmlFor="statsFrom">Desde</Label>
                            <Input
                                id="statsFrom"
                                type="date"
                                value={filterDateFrom}
                                onChange={(e) => setFilterDateFrom(e.target.value)}
                                className="bg-[#F2EDE4] border-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="statsTo">Hasta</Label>
                            <Input
                                id="statsTo"
                                type="date"
                                value={filterDateTo}
                                onChange={(e) => setFilterDateTo(e.target.value)}
                                className="bg-[#F2EDE4] border-none"
                            />
                        </div>
                        {(filterDateFrom || filterDateTo) && (
                            <Button
                                variant="outline"
                                className="border-[#E5D9D1]"
                                onClick={() => {
                                    setFilterDateFrom('');
                                    setFilterDateTo('');
                                }}
                            >
                                Limpiar fechas
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {loading && orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                    <Loader2 className="h-10 w-10 animate-spin text-[#F24452] mb-3" />
                    Cargando estadísticas...
                </div>
            ) : (
                <>
                    {stats.manualShiftCount > 0 && (
                        <div className="flex items-start gap-3 p-4 rounded-xl border border-[#E5D9D1] bg-[#F2EDE4]/40">
                            <ClipboardList className="h-5 w-5 text-[#F24452] shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-semibold text-[#262626]">
                                    {stats.manualShiftCount} turno
                                    {stats.manualShiftCount > 1 ? 's' : ''} con resumen manual
                                </p>
                                <p className="text-gray-600 mt-0.5">
                                    {formatCurrency(stats.manualRevenue)} provienen de cierres de
                                    caja cargados a mano. Las ventas por categoría incluyen esos
                                    datos.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            icon={TrendingUp}
                            title="Ventas totales"
                            value={formatCurrency(stats.totalRevenue)}
                            subtitle={`${stats.paidOrdersCount} pedidos cobrados`}
                        />
                        <StatCard
                            icon={Receipt}
                            title="Ticket promedio"
                            value={formatCurrency(stats.avgTicket)}
                            subtitle={`${stats.totalOrders} pedidos en rango`}
                        />
                        <StatCard
                            icon={Wallet}
                            title="Gastos"
                            value={formatCurrency(expenseStats.totalExpenses)}
                            subtitle={`${expenseStats.expenseCount} registros`}
                            accent="expense"
                        />
                        <StatCard
                            icon={BarChart3}
                            title="Balance neto"
                            value={formatCurrency(netIncome)}
                            subtitle="Ingresos − gastos"
                            accent={netIncome >= 0 ? 'positive' : 'negative'}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="bg-white border-[#E5D9D1]">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-semibold">
                                    Ventas por categoría
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <PieChart
                                    data={stats.categoryPieData}
                                    valueFormatter={(v) => formatCurrency(v)}
                                />
                            </CardContent>
                        </Card>

                        <Card className="bg-white border-[#E5D9D1]">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-semibold">
                                    Medios de pago
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {Object.entries(stats.paymentTotals).map(([method, data]) => {
                                    const pct = stats.orderRevenue
                                        ? data.amount / stats.orderRevenue
                                        : 0;
                                    return (
                                        <div
                                            key={method}
                                            className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-0"
                                        >
                                            <div>
                                                <p className="font-medium text-gray-700">
                                                    {PaymentMethodLabels[method as PaymentMethod]}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {data.count} pedidos (sistema)
                                                </p>
                                            </div>
                                            <div className="text-right tabular-nums">
                                                <p className="font-semibold">
                                                    {formatCurrency(data.amount)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatPercent(pct)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                {stats.orderRevenue === 0 && stats.manualRevenue === 0 && (
                                    <p className="text-sm text-gray-500">Sin ventas en el rango.</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="bg-white border-[#E5D9D1]">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-[#F24452]" />
                                    Pedidos por hora
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <HourlyTrend counts={stats.hourCounts} />
                            </CardContent>
                        </Card>

                        <Card className="bg-white border-[#E5D9D1]">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-semibold">
                                    Top productos
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <PieChart data={stats.productPieData} />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="bg-white border-[#E5D9D1]">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-semibold">
                                    Detalle top ventas
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {stats.items.slice(0, 8).map((item, i) => (
                                    <div
                                        key={item.label}
                                        className="flex justify-between text-sm border-b border-gray-50 pb-2"
                                    >
                                        <span className="text-gray-700 truncate pr-2">
                                            <span className="text-gray-400 mr-1.5">#{i + 1}</span>
                                            {item.label}
                                        </span>
                                        <span className="shrink-0 tabular-nums font-medium">
                                            {item.quantity} · {formatCurrency(item.revenue)}
                                        </span>
                                    </div>
                                ))}
                                {stats.items.length === 0 && (
                                    <p className="text-sm text-gray-500">Sin productos vendidos.</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="bg-white border-[#E5D9D1]">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-semibold">
                                    Top proveedores (gastos)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {expenseStats.topSuppliers.map((s, i) => (
                                    <div
                                        key={s.name}
                                        className="flex justify-between text-sm border-b border-gray-50 pb-2"
                                    >
                                        <span className="text-gray-700">
                                            <span className="text-gray-400 mr-1.5">#{i + 1}</span>
                                            {s.name}
                                        </span>
                                        <span className="font-semibold text-[#F24452] tabular-nums">
                                            {formatCurrency(s.total)}
                                        </span>
                                    </div>
                                ))}
                                {expenseStats.topSuppliers.length === 0 && (
                                    <p className="text-sm text-gray-500">Sin gastos en el rango.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="text-xs text-gray-500 space-y-1 px-1">
                        <p>
                            • Ventas del sistema: pedidos pagados y no cancelados (excluye turnos
                            con resumen manual).
                        </p>
                        <p>
                            • Resumen manual: se carga al cerrar caja. Reemplaza ingresos de ese
                            turno y alimenta el gráfico por categoría.
                        </p>
                        <p>
                            • El costo de delivery se incluye en el total del pedido
                            {stats.deliveryFeesTotal > 0 &&
                                ` (${formatCurrency(stats.deliveryFeesTotal)} en envíos en el rango)`}
                            .
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}

function StatCard({
    icon: Icon,
    title,
    value,
    subtitle,
    accent = 'default',
}: {
    icon: LucideIcon;
    title: string;
    value: string;
    subtitle?: string;
    accent?: 'default' | 'expense' | 'positive' | 'negative';
}) {
    const valueColor = {
        default: 'text-[#262626]',
        expense: 'text-[#F24452]',
        positive: 'text-[#262626]',
        negative: 'text-[#F23D3D]',
    }[accent];

    return (
        <Card className="bg-white border-[#E5D9D1]">
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">{title}</span>
                    <div className="p-1.5 rounded-lg bg-[#F2EDE4]">
                        <Icon className="h-4 w-4 text-[#F24452]" />
                    </div>
                </div>
                <p className={`text-xl font-bold tabular-nums ${valueColor}`}>{value}</p>
                {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
            </CardContent>
        </Card>
    );
}

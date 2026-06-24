import type { ReactNode } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '../lib/utils';
import {
    Edit2,
    Trash2,
    Eye,
    Calendar,
    Loader2,
    Receipt,
    Plus,
    Package,
    Building2,
} from 'lucide-react';
import type { Expense } from '../types/expense.types';

interface ExpenseTableProps {
    expenses: Expense[];
    isLoading: boolean;
    onEdit: (expense: Expense) => void;
    onDelete: (id: number) => void;
    onView: (expense: Expense) => void;
    onCreateFirst?: () => void;
    onGoToSupplies?: () => void;
    hasSupplies?: boolean;
}

function formatDate(dateString: string) {
    const [y, m, d] = dateString.split('T')[0].split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function TableShell({ children }: { children: ReactNode }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5D9D1] overflow-hidden hidden md:block">
            <Table>
                <TableHeader className="bg-gradient-to-r from-[#F2EDE4] to-[#F8F4F0]">
                    <TableRow className="border-b border-[#E5D9D1] hover:bg-transparent">
                        <TableHead className="font-semibold text-[#262626]">Fecha</TableHead>
                        <TableHead className="font-semibold text-[#262626] hidden sm:table-cell">
                            Proveedor
                        </TableHead>
                        <TableHead className="font-semibold text-[#262626]">Detalle</TableHead>
                        <TableHead className="font-semibold text-[#262626] text-right">Total</TableHead>
                        <TableHead className="text-right font-semibold text-[#262626] w-[120px]">
                            Acciones
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>{children}</TableBody>
            </Table>
        </div>
    );
}

export function ExpenseTable({
    expenses,
    isLoading,
    onEdit,
    onDelete,
    onView,
    onCreateFirst,
    onGoToSupplies,
    hasSupplies = true,
}: ExpenseTableProps) {
    if (isLoading) {
        return (
            <TableShell>
                <TableRow>
                    <TableCell colSpan={5} className="py-16">
                        <div className="flex flex-col items-center gap-3 text-gray-500">
                            <Loader2 className="h-8 w-8 animate-spin text-[#F24452]" />
                            <span className="text-sm">Cargando gastos...</span>
                        </div>
                    </TableCell>
                </TableRow>
            </TableShell>
        );
    }

    if (expenses.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-dashed border-[#E5D9D1] py-16 px-6 text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-[#F2EDE4] flex items-center justify-center mb-4">
                    <Receipt className="h-7 w-7 text-[#F24452]" />
                </div>
                <h3 className="font-semibold text-[#262626] mb-1">Sin gastos registrados</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                    {!hasSupplies
                        ? 'Primero creá al menos un insumo en la pestaña Insumos, luego podés registrar tu primer gasto.'
                        : 'Registrá facturas y compras para llevar el control de tus egresos.'}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                    {!hasSupplies && onGoToSupplies && (
                        <Button
                            variant="outline"
                            className="border-[#E5D9D1]"
                            onClick={onGoToSupplies}
                        >
                            <Package className="h-4 w-4 mr-1.5" />
                            Ir a Insumos
                        </Button>
                    )}
                    {onCreateFirst && hasSupplies && (
                        <Button
                            className="bg-[#F24452] hover:bg-[#F23D3D] text-white"
                            onClick={onCreateFirst}
                        >
                            <Plus className="h-4 w-4 mr-1.5" />
                            Registrar primer gasto
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="md:hidden space-y-3">
                {expenses.map((expense) => {
                    const itemCount = expense.items.length;
                    const itemPreview = expense.items
                        .map((item) => item.supplyName || `Insumo #${item.supplyId}`)
                        .join(' · ');

                    return (
                        <article
                            key={expense.id}
                            className="rounded-xl border border-[#E5D9D1] bg-white p-4 shadow-sm space-y-3"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-sm text-gray-600 tabular-nums">{formatDate(expense.date)}</p>
                                    <p className="font-medium truncate">{expense.supplierName || 'Gasto interno'}</p>
                                </div>
                                <p className="text-lg font-bold text-[#F24452] tabular-nums">
                                    {formatCurrency(expense.total)}
                                </p>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">
                                {itemCount === 0 ? 'Sin ítems' : itemPreview}
                            </p>
                            <div className="flex justify-end gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 text-gray-500 hover:text-[#F24452] hover:bg-[#F24452]/10"
                                    onClick={() => onView(expense)}
                                    title="Ver detalle"
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 text-gray-500 hover:text-[#262626] hover:bg-[#F2EDE4]"
                                    onClick={() => onEdit(expense)}
                                    title="Editar"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 text-gray-500 hover:text-[#F23D3D] hover:bg-[#F24452]/10"
                                    onClick={() => onDelete(expense.id)}
                                    title="Eliminar"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </article>
                    );
                })}
            </div>

            <TableShell>
                {expenses.map((expense) => {
                    const itemCount = expense.items.length;
                    const itemPreview = expense.items
                        .map((item) => item.supplyName || `Insumo #${item.supplyId}`)
                        .join(' · ');

                    return (
                        <TableRow
                            key={expense.id}
                            className="hover:bg-[#FFF9F5] transition-colors border-b border-[#E5D9D1]/50 cursor-pointer group"
                            onClick={() => onView(expense)}
                        >
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-[#F24452]/60 shrink-0" />
                                    <span className="tabular-nums">{formatDate(expense.date)}</span>
                                </div>
                                <span className="text-xs text-gray-400 sm:hidden mt-0.5 block truncate max-w-[140px]">
                                    {expense.supplierName || 'Sin proveedor'}
                                </span>
                            </TableCell>

                            <TableCell className="hidden sm:table-cell">
                                {expense.supplierName ? (
                                    <div className="flex items-center gap-1.5">
                                        <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                        <span className="truncate max-w-[160px]">{expense.supplierName}</span>
                                    </div>
                                ) : (
                                    <span className="text-gray-400 text-sm italic">Gasto interno</span>
                                )}
                            </TableCell>

                            <TableCell>
                                <div className="flex items-start gap-2 min-w-0">
                                    {itemCount > 0 && (
                                        <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#F2EDE4] text-[#262626]">
                                            {itemCount}
                                        </span>
                                    )}
                                    <span
                                        className="text-sm text-gray-600 line-clamp-2"
                                        title={itemPreview}
                                    >
                                        {itemCount === 0 ? (
                                            <span className="italic text-gray-400">Sin ítems</span>
                                        ) : (
                                            itemPreview
                                        )}
                                    </span>
                                </div>
                            </TableCell>

                            <TableCell className="text-right font-bold text-[#F24452] tabular-nums">
                                {formatCurrency(expense.total)}
                            </TableCell>

                            <TableCell className="text-right">
                                <div
                                    className="flex justify-end gap-0.5 opacity-80 group-hover:opacity-100"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-500 hover:text-[#F24452] hover:bg-[#F24452]/10"
                                        onClick={() => onView(expense)}
                                        title="Ver detalle"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-500 hover:text-[#262626] hover:bg-[#F2EDE4]"
                                        onClick={() => onEdit(expense)}
                                        title="Editar"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-500 hover:text-[#F23D3D] hover:bg-[#F24452]/10"
                                        onClick={() => onDelete(expense.id)}
                                        title="Eliminar"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableShell>
        </>
    );
}

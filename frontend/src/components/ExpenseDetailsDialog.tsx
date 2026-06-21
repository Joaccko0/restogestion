import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Calendar, Building2, Receipt, DollarSign, Package, Pencil } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import type { Expense } from '../types/expense.types';

interface ExpenseDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    expense: Expense | null;
    onEdit?: (expense: Expense) => void;
}

function formatDate(dateString: string) {
    const [y, m, d] = dateString.split('T')[0].split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export function ExpenseDetailsDialog({
    open,
    onOpenChange,
    expense,
    onEdit,
}: ExpenseDetailsDialogProps) {
    if (!expense) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white max-w-3xl p-0 gap-0 max-h-[90vh] flex flex-col overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#E5D9D1] shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <Receipt className="h-5 w-5 text-[#F24452]" />
                        Gasto #{expense.id}
                        <span className="ml-auto text-sm font-normal text-gray-400">
                            {expense.items.length}{' '}
                            {expense.items.length === 1 ? 'línea' : 'líneas'}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F2EDE4]/50 border border-[#E5D9D1]">
                            <div className="p-2 bg-white rounded-lg border border-[#E5D9D1] shrink-0">
                                <Calendar className="h-4 w-4 text-[#F24452]" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-gray-500 font-medium">Fecha</p>
                                <p className="font-semibold text-sm capitalize truncate">
                                    {formatDate(expense.date)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F2EDE4]/50 border border-[#E5D9D1]">
                            <div className="p-2 bg-white rounded-lg border border-[#E5D9D1] shrink-0">
                                <Building2 className="h-4 w-4 text-[#F24452]" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-gray-500 font-medium">Proveedor</p>
                                <p className="font-semibold text-sm truncate">
                                    {expense.supplierName || (
                                        <span className="text-gray-400 italic font-normal">
                                            Gasto interno
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Package className="h-4 w-4 text-[#F24452]" />
                            <h3 className="font-semibold text-sm">Detalle de líneas</h3>
                        </div>
                        <div className="rounded-xl border border-[#E5D9D1] overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gradient-to-r from-[#F2EDE4] to-[#F8F4F0]">
                                    <TableRow className="border-b border-[#E5D9D1] hover:bg-transparent">
                                        <TableHead className="font-semibold text-xs">Insumo</TableHead>
                                        <TableHead className="font-semibold text-xs text-right">
                                            Cant.
                                        </TableHead>
                                        <TableHead className="font-semibold text-xs text-right hidden sm:table-cell">
                                            P. unit.
                                        </TableHead>
                                        <TableHead className="font-semibold text-xs text-right">
                                            Subtotal
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expense.items.map((item) => (
                                        <TableRow
                                            key={item.id ?? item.supplyId}
                                            className="border-b border-[#E5D9D1]/50 hover:bg-[#FFF9F5]"
                                        >
                                            <TableCell className="font-medium text-sm">
                                                {item.supplyName}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums text-sm">
                                                {item.quantity}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums text-sm hidden sm:table-cell">
                                                {formatCurrency(item.unitPrice)}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-[#F24452] tabular-nums text-sm">
                                                {formatCurrency(item.subtotal)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <div className="flex justify-between items-center p-4 rounded-xl bg-[#F24452]/5 border border-[#F24452]/20">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-[#F24452]" />
                            <span className="font-semibold">Total</span>
                        </div>
                        <span className="text-2xl font-bold text-[#F24452] tabular-nums">
                            {formatCurrency(expense.total)}
                        </span>
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t border-[#E5D9D1] bg-gray-50/50 shrink-0 gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="border-[#E5D9D1]"
                    >
                        Cerrar
                    </Button>
                    {onEdit && (
                        <Button
                            className="bg-[#F24452] hover:bg-[#F23D3D]"
                            onClick={() => onEdit(expense)}
                        >
                            <Pencil className="h-4 w-4 mr-1.5" />
                            Editar gasto
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

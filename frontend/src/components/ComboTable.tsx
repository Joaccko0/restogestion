import type { ReactNode } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Loader2, UtensilsCrossed, Plus, Search } from 'lucide-react';
import type { Combo } from '../types/inventory.types';
import { formatCurrency } from '../lib/utils';

interface ComboTableProps {
    combos: Combo[];
    isLoading: boolean;
    onEdit: (combo: Combo) => void;
    onDelete: (id: number) => void;
    onCreateFirst?: () => void;
    hasSearch?: boolean;
}

function TableShell({ children }: { children: ReactNode }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5D9D1] overflow-hidden">
            <Table>
                <TableHeader className="bg-gradient-to-r from-[#F2EDE4] to-[#F8F4F0]">
                    <TableRow className="border-b border-[#E5D9D1] hover:bg-transparent">
                        <TableHead className="font-semibold text-[#262626]">Combo</TableHead>
                        <TableHead className="font-semibold text-[#262626]">Incluye</TableHead>
                        <TableHead className="font-semibold text-[#262626] text-right">Precio</TableHead>
                        <TableHead className="text-right font-semibold text-[#262626] w-[100px]">
                            Acciones
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>{children}</TableBody>
            </Table>
        </div>
    );
}

export function ComboTable({
    combos,
    isLoading,
    onEdit,
    onDelete,
    onCreateFirst,
    hasSearch = false,
}: ComboTableProps) {
    if (isLoading) {
        return (
            <TableShell>
                <TableRow>
                    <TableCell colSpan={4} className="py-16">
                        <div className="flex flex-col items-center gap-3 text-gray-500">
                            <Loader2 className="h-8 w-8 animate-spin text-[#F24452]" />
                            <span className="text-sm">Cargando combos...</span>
                        </div>
                    </TableCell>
                </TableRow>
            </TableShell>
        );
    }

    if (combos.length === 0) {
        return (
            <TableShell>
                <TableRow>
                    <TableCell colSpan={4} className="py-16">
                        <div className="flex flex-col items-center gap-3 text-center max-w-sm mx-auto">
                            {hasSearch ? (
                                <>
                                    <Search className="h-10 w-10 text-[#E5D9D1]" />
                                    <p className="text-sm font-medium text-[#262626]">
                                        Sin combos que coincidan
                                    </p>
                                </>
                            ) : (
                                <>
                                    <UtensilsCrossed className="h-10 w-10 text-[#E5D9D1]" />
                                    <p className="text-sm font-medium text-[#262626]">
                                        No hay combos promocionales
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Armá packs con varios productos a precio especial
                                    </p>
                                    {onCreateFirst && (
                                        <Button
                                            className="mt-2 bg-[#F24452] hover:bg-[#F23D3D] text-white"
                                            onClick={onCreateFirst}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Nuevo combo
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </TableCell>
                </TableRow>
            </TableShell>
        );
    }

    return (
        <TableShell>
            {combos.map((combo) => (
                <TableRow
                    key={combo.id}
                    className="border-b border-[#F2EDE4] hover:bg-[#FFF9F5] transition-colors"
                >
                    <TableCell className="font-medium text-[#262626]">{combo.name}</TableCell>
                    <TableCell>
                        <div className="flex flex-wrap gap-1">
                            {combo.items.map((item, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex text-xs px-2 py-0.5 rounded-md bg-[#F2EDE4] text-gray-600"
                                >
                                    {item.productName} ×{item.quantity}
                                </span>
                            ))}
                        </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-[#262626] tabular-nums">
                        {formatCurrency(combo.price)}
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500 hover:text-[#262626] hover:bg-[#F2EDE4]"
                                onClick={() => onEdit(combo)}
                            >
                                <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-[#F24452] hover:bg-[#F24452]/10"
                                onClick={() => onDelete(combo.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </TableCell>
                </TableRow>
            ))}
        </TableShell>
    );
}

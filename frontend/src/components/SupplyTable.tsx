import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Loader2, Package, Plus } from 'lucide-react';
import { SupplyCategory } from '@/types/supply.types';
import type { Supply } from '@/types/supply.types';

interface SupplyTableProps {
    supplies: Supply[];
    isLoading?: boolean;
    onEdit: (supply: Supply) => void;
    onDelete: (id: number) => void;
    onCreateFirst?: () => void;
}

const getCategoryLabel = (category: string): string => {
    switch (category) {
        case SupplyCategory.STOCK:
            return 'Stock';
        case SupplyCategory.SERVICE:
            return 'Servicio';
        case SupplyCategory.FIXED_COST:
            return 'Costo fijo';
        default:
            return category;
    }
};

const getCategoryStyle = (category: string): string => {
    switch (category) {
        case SupplyCategory.STOCK:
            return 'bg-[#262626] text-white hover:bg-[#262626]';
        case SupplyCategory.SERVICE:
            return 'bg-[#F24452] text-white hover:bg-[#F24452]';
        case SupplyCategory.FIXED_COST:
            return 'bg-[#8B7355] text-white hover:bg-[#8B7355]';
        default:
            return 'bg-gray-500 text-white';
    }
};

export function SupplyTable({
    supplies,
    isLoading = false,
    onEdit,
    onDelete,
    onCreateFirst,
}: SupplyTableProps) {
    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-[#E5D9D1] py-16 flex flex-col items-center gap-3 text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin text-[#F24452]" />
                <span className="text-sm">Cargando insumos...</span>
            </div>
        );
    }

    if (supplies.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-dashed border-[#E5D9D1] py-16 px-6 text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-[#F2EDE4] flex items-center justify-center mb-4">
                    <Package className="h-7 w-7 text-[#F24452]" />
                </div>
                <h3 className="font-semibold text-[#262626] mb-1">Sin insumos</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                    Los insumos son las partidas de cada gasto: harina, gas, alquiler, etc.
                </p>
                {onCreateFirst && (
                    <Button
                        className="bg-[#F24452] hover:bg-[#F23D3D] text-white"
                        onClick={onCreateFirst}
                    >
                        <Plus className="h-4 w-4 mr-1.5" />
                        Crear insumo
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5D9D1] overflow-hidden">
            <Table>
                <TableHeader className="bg-gradient-to-r from-[#F2EDE4] to-[#F8F4F0]">
                    <TableRow className="border-b border-[#E5D9D1] hover:bg-transparent">
                        <TableHead className="font-semibold text-[#262626]">Nombre</TableHead>
                        <TableHead className="font-semibold text-[#262626]">Categoría</TableHead>
                        <TableHead className="text-right font-semibold text-[#262626] w-[100px]">
                            Acciones
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {supplies.map((supply) => (
                        <TableRow
                            key={supply.id}
                            className="hover:bg-[#FFF9F5] transition-colors border-b border-[#E5D9D1]/50"
                        >
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-[#F24452]/60 shrink-0" />
                                    {supply.name}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge className={getCategoryStyle(supply.category)}>
                                    {getCategoryLabel(supply.category)}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-0.5">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-500 hover:text-[#262626] hover:bg-[#F2EDE4]"
                                        onClick={() => onEdit(supply)}
                                        title="Editar"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-500 hover:text-[#F23D3D] hover:bg-[#F24452]/10"
                                        onClick={() => onDelete(supply.id)}
                                        title="Eliminar"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

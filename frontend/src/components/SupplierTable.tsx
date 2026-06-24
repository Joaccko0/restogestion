import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Loader2, Building2, Plus } from 'lucide-react';
import type { Supplier } from '../types/supplier.types';

interface SupplierTableProps {
    suppliers: Supplier[];
    isLoading: boolean;
    onEdit: (supplier: Supplier) => void;
    onDelete: (id: number) => void;
    onCreateFirst?: () => void;
}

export function SupplierTable({
    suppliers,
    isLoading,
    onEdit,
    onDelete,
    onCreateFirst,
}: SupplierTableProps) {
    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-[#E5D9D1] py-16 flex flex-col items-center gap-3 text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin text-[#F24452]" />
                <span className="text-sm">Cargando proveedores...</span>
            </div>
        );
    }

    if (suppliers.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-dashed border-[#E5D9D1] py-16 px-6 text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-[#F2EDE4] flex items-center justify-center mb-4">
                    <Building2 className="h-7 w-7 text-[#F24452]" />
                </div>
                <h3 className="font-semibold text-[#262626] mb-1">Sin proveedores</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                    Los proveedores son opcionales, pero te ayudan a organizar tus gastos por
                    factura.
                </p>
                {onCreateFirst && (
                    <Button
                        className="bg-[#F24452] hover:bg-[#F23D3D] text-white"
                        onClick={onCreateFirst}
                    >
                        <Plus className="h-4 w-4 mr-1.5" />
                        Crear proveedor
                    </Button>
                )}
            </div>
        );
    }

    return (
        <>
            <div className="md:hidden space-y-3">
                {suppliers.map((supplier) => (
                    <article
                        key={supplier.id}
                        className="rounded-xl border border-[#E5D9D1] bg-white p-4 shadow-sm"
                    >
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-[#F24452]/10 flex items-center justify-center shrink-0">
                                <span className="text-xs font-bold text-[#F24452]">
                                    {supplier.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="min-w-0">
                                <p className="font-medium truncate">{supplier.name}</p>
                                {supplier.contactInfo && (
                                    <p className="text-xs text-gray-500 whitespace-pre-line line-clamp-2">
                                        {supplier.contactInfo}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end gap-1 mt-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 text-gray-500 hover:text-[#262626] hover:bg-[#F2EDE4]"
                                onClick={() => onEdit(supplier)}
                                title="Editar"
                            >
                                <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 text-gray-500 hover:text-[#F23D3D] hover:bg-[#F24452]/10"
                                onClick={() => onDelete(supplier.id)}
                                title="Eliminar"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </article>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-[#E5D9D1] overflow-hidden hidden md:block">
            <Table>
                <TableHeader className="bg-gradient-to-r from-[#F2EDE4] to-[#F8F4F0]">
                    <TableRow className="border-b border-[#E5D9D1] hover:bg-transparent">
                        <TableHead className="font-semibold text-[#262626]">Nombre</TableHead>
                        <TableHead className="font-semibold text-[#262626] hidden md:table-cell">
                            Contacto
                        </TableHead>
                        <TableHead className="text-right font-semibold text-[#262626] w-[100px]">
                            Acciones
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {suppliers.map((supplier) => (
                        <TableRow
                            key={supplier.id}
                            className="hover:bg-[#FFF9F5] transition-colors border-b border-[#E5D9D1]/50"
                        >
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-[#F24452]/10 flex items-center justify-center shrink-0">
                                        <span className="text-xs font-bold text-[#F24452]">
                                            {supplier.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate">{supplier.name}</p>
                                        {supplier.contactInfo && (
                                            <p className="text-xs text-gray-500 truncate md:hidden">
                                                {supplier.contactInfo.split('\n')[0]}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                                {supplier.contactInfo ? (
                                    <span className="text-sm text-gray-600 whitespace-pre-line line-clamp-2">
                                        {supplier.contactInfo}
                                    </span>
                                ) : (
                                    <span className="text-gray-400 text-sm italic">—</span>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-0.5">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-500 hover:text-[#262626] hover:bg-[#F2EDE4]"
                                        onClick={() => onEdit(supplier)}
                                        title="Editar"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-500 hover:text-[#F23D3D] hover:bg-[#F24452]/10"
                                        onClick={() => onDelete(supplier.id)}
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
        </>
    );
}

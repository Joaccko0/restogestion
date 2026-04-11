import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from 'lucide-react';
import type { Supplier } from '../types/supplier.types';

interface SupplierTableProps {
    suppliers: Supplier[];
    isLoading: boolean;
    onEdit: (supplier: Supplier) => void;
    onDelete: (id: number) => void;
}

/**
 * Tabla de proveedores con acciones de editar y eliminar
 */
export function SupplierTable({ suppliers, isLoading, onEdit, onDelete }: SupplierTableProps) {
    
    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border-2 border-[#E5D9D1] overflow-hidden">
                <Table>
                    <TableHeader className="bg-gradient-to-r from-[#F2EDE4] to-[#F8F4F0]">
                        <TableRow className="border-b-2 border-[#E5D9D1]">
                            <TableHead className="font-bold text-[#262626]">Nombre</TableHead>
                            <TableHead className="font-bold text-[#262626]">Información de Contacto</TableHead>
                            <TableHead className="text-right font-bold text-[#262626]">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={3} className="text-center py-8">
                                Cargando proveedores...
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        );
    }

    if (suppliers.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border-2 border-[#E5D9D1] overflow-hidden">
                <Table>
                    <TableHeader className="bg-gradient-to-r from-[#F2EDE4] to-[#F8F4F0]">
                        <TableRow className="border-b-2 border-[#E5D9D1]">
                            <TableHead className="font-bold text-[#262626]">Nombre</TableHead>
                            <TableHead className="font-bold text-[#262626]">Información de Contacto</TableHead>
                            <TableHead className="text-right font-bold text-[#262626]">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                                No hay proveedores registrados.
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border-2 border-[#E5D9D1] overflow-hidden">
            <Table>
                <TableHeader className="bg-gradient-to-r from-[#F2EDE4] to-[#F8F4F0]">
                    <TableRow className="border-b-2 border-[#E5D9D1]">
                        <TableHead className="font-bold text-[#262626]">Nombre</TableHead>
                        <TableHead className="font-bold text-[#262626]">Información de Contacto</TableHead>
                        <TableHead className="text-right font-bold text-[#262626]">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {suppliers.map((supplier) => (
                        <TableRow key={supplier.id} className="hover:bg-[#FFF9F5] transition-colors border-b border-[#E5D9D1]/50">
                            {/* Nombre */}
                            <TableCell className="font-medium">
                                {supplier.name}
                            </TableCell>

                            {/* Contacto */}
                            <TableCell>
                                {supplier.contactInfo ? (
                                    <div className="text-sm text-gray-600 whitespace-pre-line">
                                        {supplier.contactInfo}
                                    </div>
                                ) : (
                                    <span className="text-gray-400 text-sm italic">Sin información de contacto</span>
                                )}
                            </TableCell>

                            {/* Acciones */}
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onEdit(supplier)}
                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onDelete(supplier.id)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
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

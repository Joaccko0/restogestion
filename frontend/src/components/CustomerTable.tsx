import type { ReactNode } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, MapPin, Loader2, Users, Plus, Search } from 'lucide-react';
import type { Customer } from '../types/customer.types';

interface CustomerTableProps {
    customers: Customer[];
    isLoading: boolean;
    onEdit: (customer: Customer) => void;
    onDelete: (id: number) => void;
    onManageAddresses: (customer: Customer) => void;
    onCreateFirst?: () => void;
    hasSearch?: boolean;
}

function TableShell({ children }: { children: ReactNode }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5D9D1] overflow-hidden">
            <Table>
                <TableHeader className="bg-gradient-to-r from-[#F2EDE4] to-[#F8F4F0]">
                    <TableRow className="border-b border-[#E5D9D1] hover:bg-transparent">
                        <TableHead className="font-semibold text-[#262626]">Nombre</TableHead>
                        <TableHead className="font-semibold text-[#262626]">Teléfono</TableHead>
                        <TableHead className="font-semibold text-[#262626]">Direcciones</TableHead>
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

export function CustomerTable({
    customers,
    isLoading,
    onEdit,
    onDelete,
    onManageAddresses,
    onCreateFirst,
    hasSearch = false,
}: CustomerTableProps) {
    if (isLoading) {
        return (
            <TableShell>
                <TableRow>
                    <TableCell colSpan={4} className="py-16">
                        <div className="flex flex-col items-center gap-3 text-gray-500">
                            <Loader2 className="h-8 w-8 animate-spin text-[#F24452]" />
                            <span className="text-sm">Cargando clientes...</span>
                        </div>
                    </TableCell>
                </TableRow>
            </TableShell>
        );
    }

    if (customers.length === 0) {
        return (
            <TableShell>
                <TableRow>
                    <TableCell colSpan={4} className="py-16">
                        <div className="flex flex-col items-center gap-3 text-center max-w-sm mx-auto">
                            {hasSearch ? (
                                <>
                                    <Search className="h-10 w-10 text-[#E5D9D1]" />
                                    <p className="text-sm font-medium text-[#262626]">
                                        Sin resultados para tu búsqueda
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Probá con otro nombre o teléfono
                                    </p>
                                </>
                            ) : (
                                <>
                                    <Users className="h-10 w-10 text-[#E5D9D1]" />
                                    <p className="text-sm font-medium text-[#262626]">
                                        Todavía no hay clientes
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Registrá clientes para agilizar pedidos a domicilio
                                    </p>
                                    {onCreateFirst && (
                                        <Button
                                            className="mt-2 bg-[#F24452] hover:bg-[#F23D3D] text-white"
                                            onClick={onCreateFirst}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Primer cliente
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
            {customers.map((customer) => (
                <TableRow
                    key={customer.id}
                    className="border-b border-[#F2EDE4] hover:bg-[#FFF9F5] transition-colors"
                >
                    <TableCell className="font-medium text-[#262626]">{customer.name}</TableCell>
                    <TableCell className="text-gray-600 tabular-nums">{customer.phone}</TableCell>
                    <TableCell>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onManageAddresses(customer)}
                            className="text-[#F24452] hover:text-[#d93a48] hover:bg-[#F24452]/10 h-8"
                        >
                            <MapPin className="mr-1.5 h-4 w-4" />
                            {customer.addresses.length}{' '}
                            {customer.addresses.length === 1 ? 'dirección' : 'direcciones'}
                        </Button>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEdit(customer)}
                                className="h-8 w-8 text-gray-500 hover:text-[#262626] hover:bg-[#F2EDE4]"
                            >
                                <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDelete(customer.id)}
                                className="h-8 w-8 text-gray-400 hover:text-[#F24452] hover:bg-[#F24452]/10"
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

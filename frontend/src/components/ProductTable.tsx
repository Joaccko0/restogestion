import type { ReactNode } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Loader2, Pizza, Plus, Search } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import type { Product } from '../types/inventory.types';

interface ProductTableProps {
    products: Product[];
    isLoading: boolean;
    onEdit: (product: Product) => void;
    onDelete: (id: number) => void;
    onCreateFirst?: () => void;
    categoryLabels?: Record<string, string>;
    hasSearch?: boolean;
}

function TableShell({ children }: { children: ReactNode }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5D9D1] overflow-hidden hidden md:block">
            <Table>
                <TableHeader className="bg-gradient-to-r from-[#F2EDE4] to-[#F8F4F0]">
                    <TableRow className="border-b border-[#E5D9D1] hover:bg-transparent">
                        <TableHead className="font-semibold text-[#262626]">Producto</TableHead>
                        <TableHead className="font-semibold text-[#262626]">Categoría</TableHead>
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

export function ProductTable({
    products,
    isLoading,
    onEdit,
    onDelete,
    onCreateFirst,
    categoryLabels = {},
    hasSearch = false,
}: ProductTableProps) {
    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-[#E5D9D1] py-16 flex flex-col items-center gap-3 text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin text-[#F24452]" />
                <span className="text-sm">Cargando productos...</span>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-dashed border-[#E5D9D1] py-16 px-6">
                <div className="flex flex-col items-center gap-3 text-center max-w-sm mx-auto">
                    {hasSearch ? (
                        <>
                            <Search className="h-10 w-10 text-[#E5D9D1]" />
                            <p className="text-sm font-medium text-[#262626]">
                                Sin productos que coincidan
                            </p>
                        </>
                    ) : (
                        <>
                            <Pizza className="h-10 w-10 text-[#E5D9D1]" />
                            <p className="text-sm font-medium text-[#262626]">
                                El menú está vacío
                            </p>
                            <p className="text-xs text-gray-400">
                                Creá tu primer producto para empezar a vender
                            </p>
                            {onCreateFirst && (
                                <Button
                                    className="mt-2 bg-[#F24452] hover:bg-[#F23D3D] text-white touch-target"
                                    onClick={onCreateFirst}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nuevo producto
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="md:hidden space-y-3">
                {products.map((product) => (
                    <article
                        key={product.id}
                        className="rounded-xl border border-[#E5D9D1] bg-white p-4 space-y-3 shadow-sm"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="font-semibold text-[#262626] truncate">{product.title}</p>
                                {product.description && (
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                        {product.description}
                                    </p>
                                )}
                            </div>
                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-[#F24452]/10 text-[#F24452]">
                                {categoryLabels[product.category] || product.category}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <p className="text-lg font-bold text-[#262626] tabular-nums">
                                {formatCurrency(product.price)}
                            </p>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 text-gray-500 hover:text-[#262626] hover:bg-[#F2EDE4]"
                                    onClick={() => onEdit(product)}
                                >
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 text-gray-400 hover:text-[#F24452] hover:bg-[#F24452]/10"
                                    onClick={() => onDelete(product.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            <TableShell>
                {products.map((product) => (
                    <TableRow
                        key={product.id}
                        className="border-b border-[#F2EDE4] hover:bg-[#FFF9F5] transition-colors"
                    >
                        <TableCell>
                            <div className="font-medium text-[#262626]">{product.title}</div>
                            {product.description && (
                                <div className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                                    {product.description}
                                </div>
                            )}
                        </TableCell>
                        <TableCell>
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F24452]/10 text-[#F24452]">
                                {categoryLabels[product.category] || product.category}
                            </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-[#262626] tabular-nums">
                            {formatCurrency(product.price)}
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-500 hover:text-[#262626] hover:bg-[#F2EDE4]"
                                    onClick={() => onEdit(product)}
                                >
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-400 hover:text-[#F24452] hover:bg-[#F24452]/10"
                                    onClick={() => onDelete(product.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableShell>
        </>
    );
}

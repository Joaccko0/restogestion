import { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, ShoppingCart, DollarSign, Package, Hash, AlertCircle } from 'lucide-react';
import type { Expense, ExpenseRequest, ExpenseItemRequest } from '../types/expense.types';
import type { Supplier } from '../types/supplier.types';
import type { Supply } from '../types/supply.types';
import { SupplyCategory } from '../types/supply.types';
import { toast } from 'sonner';
import { formatCurrency } from '../lib/utils';

interface ExpenseFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (expense: ExpenseRequest) => Promise<boolean>;
    editingExpense?: Expense;
    suppliers: Supplier[];
    supplies: Supply[];
    onCreateSupply?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
    [SupplyCategory.STOCK]: 'Stock / Producción',
    [SupplyCategory.SERVICE]: 'Servicios',
    [SupplyCategory.FIXED_COST]: 'Costos fijos',
};

export function ExpenseForm({
    open,
    onOpenChange,
    onSubmit,
    editingExpense,
    suppliers,
    supplies,
    onCreateSupply,
}: ExpenseFormProps) {
    const [supplierId, setSupplierId] = useState<number | undefined>(undefined);
    const [date, setDate] = useState('');
    const [items, setItems] = useState<ExpenseItemRequest[]>([]);

    const [newItemSupplyId, setNewItemSupplyId] = useState<number | null>(null);
    const [newItemQuantity, setNewItemQuantity] = useState('');
    const [newItemUnitPrice, setNewItemUnitPrice] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    const suppliesByCategory = useMemo(() => {
        const groups: Record<string, Supply[]> = {};
        for (const supply of supplies) {
            const cat = supply.category || SupplyCategory.SERVICE;
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(supply);
        }
        return groups;
    }, [supplies]);

    useEffect(() => {
        if (editingExpense && open) {
            setSupplierId(editingExpense.supplierId);
            setDate(editingExpense.date.split('T')[0]);
            setItems(
                editingExpense.items.map((item) => ({
                    supplyId: item.supplyId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                }))
            );
        } else if (open) {
            setSupplierId(undefined);
            setDate(new Date().toISOString().split('T')[0]);
            setItems([]);
        }
        setNewItemSupplyId(null);
        setNewItemQuantity('');
        setNewItemUnitPrice('');
    }, [open, editingExpense]);

    const handleAddItem = () => {
        if (!newItemSupplyId) {
            toast.error('Seleccioná un insumo');
            return;
        }
        const quantity = parseInt(newItemQuantity, 10);
        const unitPrice = parseFloat(newItemUnitPrice);

        if (!quantity || quantity <= 0) {
            toast.error('La cantidad debe ser mayor a cero');
            return;
        }
        if (!unitPrice || unitPrice <= 0) {
            toast.error('El precio debe ser mayor a cero');
            return;
        }
        if (items.some((item) => item.supplyId === newItemSupplyId)) {
            toast.error('Este insumo ya está en la lista');
            return;
        }

        setItems([...items, { supplyId: newItemSupplyId, quantity, unitPrice }]);
        setNewItemSupplyId(null);
        setNewItemQuantity('');
        setNewItemUnitPrice('');
    };

    const handleUpdateItem = (
        index: number,
        field: 'quantity' | 'unitPrice',
        value: string
    ) => {
        const updated = [...items];
        if (field === 'quantity') {
            const qty = parseInt(value, 10);
            if (!qty || qty <= 0) return;
            updated[index] = { ...updated[index], quantity: qty };
        } else {
            const price = parseFloat(value);
            if (!price || price <= 0) return;
            updated[index] = { ...updated[index], unitPrice: price };
        }
        setItems(updated);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const calculateTotal = () =>
        items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    const handleSubmit = async () => {
        if (items.length === 0) {
            toast.error('Agregá al menos un ítem al gasto');
            return;
        }
        if (!date) {
            toast.error('La fecha es obligatoria');
            return;
        }

        setIsSubmitting(true);
        const success = await onSubmit({ supplierId, date, items });
        setIsSubmitting(false);
        if (success) onOpenChange(false);
    };

    const getSupplyName = (supplyId: number) =>
        supplies.find((s) => s.id === supplyId)?.name || 'Insumo desconocido';

    const isEditMode = !!editingExpense;
    const total = calculateTotal();
    const noSupplies = supplies.length === 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#E5D9D1]">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <ShoppingCart className="h-5 w-5 text-[#F24452]" />
                        {isEditMode ? `Editar gasto #${editingExpense!.id}` : 'Registrar nuevo gasto'}
                    </DialogTitle>
                </DialogHeader>

                <div className="px-6 py-5 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="supplier" className="text-sm text-gray-600">
                                Proveedor <span className="text-gray-400">(opcional)</span>
                            </Label>
                            <Select
                                value={supplierId?.toString() || 'none'}
                                onValueChange={(value) =>
                                    setSupplierId(value === 'none' ? undefined : parseInt(value, 10))
                                }
                            >
                                <SelectTrigger className="h-10 w-full bg-[#F2EDE4] border-[#E5D9D1]">
                                    <SelectValue placeholder="Seleccionar proveedor..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem value="none">Sin proveedor (gasto interno)</SelectItem>
                                    {suppliers.map((supplier) => (
                                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                            {supplier.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="date" className="text-sm text-gray-600">
                                Fecha *
                            </Label>
                            <Input
                                type="date"
                                id="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                                className="h-10 bg-[#F2EDE4] border-[#E5D9D1] focus-visible:ring-[#F24452]/30"
                            />
                        </div>
                    </div>

                    <div className="rounded-xl border border-[#E5D9D1] bg-[#F2EDE4]/30 overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E5D9D1] bg-white/60">
                            <Package className="h-4 w-4 text-[#F24452]" />
                            <span className="font-semibold text-sm">Líneas del gasto</span>
                            {items.length > 0 && (
                                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[#F24452] text-white font-medium">
                                    {items.length}
                                </span>
                            )}
                        </div>

                        {noSupplies ? (
                            <div className="p-8 text-center">
                                <AlertCircle className="h-8 w-8 text-[#F24452] mx-auto mb-3" />
                                <p className="font-medium text-[#262626] mb-1">
                                    No hay insumos cargados
                                </p>
                                <p className="text-sm text-gray-500 mb-4">
                                    Creá al menos un insumo antes de registrar un gasto.
                                </p>
                                {onCreateSupply && (
                                    <Button
                                        type="button"
                                        className="bg-[#F24452] hover:bg-[#F23D3D]"
                                        onClick={onCreateSupply}
                                    >
                                        <Plus className="h-4 w-4 mr-1.5" />
                                        Crear insumo
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="p-4 bg-white border-b border-[#E5D9D1]">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_100px_120px_auto] gap-3 items-end">
                                        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                                            <Label className="text-xs text-gray-500">Insumo</Label>
                                            <Select
                                                value={newItemSupplyId?.toString() || ''}
                                                onValueChange={(value) =>
                                                    setNewItemSupplyId(parseInt(value, 10))
                                                }
                                            >
                                                <SelectTrigger className="h-9 bg-[#F2EDE4] border-[#E5D9D1]">
                                                    <SelectValue placeholder="Seleccionar..." />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white max-h-[240px]">
                                                    {Object.entries(suppliesByCategory).map(
                                                        ([category, categorySupplies]) => (
                                                            <SelectGroup key={category}>
                                                                <SelectLabel className="text-[#F24452] text-xs font-semibold">
                                                                    {CATEGORY_LABELS[category] ||
                                                                        category}
                                                                </SelectLabel>
                                                                {categorySupplies.map((supply) => (
                                                                    <SelectItem
                                                                        key={supply.id}
                                                                        value={supply.id.toString()}
                                                                        disabled={items.some(
                                                                            (i) =>
                                                                                i.supplyId ===
                                                                                supply.id
                                                                        )}
                                                                    >
                                                                        {supply.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectGroup>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-gray-500">Cant.</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={newItemQuantity}
                                                onChange={(e) => setNewItemQuantity(e.target.value)}
                                                placeholder="0"
                                                className="h-9 bg-[#F2EDE4] border-[#E5D9D1]"
                                                onKeyDown={(e) =>
                                                    e.key === 'Enter' &&
                                                    (e.preventDefault(), handleAddItem())
                                                }
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-gray-500">
                                                Precio unit.
                                            </Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={newItemUnitPrice}
                                                onChange={(e) =>
                                                    setNewItemUnitPrice(e.target.value)
                                                }
                                                placeholder="0,00"
                                                className="h-9 bg-[#F2EDE4] border-[#E5D9D1]"
                                                onKeyDown={(e) =>
                                                    e.key === 'Enter' &&
                                                    (e.preventDefault(), handleAddItem())
                                                }
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={handleAddItem}
                                            size="sm"
                                            className="bg-[#F24452] hover:bg-[#F23D3D] h-9 w-full lg:w-auto"
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Agregar
                                        </Button>
                                    </div>
                                </div>

                                {items.length > 0 ? (
                                    <div className="divide-y divide-[#E5D9D1]">
                                        {items.map((item, index) => {
                                            const subtotal = item.quantity * item.unitPrice;
                                            return (
                                                <div
                                                    key={`${item.supplyId}-${index}`}
                                                    className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 bg-white hover:bg-[#FFF9F5] transition-colors"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate">
                                                            {getSupplyName(item.supplyId)}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                                        <div className="flex items-center gap-1.5">
                                                            <Hash className="h-3.5 w-3.5 text-gray-400" />
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={(e) =>
                                                                    handleUpdateItem(
                                                                        index,
                                                                        'quantity',
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="h-8 w-16 text-sm bg-[#F2EDE4] border-[#E5D9D1]"
                                                            />
                                                        </div>
                                                        <span className="text-gray-300 hidden sm:inline">
                                                            ×
                                                        </span>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.unitPrice}
                                                            onChange={(e) =>
                                                                handleUpdateItem(
                                                                    index,
                                                                    'unitPrice',
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="h-8 w-24 text-sm bg-[#F2EDE4] border-[#E5D9D1]"
                                                        />
                                                        <span className="font-bold text-[#F24452] tabular-nums w-24 text-right text-sm">
                                                            {formatCurrency(subtotal)}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-gray-400 hover:text-[#F23D3D] hover:bg-[#F24452]/10 shrink-0"
                                                            onClick={() => handleRemoveItem(index)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-10 text-center text-sm text-gray-500">
                                        Agregá líneas con el formulario de arriba
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {items.length > 0 && (
                        <div className="flex justify-between items-center p-4 rounded-xl bg-[#F24452]/5 border border-[#F24452]/20">
                            <div className="flex items-center gap-2 text-[#262626]">
                                <DollarSign className="h-5 w-5 text-[#F24452]" />
                                <span className="font-semibold">Total estimado</span>
                            </div>
                            <span className="text-2xl font-bold text-[#F24452] tabular-nums">
                                {formatCurrency(total)}
                            </span>
                        </div>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t border-[#E5D9D1] bg-gray-50/50">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                        className="border-[#E5D9D1]"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => void handleSubmit()}
                        disabled={isSubmitting || items.length === 0 || noSupplies}
                        className="bg-[#F24452] hover:bg-[#F23D3D]"
                    >
                        {isSubmitting
                            ? 'Guardando...'
                            : isEditMode
                              ? 'Guardar cambios'
                              : 'Registrar gasto'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

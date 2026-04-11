import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ShoppingCart, DollarSign, Package } from 'lucide-react';
import type { Expense, ExpenseRequest, ExpenseItemRequest } from '../types/expense.types';
import type { Supplier } from '../types/supplier.types';
import type { Supply } from '../types/supply.types';
import { toast } from 'sonner';
import { formatCurrency } from '../lib/utils';

interface ExpenseFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (expense: ExpenseRequest) => Promise<boolean>;
    editingExpense?: Expense;
    suppliers: Supplier[];
    supplies: Supply[];
}

/**
 * Formulario modal para crear/editar gastos con sus items
 * Incluye gestión de líneas de items (añadir, modificar, eliminar)
 */
export function ExpenseForm({ open, onOpenChange, onSubmit, editingExpense, suppliers, supplies }: ExpenseFormProps) {
    const [supplierId, setSupplierId] = useState<number | undefined>(undefined);
    const [date, setDate] = useState('');
    const [items, setItems] = useState<ExpenseItemRequest[]>([]);
    
    // Estado para agregar nuevo item
    const [newItemSupplyId, setNewItemSupplyId] = useState<number | null>(null);
    const [newItemQuantity, setNewItemQuantity] = useState('');
    const [newItemUnitPrice, setNewItemUnitPrice] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editingExpense && open) {
            setSupplierId(editingExpense.supplierId);
            setDate(editingExpense.date);
            setItems(editingExpense.items.map(item => ({
                supplyId: item.supplyId,
                quantity: item.quantity,
                unitPrice: item.unitPrice
            })));
        } else if (open) {
            // Resetear formulario
            setSupplierId(undefined);
            const today = new Date().toISOString().split('T')[0];
            setDate(today);
            setItems([]);
        }
        // Resetear campos de nuevo item
        setNewItemSupplyId(null);
        setNewItemQuantity('');
        setNewItemUnitPrice('');
    }, [open, editingExpense]);

    // Agregar item a la lista
    const handleAddItem = () => {
        if (!newItemSupplyId) {
            toast.error('Selecciona un insumo');
            return;
        }
        const quantity = parseInt(newItemQuantity);
        const unitPrice = parseFloat(newItemUnitPrice);
        
        if (!quantity || quantity <= 0) {
            toast.error('La cantidad debe ser mayor a cero');
            return;
        }
        if (!unitPrice || unitPrice <= 0) {
            toast.error('El precio debe ser mayor a cero');
            return;
        }

        // Verificar si el insumo ya está en la lista
        const existingIndex = items.findIndex(item => item.supplyId === newItemSupplyId);
        if (existingIndex >= 0) {
            toast.error('Este insumo ya está en la lista');
            return;
        }

        const newItem: ExpenseItemRequest = {
            supplyId: newItemSupplyId,
            quantity,
            unitPrice
        };

        setItems([...items, newItem]);
        
        // Resetear campos
        setNewItemSupplyId(null);
        setNewItemQuantity('');
        setNewItemUnitPrice('');
    };

    // Eliminar item de la lista
    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    // Calcular total
    const calculateTotal = () => {
        return items.reduce((sum, item) => {
            return sum + (item.quantity * item.unitPrice);
        }, 0);
    };

    const handleSubmit = async () => {
        if (items.length === 0) {
            toast.error('Debes agregar al menos un ítem al gasto');
            return;
        }

        if (!date) {
            toast.error('La fecha es obligatoria');
            return;
        }

        const expenseData: ExpenseRequest = {
            supplierId,
            date,
            items
        };

        setIsSubmitting(true);
        const success = await onSubmit(expenseData);
        setIsSubmitting(false);

        if (success) {
            onOpenChange(false);
        }
    };

    // Helper para obtener nombre del insumo
    const getSupplyName = (supplyId: number) => {
        return supplies.find(s => s.id === supplyId)?.name || 'Insumo desconocido';
    };

    const isEditMode = !!editingExpense;
    const title = isEditMode ? 'Editar Gasto' : 'Registrar Nuevo Gasto';
    const total = calculateTotal();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-[#F24452]" />
                        {title}
                    </DialogTitle>
                </DialogHeader>
                
                <div className="grid gap-6 py-4">
                    {/* Fila 1: Proveedor y Fecha */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Proveedor (Opcional) */}
                        <div className="grid gap-2">
                            <Label htmlFor="supplier" className="text-sm">Proveedor (Opcional)</Label>
                            <Select 
                                value={supplierId?.toString() || 'none'} 
                                onValueChange={(value) => setSupplierId(value === 'none' ? undefined : parseInt(value))}
                            >
                                <SelectTrigger className="h-10 w-full bg-[#F2EDE4] border-[#E5D9D1] focus:border-[#F24452] focus:ring-0 overflow-hidden text-ellipsis whitespace-nowrap">
                                    <SelectValue placeholder="Seleccionar proveedor..." />
                                </SelectTrigger>
                                <SelectContent className="bg-[#F2EDE4] border border-[#E5D9D1] shadow-lg max-h-[260px]">
                                    <SelectItem value="none">Sin proveedor (Gasto interno)</SelectItem>
                                    {suppliers.map(supplier => (
                                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                            {supplier.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Fecha */}
                        <div className="grid gap-2">
                            <Label htmlFor="date" className="text-sm">Fecha *</Label>
                            <Input
                                type="date"
                                id="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                                className="h-10 focus-visible:ring-0 focus:border-[#F24452]"
                            />
                        </div>

                    </div>

                    {/* Sección de Items */}
                    <div className="border-2 border-[#F24452]/20 rounded-lg p-4 space-y-4 bg-gradient-to-br from-[#FFF5F5] to-white">
                        <div className="flex items-center gap-2 pb-2 border-b border-[#E5D9D1]">
                            <Package className="h-5 w-5 text-[#F24452]" />
                            <h3 className="font-semibold text-base">Líneas de Gasto</h3>
                            {items.length > 0 && (
                                <span className="ml-auto text-xs px-2 py-1 bg-[#F24452] text-white rounded-full font-medium">
                                    {items.length} {items.length === 1 ? 'item' : 'items'}
                                </span>
                            )}
                        </div>

                        {/* Agregar nuevo item */}
                        <div className="bg-white border border-[#E5D9D1] rounded-lg p-3">
                            <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 items-end">
                            <div className="grid gap-2">
                                <Label className="text-xs">Insumo</Label>
                                <Select 
                                    value={newItemSupplyId?.toString() || ''} 
                                    onValueChange={(value) => setNewItemSupplyId(parseInt(value))}
                                >
                                    <SelectTrigger className="h-9 w-full bg-[#F2EDE4] border-[#E5D9D1] focus:border-[#F24452] focus:ring-0 overflow-hidden text-ellipsis whitespace-nowrap">
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#F2EDE4] border border-[#E5D9D1] shadow-lg max-h-[260px]">
                                        {supplies.map(supply => (
                                            <SelectItem key={supply.id} value={supply.id.toString()}>
                                                {supply.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-xs">Cantidad</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={newItemQuantity}
                                    onChange={(e) => setNewItemQuantity(e.target.value)}
                                    placeholder="0"
                                    className="h-9"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-xs">Precio Unit.</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={newItemUnitPrice}
                                    onChange={(e) => setNewItemUnitPrice(e.target.value)}
                                    placeholder="0.00"
                                    className="h-9"
                                />
                            </div>

                            <Button 
                                type="button"
                                onClick={handleAddItem}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 h-9 cursor-pointer shadow-sm"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Agregar
                            </Button>
                        </div>
                        </div>

                        {/* Lista de items (tarjetas en lugar de tabla) */}
                        {items.length > 0 && (
                            <div className="space-y-2">
                                {items.map((item, index) => {
                                    const subtotal = item.quantity * item.unitPrice;
                                    return (
                                        <div key={index} className="bg-white border border-[#E5D9D1] rounded-lg p-3 hover:border-[#F24452] transition-all">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm">{getSupplyName(item.supplyId)}</div>
                                                    <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                                                        <span>📦 Cantidad: <strong>{item.quantity}</strong></span>
                                                        <span>💵 Precio: <strong>{formatCurrency(item.unitPrice)}</strong></span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <div className="text-xs text-gray-500">Subtotal</div>
                                                        <div className="font-bold text-[#F24452]">{formatCurrency(subtotal)}</div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveItem(index)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {items.length === 0 && (
                            <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
                                <div className="text-gray-400 text-sm mb-1">📦 No hay ítems agregados</div>
                                <div className="text-xs text-gray-500">Usa el formulario de arriba para agregar líneas de gasto</div>
                            </div>
                        )}
                    </div>

                    {/* Total calculado */}
                    {items.length > 0 && (
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-[#F24452]/10 to-[#F24452]/5 rounded-lg border-2 border-[#F24452]/30">
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-6 w-6 text-[#F24452]" />
                                <span className="text-lg font-semibold">Total del Gasto:</span>
                            </div>
                            <span className="text-3xl font-bold text-[#F24452]">
                                {formatCurrency(total)}
                            </span>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button 
                        variant="outline" 
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                        className="cursor-pointer"
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleSubmit}
                        disabled={isSubmitting || items.length === 0}
                        className="bg-[#F24452] hover:bg-[#d93a48] cursor-pointer"
                    >
                        {isSubmitting ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Registrar Gasto')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

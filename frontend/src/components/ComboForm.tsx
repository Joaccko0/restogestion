import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from 'lucide-react';
import type { Combo, ComboRequest, ComboItem, Product } from '../types/inventory.types';

interface ComboFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (combo: ComboRequest) => Promise<boolean>;
    products: Product[]; // Productos disponibles para seleccionar
    editingCombo?: Combo; // Si se proporciona, es modo edición
}

const emptyForm: ComboRequest = {
    name: '',
    price: 0,
    items: []
};

/**
 * Formulario modal para crear/editar combos
 * Layout de dos columnas: datos básicos a la izquierda, lista de productos a la derecha
 */
export function ComboForm({ open, onOpenChange, onSubmit, products, editingCombo }: ComboFormProps) {
    const [formData, setFormData] = useState<ComboRequest>(emptyForm);
    const [priceInput, setPriceInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [selectedQuantity, setSelectedQuantity] = useState('');

    // Inicializar forma al abrir
    useEffect(() => {
        if (editingCombo && open) {
            setFormData({
                name: editingCombo.name,
                price: editingCombo.price,
                items: editingCombo.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                }))
            });
            setPriceInput(String(editingCombo.price));
        } else if (open) {
            setFormData(emptyForm);
            setPriceInput('');
        }
        setSelectedProductId('');
        setSelectedQuantity('');
    }, [open, editingCombo]);

    // Actualizar campo del formulario
    const handleChange = (field: keyof ComboRequest, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Agregar producto al combo
    const handleAddProduct = () => {
        if (!selectedProductId) return;

        const productId = Number(selectedProductId);
        
        // Validar que no exista ya
        if (formData.items.some(item => item.productId === productId)) {
            return;
        }

        const quantity = parseInt(selectedQuantity, 10);
        if (!selectedQuantity.trim() || Number.isNaN(quantity) || quantity < 1) return;

        const newItem: ComboItem = {
            productId,
            quantity,
        };

        setFormData(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }));

        setSelectedProductId('');
        setSelectedQuantity('');
    };

    // Remover producto del combo
    const handleRemoveProduct = (productId: number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter(item => item.productId !== productId)
        }));
    };

    // Actualizar cantidad
    const handleUpdateQuantity = (productId: number, quantity: number) => {
        if (quantity < 1) return;
        
        setFormData(prev => ({
            ...prev,
            items: prev.items.map(item =>
                item.productId === productId ? { ...item, quantity } : item
            )
        }));
    };

    // Enviar formulario
    const handleSubmit = async () => {
        if (!formData.name.trim() || formData.items.length === 0) {
            return;
        }
        const price = parseFloat(priceInput);
        if (!priceInput.trim() || Number.isNaN(price) || price < 0) {
            return;
        }

        setIsSubmitting(true);
        const success = await onSubmit({ ...formData, price });
        setIsSubmitting(false);

        if (success) {
            setFormData(emptyForm);
            setPriceInput('');
            onOpenChange(false);
        }
    };

    const isEditMode = !!editingCombo;
    const title = isEditMode ? 'Editar Combo' : 'Crear Nuevo Combo';

    // Obtener nombre del producto por ID
    const getProductName = (productId: number) => {
        return products.find(p => p.id === productId)?.title || 'Producto desconocido';
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
                    {/* Columna izquierda: Datos básicos */}
                    <div className="space-y-3 overflow-y-auto overflow-x-hidden pr-2">
                        {/* Nombre del combo */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="name" className="text-sm">Nombre del Combo</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="Ej: Combo Familiar"
                                required
                                className="h-10 focus-visible:ring-0 focus:border-[#F24452] focus-visible:outline-none"
                            />
                        </div>

                        {/* Precio */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="price" className="text-sm">Precio Final</Label>
                            <Input
                                id="price"
                                type="number"
                                value={priceInput}
                                onChange={(e) => setPriceInput(e.target.value)}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className="h-10 focus-visible:ring-0 focus:border-[#F24452] focus-visible:outline-none"
                            />
                        </div>

                        <div className="border-t border-[#E5D9D1] pt-3">
                            <h4 className="text-sm font-semibold mb-3">Agregar Productos</h4>
                            
                            {/* Selector de productos */}
                            <div className="grid gap-2 mb-3">
                                <Label className="text-xs font-medium">Producto</Label>
                                <Select 
                                    value={selectedProductId} 
                                    onValueChange={setSelectedProductId}
                                >
                                    <SelectTrigger className="h-10 bg-[#F2EDE4] border-[#E5D9D1] focus:border-[#F24452] focus:ring-0 overflow-hidden text-ellipsis whitespace-nowrap">
                                        <SelectValue placeholder="Selecciona..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#F2EDE4] border border-[#E5D9D1] shadow-lg max-h-[300px]">
                                        {products
                                            .filter(p => !formData.items.some(item => item.productId === p.id))
                                            .map(product => (
                                                <SelectItem key={product.id} value={String(product.id)}>
                                                    {product.title} (${product.price.toLocaleString('es-AR', { minimumFractionDigits: 2 })})</SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Cantidad */}
                            <div className="grid gap-2 mb-3">
                                <Label className="text-xs font-medium">Cantidad</Label>
                                <Input
                                    type="number"
                                    value={selectedQuantity}
                                    onChange={(e) => setSelectedQuantity(e.target.value)}
                                    min="1"
                                    max="99"
                                    className="h-10 focus-visible:ring-0 focus:border-[#F24452] focus-visible:outline-none"
                                    placeholder="Cantidad"
                                />
                            </div>

                            <Button
                                onClick={handleAddProduct}
                                className="w-full bg-[#F24452] hover:bg-[#F23D3D] text-white h-9"
                                disabled={!selectedProductId}
                            >
                                <Plus className="w-4 h-4 mr-1" /> Agregar
                            </Button>
                        </div>
                    </div>

                    {/* Columna derecha: Lista de productos */}
                    <div className="flex flex-col gap-1.5 overflow-hidden">
                        <div>
                            <Label className="text-sm font-semibold">Productos ({formData.items.length})</Label>
                        </div>
                        <div className="flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden border border-[#E5D9D1] rounded-lg p-2 bg-white">
                            {formData.items.length === 0 ? (
                                <div className="text-xs text-gray-500 text-center py-12 flex items-center justify-center">
                                    Agrega productos aquí
                                </div>
                            ) : (
                                formData.items.map((item) => (
                                    <div
                                        key={item.productId}
                                        className="flex items-center justify-between bg-[#F2EDE4] p-2 rounded text-sm gap-2"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-xs truncate">
                                                {getProductName(item.productId)}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <Input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) =>
                                                    handleUpdateQuantity(item.productId, parseInt(e.target.value) || 1)
                                                }
                                                min="1"
                                                max="99"
                                                className="w-10 h-7 text-center text-xs p-1 focus-visible:ring-0 focus:border-[#F24452] focus-visible:outline-none"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 flex-shrink-0"
                                                onClick={() => handleRemoveProduct(item.productId)}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        className="bg-[#F24452] hover:bg-[#F23D3D] text-white"
                        disabled={isSubmitting || !formData.name.trim() || formData.items.length === 0}
                    >
                        {isSubmitting ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Guardar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

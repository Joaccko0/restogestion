import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product, ProductRequest } from '../types/inventory.types';

interface ProductFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (product: ProductRequest) => Promise<boolean>;
    editingProduct?: Product;
    categories: { code: string; name: string }[];
}

// Formulario inicial vacío
const emptyForm = (): ProductRequest => ({
    title: '',
    description: '',
    price: 0,
    category: '',
    active: true,
});

/**
 * Formulario modal para crear/editar productos
 * Soporta ambos modos: crear nuevo y editar existente
 */
export function ProductForm({ open, onOpenChange, onSubmit, editingProduct, categories }: ProductFormProps) {
    const [formData, setFormData] = useState<ProductRequest>(emptyForm());
    const [priceInput, setPriceInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const defaultCategory = categories[0]?.code ?? '';

    // Inicializar forma cuando se abre con un producto para editar
    useEffect(() => {
        if (editingProduct && open) {
            setFormData({
                title: editingProduct.title,
                description: editingProduct.description,
                price: editingProduct.price,
                category: editingProduct.category,
                active: editingProduct.active,
            });
            setPriceInput(String(editingProduct.price));
        } else if (open) {
            setFormData({ ...emptyForm(), category: defaultCategory });
            setPriceInput('');
        }
    }, [open, editingProduct, defaultCategory]);

    // Actualizar campo del formulario
    const handleChange = (field: keyof ProductRequest, value: string | number | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Enviar formulario
    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            toast.error('El nombre es obligatorio');
            return;
        }
        if (!formData.category?.trim()) {
            toast.error('Seleccioná una categoría');
            return;
        }
        const price = parseFloat(priceInput);
        if (!priceInput.trim() || Number.isNaN(price) || price < 0) {
            toast.error('Ingresá un precio válido');
            return;
        }

        setIsSubmitting(true);
        const success = await onSubmit({ ...formData, price });
        setIsSubmitting(false);

        if (success) {
            setFormData({ ...emptyForm(), category: defaultCategory });
            setPriceInput('');
            onOpenChange(false);
        }
    };

    const isEditMode = !!editingProduct;
    const title = isEditMode ? 'Editar Producto' : 'Crear Nuevo Producto';
    const canSubmit =
        !!formData.title.trim() &&
        !!formData.category?.trim() &&
        categories.length > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-4 sm:px-6 py-4 border-b border-[#E5D9D1]">
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                
                <div className="grid gap-3 px-4 sm:px-6 py-4 flex-1 overflow-y-auto overflow-x-hidden">
                    {/* Nombre */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="title" className="text-sm">Nombre</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="Ej: Pizza Muzzarella"
                            required
                            className="h-11 focus-visible:ring-0 focus:border-[#F24452] focus-visible:outline-none"
                        />
                    </div>

                    {/* Precio y Categoría */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label htmlFor="price" className="text-sm">Precio</Label>
                            <Input
                                id="price"
                                type="number"
                                value={priceInput}
                                onChange={(e) => setPriceInput(e.target.value)}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className="h-11 focus-visible:ring-0 focus:border-[#F24452] focus-visible:outline-none"
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="category" className="text-sm">
                                Categoría <span className="text-[#F24452]">*</span>
                            </Label>
                            <Select
                                value={formData.category || undefined}
                                onValueChange={(val) => handleChange('category', val)}
                                disabled={categories.length === 0}
                            >
                                <SelectTrigger className="h-11 bg-[#F2EDE4] border-[#E5D9D1] focus:border-[#F24452] focus:ring-0 overflow-hidden text-ellipsis whitespace-nowrap">
                                    <SelectValue placeholder="Seleccionar categoría" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#F2EDE4] border border-[#E5D9D1] shadow-lg max-h-[260px]">
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.code} value={cat.code}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {categories.length === 0 && (
                                <p className="text-xs text-gray-500">
                                    Creá al menos una categoría en la pestaña Categorías.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Descripción */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="description" className="text-sm">Descripción</Label>
                        <Textarea
                            id="description"
                            value={formData.description || ''}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Ingredientes, detalles..."
                            rows={2}
                            className="resize-none focus-visible:ring-0 focus:border-[#F24452] focus-visible:outline-none"
                        />
                    </div>
                </div>

                <DialogFooter className="px-4 sm:px-6 py-4 border-t border-[#E5D9D1] bg-gray-50/60">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                        className="touch-target"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        className="bg-[#F24452] hover:bg-[#F23D3D] text-white touch-target"
                        disabled={isSubmitting || !canSubmit}
                    >
                        {isSubmitting ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Guardar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

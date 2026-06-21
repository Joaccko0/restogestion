import { useMemo, useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { useProducts } from '../hooks/useProducts';
import { useCombos } from '../hooks/useCombos';
import { useSearch } from '../hooks/useSearch';
import { Plus, Search, Pizza, UtensilsCrossed, Tags } from 'lucide-react';

import { ProductForm } from '../components/ProductForm';
import { ProductTable } from '../components/ProductTable';
import { ComboForm } from '../components/ComboForm';
import { ComboTable } from '../components/ComboTable';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { MenuCategoriesPanel } from '../components/MenuCategoriesPanel';
import { useMenuCategories } from '../hooks/useMenuCategories';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import type { Product, Combo } from '../types/inventory.types';

const ALL_CATEGORIES = 'ALL';

export default function ProductsPage() {
    const { currentBusiness } = useBusiness();

    const { products, isLoading: productsLoading, createProduct, updateProduct, deleteProduct } =
        useProducts(currentBusiness?.id || null);
    const { combos, isLoading: combosLoading, createCombo, updateCombo, deleteCombo } = useCombos(
        currentBusiness?.id || null
    );
    const {
        categories,
        labelByCode,
        isLoading: categoriesLoading,
        createCategory,
        deleteCategory,
    } = useMenuCategories(currentBusiness?.id || null);

    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [comboSearchTerm, setComboSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORIES);

    const searchedProducts = useSearch(products, productSearchTerm, ['title', 'description']);
    const filteredProducts = useMemo(() => {
        if (categoryFilter === ALL_CATEGORIES) return searchedProducts;
        return searchedProducts.filter((p) => p.category === categoryFilter);
    }, [searchedProducts, categoryFilter]);

    const filteredCombos = useSearch(combos, comboSearchTerm, ['name']);

    const [isProductFormOpen, setIsProductFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isComboFormOpen, setIsComboFormOpen] = useState(false);
    const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
    const [productToDelete, setProductToDelete] = useState<number | null>(null);
    const [comboToDelete, setComboToDelete] = useState<number | null>(null);

    const handleOpenProductForm = (product?: Product) => {
        setEditingProduct(product ?? null);
        setIsProductFormOpen(true);
    };

    const handleSubmitProduct = async (formData: Parameters<typeof createProduct>[0]) => {
        if (editingProduct) return updateProduct(editingProduct.id, formData);
        return createProduct(formData);
    };

    const handleOpenComboForm = (combo?: Combo) => {
        setEditingCombo(combo ?? null);
        setIsComboFormOpen(true);
    };

    const handleSubmitCombo = async (formData: Parameters<typeof createCombo>[0]) => {
        if (editingCombo) return updateCombo(editingCombo.id, formData);
        return createCombo(formData);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-[#262626] flex items-center gap-2">
                    <Pizza className="h-7 w-7 text-[#F24452]" />
                    Gestión de menú
                </h2>
                <p className="text-gray-500 mt-0.5">
                    Productos, combos y categorías de tu carta
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-[#E5D9D1]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Productos</span>
                        <div className="p-2 bg-[#F24452]/10 rounded-lg">
                            <Pizza className="h-4 w-4 text-[#F24452]" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-[#262626] tabular-nums">{products.length}</p>
                    <p className="text-xs text-gray-400 mt-1">Activos en el menú</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-[#E5D9D1]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Combos</span>
                        <div className="p-2 bg-[#F2EDE4] rounded-lg">
                            <UtensilsCrossed className="h-4 w-4 text-[#262626]" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-[#F24452] tabular-nums">{combos.length}</p>
                    <p className="text-xs text-gray-400 mt-1">Promociones armadas</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-[#E5D9D1]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Categorías</span>
                        <div className="p-2 bg-[#F2EDE4] rounded-lg">
                            <Tags className="h-4 w-4 text-[#262626]" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-[#262626] tabular-nums">{categories.length}</p>
                    <p className="text-xs text-gray-400 mt-1">Para organizar la carta</p>
                </div>
            </div>

            <Tabs defaultValue="products" className="w-full">
                <TabsList className="bg-[#E5D9D1] w-full sm:w-auto grid grid-cols-3 h-auto p-1">
                    <TabsTrigger
                        value="products"
                        className="data-[state=active]:bg-[#F24452] data-[state=active]:text-white gap-1.5 text-xs sm:text-sm"
                    >
                        <Pizza className="w-4 h-4 shrink-0" />
                        Productos ({filteredProducts.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="combos"
                        className="data-[state=active]:bg-[#F24452] data-[state=active]:text-white gap-1.5 text-xs sm:text-sm"
                    >
                        <UtensilsCrossed className="w-4 h-4 shrink-0" />
                        Combos ({filteredCombos.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="categories"
                        className="data-[state=active]:bg-[#F24452] data-[state=active]:text-white gap-1.5 text-xs sm:text-sm"
                    >
                        <Tags className="w-4 h-4 shrink-0" />
                        Categorías ({categories.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="products" className="space-y-4 mt-4">
                    <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl shadow-sm border border-[#E5D9D1]">
                        <div className="relative flex-1 min-w-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Buscar producto..."
                                className="pl-9 h-10 bg-[#F2EDE4] border-none"
                                value={productSearchTerm}
                                onChange={(e) => setProductSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="h-10 w-full sm:w-44 bg-[#F2EDE4] border-[#E5D9D1]">
                                <SelectValue placeholder="Categoría" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#F2EDE4] border border-[#E5D9D1]">
                                <SelectItem value={ALL_CATEGORIES}>Todas</SelectItem>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.code} value={cat.code}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            className="bg-[#F24452] hover:bg-[#F23D3D] text-white shrink-0"
                            onClick={() => handleOpenProductForm()}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Nuevo producto
                        </Button>
                    </div>

                    <ProductTable
                        products={filteredProducts}
                        isLoading={productsLoading}
                        onEdit={handleOpenProductForm}
                        onDelete={setProductToDelete}
                        onCreateFirst={() => handleOpenProductForm()}
                        categoryLabels={labelByCode}
                        hasSearch={!!productSearchTerm.trim() || categoryFilter !== ALL_CATEGORIES}
                    />
                </TabsContent>

                <TabsContent value="combos" className="space-y-4 mt-4">
                    <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl shadow-sm border border-[#E5D9D1]">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Buscar combo..."
                                className="pl-9 h-10 bg-[#F2EDE4] border-none"
                                value={comboSearchTerm}
                                onChange={(e) => setComboSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button
                            className="bg-[#F24452] hover:bg-[#F23D3D] text-white shrink-0"
                            onClick={() => handleOpenComboForm()}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Nuevo combo
                        </Button>
                    </div>

                    <ComboTable
                        combos={filteredCombos}
                        isLoading={combosLoading}
                        onEdit={handleOpenComboForm}
                        onDelete={setComboToDelete}
                        onCreateFirst={() => handleOpenComboForm()}
                        hasSearch={!!comboSearchTerm.trim()}
                    />
                </TabsContent>

                <TabsContent value="categories" className="mt-4">
                    <MenuCategoriesPanel
                        categories={categories}
                        isLoading={categoriesLoading}
                        onCreate={createCategory}
                        onDelete={deleteCategory}
                    />
                </TabsContent>
            </Tabs>

            <ProductForm
                open={isProductFormOpen}
                onOpenChange={(open) => {
                    setIsProductFormOpen(open);
                    if (!open) setEditingProduct(null);
                }}
                onSubmit={handleSubmitProduct}
                editingProduct={editingProduct || undefined}
                categories={categories.map((c) => ({ code: c.code, name: c.name }))}
            />

            <ComboForm
                open={isComboFormOpen}
                onOpenChange={(open) => {
                    setIsComboFormOpen(open);
                    if (!open) setEditingCombo(null);
                }}
                onSubmit={handleSubmitCombo}
                products={products}
                editingCombo={editingCombo || undefined}
            />

            <ConfirmDialog
                open={productToDelete !== null}
                onOpenChange={(open) => !open && setProductToDelete(null)}
                onConfirm={async () => {
                    if (productToDelete) {
                        await deleteProduct(productToDelete);
                        setProductToDelete(null);
                    }
                }}
                title="¿Eliminar producto?"
                description="Se desactivará del menú. Los pedidos anteriores conservan el historial."
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="destructive"
            />

            <ConfirmDialog
                open={comboToDelete !== null}
                onOpenChange={(open) => !open && setComboToDelete(null)}
                onConfirm={async () => {
                    if (comboToDelete) {
                        await deleteCombo(comboToDelete);
                        setComboToDelete(null);
                    }
                }}
                title="¿Eliminar combo?"
                description="Esta acción no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="destructive"
            />
        </div>
    );
}

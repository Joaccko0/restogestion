import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { MenuCategoryService, type MenuCategory } from '../services/menuCategory.service';

export function useMenuCategories(businessId: number | null) {
    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadCategories = useCallback(async () => {
        if (!businessId) return;
        setIsLoading(true);
        try {
            const data = await MenuCategoryService.list(businessId);
            setCategories(data);
        } catch {
            toast.error('Error al cargar categorías');
        } finally {
            setIsLoading(false);
        }
    }, [businessId]);

    useEffect(() => {
        void loadCategories();
    }, [loadCategories]);

    const createCategory = async (name: string): Promise<boolean> => {
        if (!businessId) return false;
        try {
            await MenuCategoryService.create(businessId, name);
            toast.success('Categoría creada');
            await loadCategories();
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'No se pudo crear la categoría');
            return false;
        }
    };

    const deleteCategory = async (categoryId: number): Promise<boolean> => {
        if (!businessId) return false;
        try {
            await MenuCategoryService.delete(businessId, categoryId);
            toast.success('Categoría eliminada');
            await loadCategories();
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'No se pudo eliminar la categoría');
            return false;
        }
    };

    const labelByCode = useMemo(() => {
        const map: Record<string, string> = {};
        categories.forEach((c) => {
            map[c.code] = c.name;
        });
        return map;
    }, [categories]);

    return {
        categories,
        labelByCode,
        isLoading,
        loadCategories,
        createCategory,
        deleteCategory,
    };
}

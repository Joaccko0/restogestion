import apiClient from '../api/client';

export interface MenuCategory {
    id: number;
    name: string;
    code: string;
    systemDefault: boolean;
}

export const MenuCategoryService = {
    async list(businessId: number): Promise<MenuCategory[]> {
        const { data } = await apiClient.get<MenuCategory[]>('/menu-categories', {
            params: { businessId },
        });
        return data;
    },

    async create(businessId: number, name: string): Promise<MenuCategory> {
        const { data } = await apiClient.post<MenuCategory>(
            '/menu-categories',
            { name },
            { params: { businessId } }
        );
        return data;
    },

    async delete(businessId: number, categoryId: number): Promise<void> {
        await apiClient.delete(`/menu-categories/${categoryId}`, {
            params: { businessId },
        });
    },
};

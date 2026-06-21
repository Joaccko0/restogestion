/** Categorías predeterminadas del menú (orden de visualización) */
export const PRODUCT_CATEGORIES = [
    { id: 'PIZZAS', label: 'Pizzas' },
    { id: 'EMPANADAS', label: 'Empanadas' },
    { id: 'BEBIDAS', label: 'Bebidas' },
    { id: 'OTROS', label: 'Otros' },
] as const;

export type ProductCategoryId = (typeof PRODUCT_CATEGORIES)[number]['id'];

export const PRODUCT_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
    PRODUCT_CATEGORIES.map((c) => [c.id, c.label])
);

export const DEFAULT_CATEGORY_ORDER = PRODUCT_CATEGORIES.map((c) => c.id);

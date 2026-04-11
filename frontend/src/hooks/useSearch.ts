import { useMemo } from 'react';

/**
 * Hook para filtrar/buscar en arrays de forma eficiente
 * Busca por múltiples campos en tiempo real
 */
export function useSearch<T extends Record<string, any>>(
    items: T[],
    searchTerm: string,
    searchFields: (keyof T)[]
): T[] {
    // useMemo evita recalcular si no cambiaron los inputs
    const filteredItems = useMemo(() => {
        if (!searchTerm.trim()) return items;

        const lowerSearch = searchTerm.toLowerCase();
        
        return items.filter(item =>
            searchFields.some(field => {
                const value = item[field];
                // Convertir a string y hacer búsqueda case-insensitive
                return String(value).toLowerCase().includes(lowerSearch);
            })
        );
    }, [items, searchTerm, searchFields]);

    return filteredItems;
}

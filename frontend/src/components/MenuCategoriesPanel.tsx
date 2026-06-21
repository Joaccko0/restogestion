import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import type { MenuCategory } from '../services/menuCategory.service';

interface MenuCategoriesPanelProps {
    categories: MenuCategory[];
    isLoading?: boolean;
    onCreate: (name: string) => Promise<boolean>;
    onDelete: (id: number) => Promise<boolean>;
}

export function MenuCategoriesPanel({
    categories,
    isLoading = false,
    onCreate,
    onDelete,
}: MenuCategoriesPanelProps) {
    const [newName, setNewName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleCreate = async () => {
        const name = newName.trim();
        if (!name) return;
        setSubmitting(true);
        const ok = await onCreate(name);
        setSubmitting(false);
        if (ok) setNewName('');
    };

    return (
        <div className="space-y-4 bg-white p-4 rounded-lg shadow-sm border border-[#E5D9D1]">
            <p className="text-sm text-gray-500">
                Organizá tus productos y el cierre de caja. Las predeterminadas no se pueden
                eliminar.
            </p>

            <div className="flex gap-2 max-w-md">
                <Input
                    placeholder="Nueva categoría..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-[#F2EDE4] border-[#E5D9D1]"
                    onKeyDown={(e) => e.key === 'Enter' && void handleCreate()}
                />
                <Button
                    type="button"
                    className="bg-[#F24452] hover:bg-[#F23D3D] shrink-0"
                    onClick={() => void handleCreate()}
                    disabled={submitting || !newName.trim()}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#F24452]" />
                </div>
            ) : (
                <ul className="divide-y divide-[#E5D9D1] border border-[#E5D9D1] rounded-xl overflow-hidden max-w-lg">
                    {categories.map((cat) => (
                        <li
                            key={cat.id}
                            className="flex items-center justify-between px-3 py-2.5 bg-white hover:bg-[#FFF9F5]"
                        >
                            <div>
                                <p className="font-medium text-sm text-[#262626]">{cat.name}</p>
                                {cat.systemDefault && (
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                                        Predeterminada
                                    </p>
                                )}
                            </div>
                            {!cat.systemDefault && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-400 hover:text-[#F23D3D]"
                                    onClick={() => void onDelete(cat.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

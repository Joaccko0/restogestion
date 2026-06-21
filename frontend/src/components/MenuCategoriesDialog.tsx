import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tags } from 'lucide-react';
import type { MenuCategory } from '../services/menuCategory.service';
import { MenuCategoriesPanel } from './MenuCategoriesPanel';

interface MenuCategoriesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: MenuCategory[];
    isLoading?: boolean;
    onCreate: (name: string) => Promise<boolean>;
    onDelete: (id: number) => Promise<boolean>;
}

export function MenuCategoriesDialog({
    open,
    onOpenChange,
    categories,
    isLoading = false,
    onCreate,
    onDelete,
}: MenuCategoriesDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Tags className="h-5 w-5 text-[#F24452]" />
                        Categorías del menú
                    </DialogTitle>
                    <DialogDescription>
                        Organizá tus productos y el cierre de caja.
                    </DialogDescription>
                </DialogHeader>

                <MenuCategoriesPanel
                    categories={categories}
                    isLoading={isLoading}
                    onCreate={onCreate}
                    onDelete={onDelete}
                />

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Dialog para abrir caja
 * Permite ingresar el monto inicial con el que se abre la caja
 */

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign } from 'lucide-react';

interface OpenCashDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (startAmount: number) => Promise<any>;
    loading?: boolean;
}

export function OpenCashDialog({ open, onOpenChange, onSubmit, loading = false }: OpenCashDialogProps) {
    const [startAmount, setStartAmount] = useState<string>('');
    const [error, setError] = useState<string>('');

    const handleSubmit = async () => {
        setError('');

        // Validaciones
        const amount = startAmount.trim() === '' ? 0 : parseFloat(startAmount);
        if (startAmount.trim() !== '' && isNaN(amount)) {
            setError('El monto debe ser un número válido');
            return;
        }

        if (amount < 0) {
            setError('El monto no puede ser negativo');
            return;
        }

        try {
            await onSubmit(amount);
            setStartAmount('');
            onOpenChange(false);
        } catch (err) {
            // El error ya es mostrado por el toast en useCashShift
            console.error('Error opening cash:', err);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!loading) {
            setStartAmount('');
            setError('');
            onOpenChange(newOpen);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="bg-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-[#F24452]" />
                        Abrir Caja
                    </DialogTitle>
                    <DialogDescription>
                        Ingresá el monto inicial en caja. Podés dejarlo vacío o en 0 si no hay efectivo al abrir.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="startAmount">Monto Inicial</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                                $
                            </span>
                            <Input
                                id="startAmount"
                                type="number"
                                placeholder="0.00"
                                value={startAmount}
                                onChange={(e) => {
                                    setStartAmount(e.target.value);
                                    setError('');
                                }}
                                className="pl-8 h-11 bg-[#F2EDE4] border-[#E5D9D1] focus:border-[#F24452] focus:ring-0"
                                min="0"
                                step="0.01"
                                disabled={loading}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !loading) {
                                        handleSubmit();
                                    }
                                }}
                            />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={loading}
                        className="touch-target"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-[#F24452] hover:bg-[#d63c47] touch-target"
                    >
                        {loading ? 'Abriendo...' : 'Abrir Caja'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck } from 'lucide-react';
import { MeService } from '../services/me.service';
import { toast } from 'sonner';

interface DeliveryFeeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    businessId: number;
    currentFee: number;
    onSaved: () => void;
}

export function DeliveryFeeDialog({
    open,
    onOpenChange,
    businessId,
    currentFee,
    onSaved,
}: DeliveryFeeDialogProps) {
    const [fee, setFee] = useState(String(currentFee || 0));
    const [saving, setSaving] = useState(false);

    const handleOpen = (isOpen: boolean) => {
        if (isOpen) setFee(String(currentFee || 0));
        onOpenChange(isOpen);
    };

    const handleSave = async () => {
        const parsed = parseFloat(fee);
        if (isNaN(parsed) || parsed < 0) {
            toast.error('Ingresá un monto válido');
            return;
        }
        setSaving(true);
        try {
            await MeService.updateBusinessSettings(businessId, { deliveryFee: parsed });
            toast.success('Costo de delivery actualizado');
            onSaved();
            onOpenChange(false);
        } catch {
            toast.error('No se pudo guardar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpen}>
            <DialogContent className="bg-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-[#F24452]" />
                        Costo de delivery
                    </DialogTitle>
                    <DialogDescription>
                        Se suma automáticamente al total cuando el pedido es delivery.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                    <Label htmlFor="deliveryFee">Monto por envío</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <Input
                            id="deliveryFee"
                            type="number"
                            min="0"
                            step="0.01"
                            value={fee}
                            onChange={(e) => setFee(e.target.value)}
                            className="pl-8 bg-[#F2EDE4] border-[#E5D9D1]"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button
                        className="bg-[#F24452] hover:bg-[#F23D3D]"
                        onClick={() => void handleSave()}
                        disabled={saving}
                    >
                        {saving ? 'Guardando...' : 'Guardar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

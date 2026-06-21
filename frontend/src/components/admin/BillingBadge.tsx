import type { BusinessBillingStatus } from '@/services/me.service';
import { cn } from '@/lib/utils';

const STYLES: Record<BusinessBillingStatus, string> = {
    GRATIS: 'bg-slate-100 text-slate-700 border-slate-200',
    VIGENTE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    MOROSO: 'bg-amber-50 text-amber-800 border-amber-200',
    VENCIDO: 'bg-red-50 text-red-800 border-red-200',
};

const LABELS: Record<BusinessBillingStatus, string> = {
    GRATIS: 'Gratis',
    VIGENTE: 'Vigente',
    MOROSO: 'Moroso',
    VENCIDO: 'Vencido',
};

export function BillingBadge({ status }: { status: BusinessBillingStatus }) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide',
                STYLES[status]
            )}
        >
            {LABELS[status]}
        </span>
    );
}

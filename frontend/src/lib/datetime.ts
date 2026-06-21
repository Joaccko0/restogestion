/** Zona horaria de visualización en el frontend (Argentina). */
export const ARG_TIMEZONE = 'America/Argentina/Buenos_Aires';

const LOCALE = 'es-AR';

/**
 * Parsea timestamps del API. Sin offset se asume UTC (como en BD).
 */
export function parseApiDateTime(iso: string): Date {
    if (!iso) return new Date(NaN);
    const trimmed = iso.trim();
    if (/[Zz]|[+-]\d{2}:\d{2}$/.test(trimmed)) {
        return new Date(trimmed);
    }
    return new Date(`${trimmed}Z`);
}

export function formatDateTimeAR(
    iso: string,
    options: Intl.DateTimeFormatOptions = { dateStyle: 'short', timeStyle: 'short' }
): string {
    const date = parseApiDateTime(iso);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString(LOCALE, { ...options, timeZone: ARG_TIMEZONE });
}

export function formatDateAR(
    iso: string,
    options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }
): string {
    const date = parseApiDateTime(iso);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(LOCALE, { ...options, timeZone: ARG_TIMEZONE });
}

export function formatTimeAR(
    iso: string,
    options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
): string {
    const date = parseApiDateTime(iso);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleTimeString(LOCALE, { ...options, timeZone: ARG_TIMEZONE });
}

/** Hora 0–23 en Argentina (para agrupaciones / gráficos). */
export function getArgentinaHour(iso: string): number {
    const parts = new Intl.DateTimeFormat(LOCALE, {
        timeZone: ARG_TIMEZONE,
        hour: 'numeric',
        hour12: false,
    }).formatToParts(parseApiDateTime(iso));
    return parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
}

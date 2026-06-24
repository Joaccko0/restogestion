import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
/**
 * Formatea un número como moneda en formato latino: $ 1.000.000,99
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '$\u00A00,00';
  
  const formatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  
  return `$\u00A0${formatted}`;
}

/**
 * Formatea un número decimal en formato latino: 1.000.000,99
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0,00';
  
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formatea un número entero en formato latino: 1.000.000
 */
export function formatInteger(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0';
  
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.floor(value));
}
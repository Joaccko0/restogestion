-- Migration 005: desglose manual por medio de pago al cerrar caja
-- Idempotente.

ALTER TABLE cash_shifts ADD COLUMN IF NOT EXISTS manual_payment_breakdown TEXT;

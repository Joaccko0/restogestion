-- Migration 002: categoría obligatoria en productos
-- Idempotente. Ejecutar en prod antes de desplegar backend con Product.category NOT NULL.

UPDATE products
SET category = 'PIZZAS'
WHERE category IS NULL OR trim(category) = '';

ALTER TABLE products ALTER COLUMN category SET DEFAULT 'PIZZAS';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'category'
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE products ALTER COLUMN category SET NOT NULL;
  END IF;
END $$;

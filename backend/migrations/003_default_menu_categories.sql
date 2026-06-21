-- Migration 003: categorías predeterminadas Pizzas, Empanadas, Bebidas, Otros
-- Idempotente. Ejecutar en prod antes/después de desplegar el backend actualizado.

-- Agregar "Otros" donde falte
INSERT INTO menu_categories (business_id, code, name, system_default, created_at, updated_at)
SELECT b.id, 'OTROS', 'Otros', true, NOW(), NOW()
FROM businesses b
WHERE NOT EXISTS (
    SELECT 1 FROM menu_categories mc
    WHERE mc.business_id = b.id AND mc.code = 'OTROS'
);

-- Quitar predeterminadas obsoletas sin productos asociados
DELETE FROM menu_categories mc
WHERE mc.code IN ('POSTRES', 'COMBOS')
  AND mc.system_default = true
  AND NOT EXISTS (
      SELECT 1 FROM products p
      WHERE p.business_id = mc.business_id AND p.category = mc.code
  );

-- Si quedaron como no-predeterminadas, permitir que el owner las elimine
UPDATE menu_categories
SET system_default = false
WHERE code IN ('POSTRES', 'COMBOS');

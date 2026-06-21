# Migraciones de base de datos

En **producción** el backend usa `spring.jpa.hibernate.ddl-auto: validate`: Hibernate **no** crea ni altera tablas. Los cambios de esquema van en SQL versionado bajo `backend/migrations/`.

En **desarrollo** (`ddl-auto: update`) Hibernate suele aplicar cambios al arrancar, pero conviene ejecutar las mismas migraciones si la BD quedó desactualizada o hubo errores al boot.

## Archivos actuales

| Archivo | Contenido |
|---------|-----------|
| `001_delivery_fee_manual_cash_menu_categories.sql` | `businesses.delivery_fee`, cierre de caja manual, tabla `menu_categories` |
| `002_products_category_required.sql` | `products.category` NOT NULL |
| `003_default_menu_categories.sql` | Categorías por defecto (Pizzas, Empanadas, Bebidas, Otros) |
| `004_order_payments_and_items_edit.sql` | Tabla `order_payments` + backfill de pedidos pagados |
| `005_manual_payment_breakdown.sql` | Columna `manual_payment_breakdown` en `cash_shifts` |

Todas son **idempotentes** (`IF NOT EXISTS`, `NOT EXISTS` en inserts): se pueden re-ejecutar sin romper datos.

## Ejecución manual

### Script (recomendado)

Desde la raíz del repo (Linux / VPS / Git Bash):

```bash
chmod +x scripts/run-migrations.sh
./scripts/run-migrations.sh
```

**Desarrollo local** (contenedor `pizzeria_db`, BD `pizzeria_db`):

```bash
POSTGRES_CONTAINER=pizzeria_db POSTGRES_DB=pizzeria_db ./scripts/run-migrations.sh
```

### Un archivo suelto

```bash
docker exec -i pizzeria_db psql -U postgres -d pizzeria_db \
  < backend/migrations/001_delivery_fee_manual_cash_menu_categories.sql
```

Prod (contenedor `restogestion-db`):

```bash
docker exec -i restogestion-db psql -U postgres -d restogestion \
  < backend/migrations/001_delivery_fee_manual_cash_menu_categories.sql
```

## Deploy automático (push a `main`)

El workflow [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) ejecuta `scripts/run-migrations.sh` **después** de levantar PostgreSQL y **antes** de arrancar backend y frontend.

Orden en el VPS:

1. `git fetch` + `reset --hard`
2. `docker compose build`
3. `docker compose up -d db` + esperar healthcheck
4. `./scripts/run-migrations.sh`
5. `docker compose up -d` (stack completo)

Así el esquema queda alineado con el código antes de que Spring Boot arranque con `validate`.

## Añadir una migración nueva

1. Crear `backend/migrations/00N_descripcion_corta.sql` (prefijo numérico de 3 dígitos).
2. Usar sentencias idempotentes cuando sea posible.
3. Probar en local con el script.
4. Merge a `main`: el deploy la aplicará solo.

Convención: no editar migraciones ya aplicadas en prod; agregar una nueva.

## Checklist pre-deploy (prod)

- [ ] Nueva migración incluida en el PR si hubo cambios de entidades JPA.
- [ ] Migraciones probadas en una copia de la BD o en staging.
- [ ] Backend compila con perfil `prod` (`ddl-auto: validate`).
- [ ] Tras el deploy, revisar logs del backend (`docker logs restogestion-backend`) por errores de validación de esquema.

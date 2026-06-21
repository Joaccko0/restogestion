# Modelo de dominio

Las entidades JPA viven en `backend/src/main/java/com/pizzeria/backend/model/`. Muchas extienden `BaseEntity`, que aporta `id`, `businessId`, `createdAt` y `updatedAt` (timestamps Hibernate).

## Multi-tenant

- **`businessId`**: identifica el negocio dueño del registro. Los servicios comprueban que las operaciones correspondan al `businessId` solicitado.

## Negocio (`Business`)

- `name`, `deliveryFee` (cargo por delivery del negocio), y campos de **facturación SaaS**: `billingStatus` (`GRATIS`, `VIGENTE`, `MOROSO`, `VENCIDO`), `expiresAt` (opcional; obligatorio si el plan no es GRATIS).
- Los estados de pago se alinean con las fechas mediante `BusinessBillingService` y un job programado.

## Usuarios y negocio

| Entidad | Descripción |
|---------|-------------|
| `User` | Usuario de aplicación (login por email). |
| `Business` | Negocio (pizzería). |
| `UserBusinessRole` | Relación usuario–negocio con `Role`: `OWNER`, `EMPLOYEE`. |

## Catálogo

| Entidad | Descripción |
|---------|-------------|
| `Product` | Producto vendible; **`category` obligatoria** (nombre alineado con `MenuCategory`). |
| `MenuCategory` | Categoría de carta por negocio (Pizzas, Empanadas, etc.). |
| `Combo` | Combo formado por ítems. |
| `ComboItem` | Línea de combo: referencia a producto y cantidad/precio según modelo. |

## Clientes y entrega

| Entidad | Descripción |
|---------|-------------|
| `Customer` | Cliente del negocio. |
| `Address` | Dirección asociada a un cliente (entrega). |

## Pedidos

| Entidad | Descripción |
|---------|-------------|
| `Order` | Pedido. **Obligatorio** `cashShift` (turno de caja activo al crear). Incluye `customer` opcional, `address` o `manualAddress` para delivery, totales, ítems y pagos divididos. |
| `OrderItem` | Línea de pedido (producto y/o combo según reglas del DTO de creación). |
| `OrderPayment` | Línea de cobro por pedido (`paymentMethod`, `amount`); varias por pedido (split payment). |

### Enumeraciones relevantes (`model/enums/`)

- **`OrderStatus`**: `PENDING`, `PREPARING`, `READY`, `DELIVERED`, `CANCELLED`
- **`PaymentMethod`**, **`PaymentStatus`**, **`DeliveryMethod`**: definen pago y tipo de entrega.

## Turno de caja (CashShift)

| Entidad | Descripción |
|---------|-------------|
| `CashShift` | Turno de caja con estado abierto/cerrado, montos inicial/final y fechas. Un negocio tiene a lo sumo una caja **abierta** a la vez (regla de negocio en servicio). |

Los pedidos nuevos se vinculan al `CashShift` abierto. El listado operativo de pedidos se filtra por ese turno; el histórico usa otro método de repositorio. Más contexto en [CASHSHIFT_ARCHITECTURE.md](./CASHSHIFT_ARCHITECTURE.md).

## Gastos e inventario financiero

| Entidad | Descripción |
|---------|-------------|
| `Supplier` | Proveedor (contacto opcional). |
| `Supply` | Insumo o partida de gasto; categoría `SupplyCategory` (`STOCK`, `SERVICE`, `FIXED_COST`). |
| `Expense` | Gasto con fecha, total calculado, opcionalmente proveedor. |
| `ExpenseItem` | Línea de gasto: cantidad, precio unitario, subtotal; referencia a `Supply`. |

Los totales de gasto se calculan en el **servidor** (no delegar la suma al cliente). Detalle de endpoints en [API_REFERENCE.md](./API_REFERENCE.md) y flujo en [ai-context.md](./ai-context.md) (sección gastos).

## Diagrama conceptual simplificado

```
Business ─┬─ UserBusinessRole ─ User
          ├─ Product, MenuCategory, Combo, Customer, CashShift, Supplier, Supply, Expense
          └─ Order ─┬─ OrderItem
                    ├─ OrderPayment
                    └── CashShift (FK obligatoria)
```

# Referencia de API REST

Base URL: `http://localhost:8080`  
Prefijo común: `/api`

Salvo `/api/auth/**`, todas las rutas requieren cabecera:

```http
Authorization: Bearer <JWT>
```

En casi todas las rutas (excepto `/api/auth/**`, `/api/me/**` y `/api/admin/**`) se envía el query parameter **`businessId=<long>`**. Si falta o el usuario no tiene rol en ese negocio, el backend responde **400** o **403** respectivamente (filtro `BusinessScopeFilter`).

Si el negocio está en estado de facturación **VENCIDO**, el filtro `SubscriptionAccessFilter` solo permite ciertas lecturas (estadísticas: histórico de pedidos, gastos, listado de cajas); el resto devuelve **403**.

---

## Usuario actual (`/api/me`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/me/session` | `{ superAdmin, email }` para enrutar el frontend tras el login. |
| GET | `/api/me/businesses` | Lista de negocios con datos de suscripción: `billingStatus`, `expiresAt`, `warningExpirySoon`, `morosoGraceDaysLeft`. Sin `businessId` en query. |

---

## Autenticación (`/api/auth`)

| Método | Ruta | Cuerpo | Respuesta |
|--------|------|--------|-----------|
| POST | `/api/auth/login` | `LoginRequest` (email, password) | `AuthenticationResponse` (`token`) |
| POST | `/api/auth/register` | (cualquier) | **404** — registro público deshabilitado; los usuarios los crea el SuperAdmin. |

Públicas (sin JWT): solo `POST /api/auth/login`.

---

## SuperAdmin (`/api/admin`)

Requiere JWT con rol `ROLE_SUPER_ADMIN`. Sin `businessId` en query.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/businesses` | Lista negocios (facturación incluida). |
| GET | `/api/admin/businesses/{id}` | Detalle. |
| POST | `/api/admin/businesses` | Crear negocio (`AdminCreateBusinessRequest`). |
| PATCH | `/api/admin/businesses/{id}` | Actualizar nombre / facturación. |
| GET | `/api/admin/users` | Lista usuarios y roles por negocio. |
| GET | `/api/admin/users/{id}` | Detalle usuario. |
| POST | `/api/admin/users` | Crear usuario tenant. |
| PATCH | `/api/admin/users/{id}` | Datos y contraseña opcional. |
| POST | `/api/admin/users/{id}/roles` | Asignar o reemplazar rol en un negocio (`businessId`, `role`). |
| DELETE | `/api/admin/users/{id}/roles?businessId=` | Quitar rol en ese negocio. |

---

## Productos (`/api/products`)

| Método | Ruta | Parámetros |
|--------|------|------------|
| POST | `/api/products` | `?businessId=` + `ProductRequest` |
| GET | `/api/products` | `?businessId=` |
| PUT | `/api/products/{id}` | `?businessId=` + `ProductRequest` |
| DELETE | `/api/products/{id}` | `?businessId=` |

---

## Combos (`/api/combos`)

| Método | Ruta | Parámetros |
|--------|------|------------|
| POST | `/api/combos` | `?businessId=` + `ComboRequest` |
| GET | `/api/combos` | `?businessId=` |
| DELETE | `/api/combos/{id}` | `?businessId=` |

---

## Categorías de menú (`/api/menu-categories`)

| Método | Ruta | Parámetros |
|--------|------|------------|
| GET | `/api/menu-categories` | `?businessId=` — lista categorías; crea defaults (Pizzas, Empanadas, Bebidas, Otros) si faltan |
| POST | `/api/menu-categories` | `?businessId=` + `MenuCategoryRequest` (`name`) |
| DELETE | `/api/menu-categories/{id}` | `?businessId=` |

Los productos referencian categoría por nombre (`Product.category`); la categoría debe existir en `menu_categories`.

---

## Clientes (`/api/customers`)

| Método | Ruta | Parámetros |
|--------|------|------------|
| POST | `/api/customers` | `?businessId=` + `CustomerRequest` |
| GET | `/api/customers` | `?businessId=` |
| GET | `/api/customers/{id}` | `?businessId=` |
| PUT | `/api/customers/{id}` | `?businessId=` + `CustomerRequest` |
| DELETE | `/api/customers/{id}` | `?businessId=` |

---

## Direcciones (anidadas bajo cliente)

Base: `/api/customers/{customerId}/addresses`

| Método | Ruta | Parámetros |
|--------|------|------------|
| POST | `/api/customers/{customerId}/addresses` | `?businessId=` + `AddressRequest` |
| GET | `/api/customers/{customerId}/addresses` | `?businessId=` |
| GET | `/api/customers/{customerId}/addresses/{addressId}` | `?businessId=` |
| PUT | `/api/customers/{customerId}/addresses/{addressId}` | `?businessId=` + `AddressRequest` |
| DELETE | `/api/customers/{customerId}/addresses/{addressId}` | `?businessId=` |

---

## Pedidos (`/api/orders`)

| Método | Ruta | Descripción breve |
|--------|------|-------------------|
| POST | `/api/orders?businessId=` | Crea pedido; exige **caja abierta** (`CashShift`) |
| GET | `/api/orders?businessId=` | Lista pedidos del **turno de caja abierto** |
| GET | `/api/orders/historic?businessId=` | Histórico sin filtrar por turno actual |
| PUT | `/api/orders/{id}?businessId=` | Actualiza estado (`UpdateOrderStatusRequest`) |
| PATCH | `/api/orders/{id}/details?businessId=` | Pago, entrega, cliente, **`items`**, **`payments`** (`UpdateOrderDetailsRequest`) |

**`PATCH .../details`:**

- `items`: reemplazo completo de líneas del pedido (recalcula total). **Rechazado** si `orderStatus` es `DELIVERED`.
- `payments`: lista de `{ paymentMethod, amount }` para **pago dividido**; reemplaza pagos previos del pedido. Si se envía, debe cubrir el total cuando `paymentStatus` es `PAID`.
- `deliveryFee`, `customerId`, `addressId`, `manualAddress`, métodos de pago/entrega: según DTO.

Respuesta incluye `payments[]` en `OrderResponse`.

---

## Turnos de caja (`/api/cash-shifts`)

| Método | Ruta | Notas |
|--------|------|--------|
| POST | `/api/cash-shifts?businessId=` | Abre caja; cuerpo `CashShiftRequest` (`startAmount`) |
| PUT | `/api/cash-shifts/close?businessId=` | Cierra caja; cuerpo `CloseCashShiftRequest` (`endAmount`) |
| GET | `/api/cash-shifts/open?businessId=` | Caja abierta; **204 No Content** si no hay |
| GET | `/api/cash-shifts/{id}?businessId=` | Una caja por id |
| GET | `/api/cash-shifts?businessId=` | Lista todas las cajas del negocio |

---

## Proveedores (`/api/suppliers`)

| Método | Ruta | Parámetros extra |
|--------|------|------------------|
| POST | `/api/suppliers` | `?businessId=` |
| GET | `/api/suppliers` | `?businessId=` |
| GET | `/api/suppliers/{id}` | `?businessId=` |
| PUT | `/api/suppliers/{id}` | `?businessId=` |
| DELETE | `/api/suppliers/{id}` | `?businessId=` |
| GET | `/api/suppliers/search` | `?businessId=&name=` |

---

## Insumos / partidas (`/api/supplies`)

| Método | Ruta | Parámetros extra |
|--------|------|------------------|
| POST | `/api/supplies` | `?businessId=` |
| GET | `/api/supplies` | `?businessId=` |
| GET | `/api/supplies/{id}` | `?businessId=` |
| PUT | `/api/supplies/{id}` | `?businessId=` |
| DELETE | `/api/supplies/{id}` | `?businessId=` |
| GET | `/api/supplies/category/{category}` | `?businessId=` |
| GET | `/api/supplies/search` | `?businessId=&name=` |

---

## Gastos (`/api/expenses`)

| Método | Ruta | Parámetros extra |
|--------|------|------------------|
| POST | `/api/expenses` | `?businessId=` + `ExpenseRequest` |
| GET | `/api/expenses` | `?businessId=` |
| GET | `/api/expenses/{id}` | `?businessId=` |
| PUT | `/api/expenses/{id}` | `?businessId=` |
| DELETE | `/api/expenses/{id}` | `?businessId=` |
| GET | `/api/expenses/date-range` | `?businessId=&startDate=&endDate=` |
| GET | `/api/expenses/supplier/{supplierId}` | `?businessId=` |

---

## Errores

Los detalles de formato de error HTTP los centraliza `GlobalExceptionHandler` en el backend. Los códigos habituales: **400** validación/negocio, **401** no autenticado, **404** entidad no encontrada.

Para contratos exactos de cada DTO, inspeccionar el paquete `com.pizzeria.backend.dto` en el código fuente.

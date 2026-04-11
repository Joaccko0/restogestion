# Autenticación y multi-tenant

## JWT (backend)

- Tras `POST /api/auth/login` o `POST /api/auth/register`, la respuesta incluye un campo **`token`** (`AuthenticationResponse`).
- El cliente debe enviar: `Authorization: Bearer <token>` en cada petición a `/api/*` excepto autenticación.
- El filtro `JwtAuthenticationFilter` valida el token; la cadena de seguridad está en `SecurityConfig`.
- Expiración por defecto: 24 h (`application.yaml`, `application.security.jwt.expiration`).
- Secreto: variable `JWT_SECRET_KEY` en `application.yaml` (desarrollo tiene valor por defecto). En el perfil **`prod`** es obligatorio y no hay valor por defecto (`application-prod.yaml`).

## SuperAdmin

- Un usuario puede tener `superAdmin = true` en base de datos (sin filas en `user_business_roles`).
- Sus autoridades son solo `ROLE_SUPER_ADMIN`; puede llamar a `/api/admin/**` y no debe operar con `businessId` en rutas tenant.
- Las rutas `/api/admin/**` están protegidas con `@PreAuthorize("hasRole('SUPER_ADMIN')")` y **no** pasan por `BusinessScopeFilter`.

## Facturación SaaS por negocio

- Cada negocio tiene `billingStatus` (GRATIS, VIGENTE, MOROSO, VENCIDO) y opcionalmente `expiresAt`.
- Reglas: período de gracia de 10 días tras `expiresAt` antes de pasar a VENCIDO; aviso en UI si faltan ≤5 días para el vencimiento si está VIGENTE.
- Con estado **VENCIDO**, el tenant solo puede usar las lecturas permitidas por `SubscriptionAccessFilter` (estadísticas).

## Alcance de negocio (anti-IDOR)

- Casi todos los endpoints bajo `/api/**` (excepto `/api/auth/**`) llevan el query parameter **`businessId`**.
- Tras autenticar al usuario, el filtro **`BusinessScopeFilter`** (configurado después de `JwtAuthenticationFilter`) exige:
  - Presencia de `businessId` en la query → si falta o no es numérico: **400**.
  - Que el usuario tenga un `UserBusinessRole` con ese `businessId` → si no: **403**.
- La lógica reutilizable está en `BusinessAccessService`.
- Las rutas **`/api/me/**`** no exigen `businessId` en query (contexto del usuario autenticado).

## Contexto de negocio en el cliente

- `GET /api/me/businesses` (autenticado) devuelve la lista de negocios a los que el usuario tiene acceso (`{ id, name }`).
- El frontend (`BusinessContext`) obtiene esa lista y usa el **primer** negocio como negocio actual (adecuado para el piloto de un solo cliente).

## CORS

- Orígenes permitidos: propiedad `app.cors.allowed-origins` en `application.yaml`, por defecto sobrescribible con la variable de entorno **`APP_CORS_ORIGINS`** (lista separada por comas, p. ej. `https://app.ejemplo.com,http://localhost:5173`).
- El bean `CorsConfigurationSource` en `SecurityConfig` aplica esa lista.

## Multi-tenant vía `businessId`

- Los servicios siguen validando que los recursos pertenezcan al `businessId` indicado en las consultas JPA.
- El JWT identifica al **usuario**; el **filtro de alcance** impide usar un `businessId` que no corresponda a los roles del usuario.

## Roles

- `Role.OWNER` y `Role.EMPLOYEE` existen en el modelo; la configuración actual de seguridad **no** restringe endpoints por rol (cualquier usuario autenticado con acceso al negocio puede invocar las APIs protegidas). Si se requiere separación de permisos, habrá que añadir reglas en `SecurityConfig` o `@PreAuthorize`.

## Sesión en el frontend

- Token guardado en `localStorage` (`jwt_token`).
- Ante **401** en respuestas (salvo login/register), el interceptor de Axios limpia tokens y redirige a `/login`.

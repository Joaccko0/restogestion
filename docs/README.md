# Documentación — Proyecto Pizzeria

Monorepo con **backend Spring Boot** (`backend/`) y **frontend React + Vite + TypeScript** (`frontend/`). Esta carpeta concentra la documentación técnica y de producto.

## Por dónde empezar

| Rol | Documento recomendado |
|-----|------------------------|
| Desarrollador nuevo en el repo | [SETUP_AND_RUN.md](./SETUP_AND_RUN.md), luego [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Integración frontend ↔ API | [API_REFERENCE.md](./API_REFERENCE.md), [FRONTEND.md](./FRONTEND.md) |
| UX/UI responsive mobile | [responsive-frontend/README.md](./responsive-frontend/README.md) |
| Modelo de datos y reglas | [DOMAIN_MODEL.md](./DOMAIN_MODEL.md) |
| Seguridad y multi-tenant | [AUTH_AND_MULTITENANCY.md](./AUTH_AND_MULTITENANCY.md) |
| Migraciones PostgreSQL / deploy | [MIGRATIONS.md](./MIGRATIONS.md) |
| Contexto breve para asistentes / IA | [ai-context.md](./ai-context.md) |

## Despliegue piloto (1 cliente)

Checklist y variables: sección **Perfil `prod`**, **Despliegue automático** y **Checklist rápido piloto** en [SETUP_AND_RUN.md](./SETUP_AND_RUN.md). Incluye CORS, JWT, `VITE_API_BASE_URL`, migraciones SQL y desactivación de usuarios demo en producción.

## Migraciones y esquema

- Scripts versionados: `backend/migrations/`
- Documentación: [MIGRATIONS.md](./MIGRATIONS.md)
- En prod el deploy a `main` ejecuta `scripts/run-migrations.sh` antes de levantar el backend.

## SuperAdmin y facturación

- Panel de administración en la UI: ruta `/admin` (usuario SuperAdmin; ver [SETUP_AND_RUN.md](./SETUP_AND_RUN.md)).
- API documentada en [API_REFERENCE.md](./API_REFERENCE.md) (`/api/admin/**`, `/api/me/session`).
- Registro público deshabilitado (`POST /api/auth/register` → 404).

## Módulo CashShift (turnos de caja)

Documentación detallada ya existente sobre el problema del Kanban a medianoche y la solución por turnos de caja:

- [START_HERE.md](./START_HERE.md) — guía de lectura por rol
- [CASHSHIFT_README.md](./CASHSHIFT_README.md) — visión general
- [CASHSHIFT_ARCHITECTURE.md](./CASHSHIFT_ARCHITECTURE.md) — arquitectura y flujos
- [CASHSHIFT_QUICKSTART.md](./CASHSHIFT_QUICKSTART.md) — pruebas manuales
- [CASHSHIFT_IMPLEMENTATION.md](./CASHSHIFT_IMPLEMENTATION.md) — detalle de implementación
- [INDEX_OF_CHANGES.md](./INDEX_OF_CHANGES.md), [FRONTEND_SUMMARY.md](./FRONTEND_SUMMARY.md), [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md), [COMPLETION_REPORT.md](./COMPLETION_REPORT.md)

## Otros archivos

- [COMPLETION_VISUAL.txt](./COMPLETION_VISUAL.txt) — arte ASCII de referencia histórica

## Convención

- Los endpoints REST del backend están bajo el prefijo `/api`.
- El frontend de desarrollo usa Vite en `http://localhost:5173` y el API en `http://localhost:8080/api` por defecto; en producción se configura con `VITE_API_BASE_URL` (ver [SETUP_AND_RUN.md](./SETUP_AND_RUN.md)).

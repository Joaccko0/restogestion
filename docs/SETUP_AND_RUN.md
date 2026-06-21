# Instalación y ejecución

## Requisitos

| Componente | Versión / notas |
|------------|-----------------|
| Java | **21** (JDK; el script `start.ps1` intenta configurar `JAVA_HOME` vía `scripts/JavaHome.ps1`) |
| Node.js | LTS reciente (para `npm` en `frontend/`) |
| Maven | Incluido como `backend/mvnw` / `mvnw.cmd` |
| PostgreSQL | **16** recomendado; en desarrollo se puede usar Docker (ver abajo) |

## Base de datos con Docker (desarrollo)

En `backend/docker-compose.yml` (no confundir con el `docker-compose.yml` de la **raíz**, que es el stack de producción en VPS):

- Contenedor: `pizzeria_db`
- Puerto: `5432`
- Base de datos: `pizzeria_db`
- Usuario / contraseña: `postgres` / `postgres`

```bash
cd backend
docker compose up -d
```

La URL JDBC por defecto está en `backend/src/main/resources/application.yaml`:

- `jdbc:postgresql://localhost:5432/pizzeria_db`

Se pueden sobrescribir con variables de entorno: `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`.

## Variables de entorno relevantes (backend)

| Variable | Uso |
|----------|-----|
| `SPRING_DATASOURCE_*` | Conexión a PostgreSQL |
| `JWT_SECRET_KEY` | Secreto en **Base64** para firmar JWT (obligatorio en perfil `prod`; en desarrollo hay default en `application.yaml`) |
| `JWT_EXPIRATION_MS` | Opcional; duración del token (por defecto 86400000 ms) |
| `APP_CORS_ORIGINS` | Orígenes CORS separados por comas (por defecto: `http://localhost:5173` vía `application.yaml`) |
| `SPRING_PROFILES_ACTIVE` | Perfil Spring; usar `prod` para despliegue piloto (ver abajo) |
| `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD` | Solo desarrollo (`!prod`): credenciales del usuario SuperAdmin sembrado automáticamente |
| `APP_BILLING_RECALCULATE_CRON` | Opcional: expresión cron para recalcular estados de facturación de negocios (por defecto diaria 03:00) |

## SuperAdmin (desarrollo)

Con perfil distinto de `prod`, se crea un usuario **SuperAdmin** único si no existe (ver `SuperAdminDataLoader`):

- Por defecto: `superadmin@pizzeria.local` / `superadmin123` (sobrescribible con `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD`).
- Accede al panel en `/admin` tras el login (misma pantalla que el resto de usuarios).

## SuperAdmin (producción)

En **`SPRING_PROFILES_ACTIVE=prod`** no se ejecutan `SuperAdminDataLoader` ni `HardcodedUserDataLoader`. **No hay credenciales SuperAdmin predefinidas en el repo para prod**: el usuario lo creaste manualmente al montar el piloto (SQL, script o copia desde dev).

Para ver qué SuperAdmin existe en el VPS:

```bash
docker exec -it restogestion-db psql -U postgres -d restogestion \
  -c "SELECT id, email, super_admin FROM app_users WHERE super_admin = true;"
```

Si no hay filas, hay que insertar un usuario con `super_admin = true` y contraseña **BCrypt** (mismo algoritmo que Spring Security). Ejemplo de flujo:

1. Generar hash en local (perfil dev): arrancar backend y usar el encoder, o copiar el hash de un usuario dev desde `app_users`.
2. Insertar en prod (ajustar email y hash):

```sql
INSERT INTO app_users (first_name, last_name, email, password, super_admin, created_at, updated_at)
VALUES (
  'Super', 'Admin', 'tu-email@dominio.com',
  '$2a$10$...hash_bcrypt...',
  true, NOW(), NOW()
);
```

Las credenciales de dev (`superadmin@pizzeria.local` / `superadmin123`) **solo existen en prod si las insertaste explícitamente**.

## Variables de entorno (frontend)

| Variable | Uso |
|----------|-----|
| `VITE_API_BASE_URL` | URL base del API **incluyendo** `/api` (ej. `https://api.tudominio.com/api`). Si no se define, el cliente usa `http://localhost:8080/api`. |

Copia [frontend/.env.example](../frontend/.env.example) a `frontend/.env` o `frontend/.env.local` y ajusta.

## Arranque en Windows

- **`start.ps1`** (o **`start.bat`**): inicia backend (`mvnw spring-boot:run`) y frontend (`npm run dev`) en paralelo, con logs en `%TEMP%`.
- Si no existe `node_modules` en `frontend/`, el script ejecuta `npm install`.

## Arranque manual

**Terminal 1 — base de datos** (si no usas Docker, instancia PostgreSQL local con la misma URL/usuario).

**Terminal 2 — backend**

```bash
cd backend
./mvnw.cmd spring-boot:run
```

En Linux/macOS: `./mvnw spring-boot:run`.

**Terminal 3 — frontend**

```bash
cd frontend
npm install
npm run dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:8080`

## Usuario demo (solo perfil por defecto, no `prod`)

Con el perfil **por defecto** (sin `prod`), el componente `HardcodedUserDataLoader` (`@Profile("!prod")`) crea o actualiza un usuario y negocio de prueba (ver `backend/.../bootstrap/HardcodedUserDataLoader.java`):

- Email: `owner@pizzeria.local`
- Contraseña: `password123`
- Negocio: `Pizzeria Demo`

El frontend obtiene el `businessId` real vía `GET /api/me/businesses` después del login.

## Perfil `prod` (piloto en producción)

Archivo: [backend/src/main/resources/application-prod.yaml](../backend/src/main/resources/application-prod.yaml).

- `spring.jpa.hibernate.ddl-auto: validate` (el esquema debe existir; no se auto-crean tablas).
- Sin `show-sql`.
- Datasource y `JWT_SECRET_KEY` **sin valores por defecto** (deben venir del entorno).
- **`HardcodedUserDataLoader` desactivado** (no crea ni resetea usuarios demo).

Ejemplo de arranque:

```bash
set SPRING_PROFILES_ACTIVE=prod
set SPRING_DATASOURCE_URL=jdbc:postgresql://host:5432/pizzeria_db
set SPRING_DATASOURCE_USERNAME=...
set SPRING_DATASOURCE_PASSWORD=...
set JWT_SECRET_KEY=<base64_seguro>
set APP_CORS_ORIGINS=https://tu-frontend.com
cd backend && mvnw.cmd spring-boot:run
```

Crear usuarios y negocios en producción mediante el panel SuperAdmin (`/admin`) o SQL directo.

## Migraciones de base de datos

Prod usa `ddl-auto: validate`: los cambios de esquema van en `backend/migrations/`. Guía completa: [MIGRATIONS.md](./MIGRATIONS.md).

Desarrollo (contenedor `pizzeria_db`):

```bash
POSTGRES_CONTAINER=pizzeria_db POSTGRES_DB=pizzeria_db ./scripts/run-migrations.sh
```

## Despliegue automático (VPS)

Push a `main` dispara [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml):

1. SSH al VPS (`/opt/restogestion`)
2. `git reset --hard origin/main`
3. `docker compose build`
4. Levantar PostgreSQL y ejecutar **`scripts/run-migrations.sh`**
5. `docker compose up -d` (backend + frontend)

Variables en `.env` en el servidor: `POSTGRES_PASSWORD`, `JWT_SECRET_KEY`, `APP_CORS_ORIGINS`, `VITE_API_BASE_URL`, etc. (ver comentarios en [`docker-compose.yml`](../docker-compose.yml) de la raíz).

## Compilación y comprobaciones

```bash
cd backend && ./mvnw.cmd clean compile
cd frontend && npm run build
```

## Checklist rápido piloto (1 cliente)

- [ ] PostgreSQL con esquema actualizado (`./scripts/run-migrations.sh` en el VPS; ver [MIGRATIONS.md](./MIGRATIONS.md)).
- [ ] `JWT_SECRET_KEY` largo y aleatorio, codificado en Base64 (coherente con `JwtService`).
- [ ] `APP_CORS_ORIGINS` con el origen HTTPS del frontend.
- [ ] `VITE_API_BASE_URL` apuntando al API público en build del frontend.
- [ ] Usuario SuperAdmin en `app_users` (`super_admin = true`) para gestionar negocios.
- [ ] Usuario de negocio con `UserBusinessRole` vinculado al `Business` correcto.

# backend-notas — API del Sistema Académico

API REST para la gestión académica: estudiantes, docentes, cursos, materias, períodos, inscripciones y calificaciones. Incluye login con JWT, tres roles (administrador, docente y estudiante) y endpoints de datos para un dashboard.

**Tecnologías:** NestJS 12, TypeScript, Prisma 7, MySQL 8, Swagger y Vitest.

Este repositorio es **solo la API**. La interfaz (React) se hace en un proyecto aparte que consume esta API.

---

## 1. Requisitos previos

| Herramienta | Versión | Comprobar con |
|---|---|---|
| Node.js | 22 o superior | `node -v` |
| npm | viene con Node | `npm -v` |
| Git | cualquiera reciente | `git --version` |
| MySQL Server | 8.x (también sirve MariaDB 10.6+) | ver sección 2 |
| MySQL Workbench (opcional) | 8.x | para ver las tablas con interfaz gráfica |

---

## 2. Instalar y preparar MySQL en tu computadora

Elige **una** de las tres opciones. Al terminar, tendrás un servidor MySQL en `localhost:3306` y dos bases de datos vacías: `academia` (para desarrollar) y `academia_test` (para las pruebas automáticas).

> MySQL Workbench es solo un **cliente gráfico**: no incluye el servidor. Si solo instalaste Workbench, todavía te falta una de estas opciones.

### Opción A — Instalador oficial de MySQL (recomendada)

1. Descarga **MySQL Installer** desde <https://dev.mysql.com/downloads/installer/> (versión *web community* o *full*).
2. Ejecútalo y elige **Custom** o **Server only**. Selecciona *MySQL Server 8.x* (y *MySQL Workbench* si lo quieres).
3. En la configuración del servidor:
   - *Config Type*: **Development Computer**.
   - Puerto: **3306**.
   - *Authentication Method*: usa el que viene recomendado (*Strong Password Encryption*).
   - Define la contraseña del usuario `root` y **anótala**: la usarás en el `.env`.
   - Deja marcado *Configure MySQL Server as a Windows Service* con inicio automático.
4. Termina el asistente. Comprueba en `services.msc` que el servicio `MySQL80` esté **En ejecución**.

### Opción B — Docker

Si ya tienes Docker Desktop:

```bash
docker run --name mysql-academia -e MYSQL_ROOT_PASSWORD=cambia_esta_clave -p 3306:3306 -d mysql:8.4
```

Para iniciarlo o detenerlo después: `docker start mysql-academia` / `docker stop mysql-academia`.

### Opción C — Sin permisos de administrador (zip portable)

Útil en computadoras de laboratorio donde no puedes instalar programas.

1. Descarga el **ZIP de MySQL Community Server para Windows (x86, 64-bit)** desde <https://dev.mysql.com/downloads/mysql/> y descomprímelo, por ejemplo en `C:\Users\TU_USUARIO\mysql`.
2. Dentro de esa carpeta crea el archivo `my.ini` (cambia la ruta por la tuya y usa `/` en lugar de `\`):
   ```ini
   [mysqld]
   basedir=C:/Users/TU_USUARIO/mysql
   datadir=C:/Users/TU_USUARIO/mysql-data
   port=3306
   bind-address=127.0.0.1
   ```
3. Inicializa la base (una sola vez). Esto deja a `root` **sin contraseña**:
   ```bash
   bin\mysqld --defaults-file=my.ini --initialize-insecure --console
   ```
4. Arranca el servidor y **deja esa ventana abierta** mientras trabajas:
   ```bash
   bin\mysqld --defaults-file=my.ini --console
   ```

### Crear las bases de datos

Con el servidor en marcha, abre una consola de SQL (MySQL Workbench → conexión `localhost:3306` con usuario `root`, o el cliente `mysql`) y ejecuta:

```sql
CREATE DATABASE academia;
CREATE DATABASE academia_test;
```

**Crear la conexión en Workbench:** en la pantalla de inicio pulsa **+** junto a *MySQL Connections* → *Connection Name*: `academia` → *Hostname*: `localhost` → *Port*: `3306` → *Username*: `root` → **Test Connection** (te pedirá la contraseña) → OK.

---

## 3. Configurar el proyecto

### 3.1 Clonar e instalar dependencias

```bash
git clone https://github.com/Jesus-Reynaldo/academia-backend.git
cd academia-backend
npm install
```

### 3.2 Crear el archivo `.env`

Copia la plantilla:

```bash
cp .env.example .env        # en PowerShell: Copy-Item .env.example .env
```

Edita `.env` y completa:

```env
DATABASE_URL="mysql://root:TU_CLAVE@localhost:3306/academia"
PORT=3000

JWT_SECRET="un-texto-largo-y-aleatorio"
JWT_EXPIRES_IN_SECONDS=3600
NOTA_APROBACION=51
```

- **`DATABASE_URL`**: formato `mysql://usuario:contraseña@servidor:puerto/base`. Si tu `root` **no tiene contraseña** (opción C), deja el espacio vacío: `mysql://root:@localhost:3306/academia`. Si la contraseña tiene símbolos como `@`, `#`, `/` o `:`, escríbelos codificados (`@` → `%40`, `#` → `%23`, `/` → `%2F`, `:` → `%3A`).
- **`JWT_SECRET`**: es obligatorio; sin él la aplicación no arranca. Genera uno así y pégalo entre las comillas:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
  ```
- **`SEED_ADMIN_PASSWORD`** (opcional): contraseña de las cuentas de ejemplo. Si la dejas vacía, el seed genera una aleatoria y te la muestra en consola.

> `.env` contiene secretos y **nunca debe subirse a GitHub** (ya está en `.gitignore`).

### 3.3 Crear las tablas y cargar datos de ejemplo

```bash
npx prisma generate        # genera el cliente de Prisma
npx prisma migrate deploy  # crea las tablas en la base `academia`
npm run prisma:seed        # carga datos de ejemplo y las cuentas de prueba
```

> `prisma:seed` **borra todos los datos** de la base antes de insertar los de ejemplo. Úsalo solo en tu base de desarrollo.

Al terminar, el seed imprime las cuentas creadas. Si no definiste `SEED_ADMIN_PASSWORD`, **copia la contraseña que muestra en consola**: no se vuelve a mostrar (si la pierdes, vuelve a ejecutar el seed).

| Rol | Correo |
|---|---|
| Administrador | `admin@colegio.edu` |
| Docente | `ana.garcia@colegio.edu` |
| Estudiante | `juan.perez@colegio.edu` |

Las tres cuentas comparten la misma contraseña.

---

## 4. Levantar el servidor

```bash
npm run start:dev
```

Deja la terminal abierta (el servidor se reinicia solo al guardar cambios). Cuando veas `Nest application successfully started`:

| Qué | Dirección |
|---|---|
| Prueba rápida (debe responder `Hello World!`) | <http://localhost:3000/api/v1> |
| Documentación interactiva (Swagger) | <http://localhost:3000/api/docs> |

Para usar otro puerto: cambia `PORT` en el `.env`.

> Al arrancar pueden aparecer mensajes de error `ObserveAgentWorker`. Son de una herramienta de monitoreo que no está configurada; **no afectan** al funcionamiento y puedes ignorarlos.

### Probar el login en Swagger

1. Abre <http://localhost:3000/api/docs> → **Auth** → `POST /api/v1/auth/login` → **Try it out**.
2. Escribe el cuerpo con una de las cuentas de la sección 3.3:
   ```json
   { "email": "admin@colegio.edu", "password": "LA_CONTRASEÑA_DEL_SEED" }
   ```
3. Pulsa **Execute**: la respuesta trae un `accessToken`. Cópialo (sin comillas).
4. Pulsa **Authorize** (arriba a la derecha), pega el token y confirma. El candado queda cerrado.
5. Ahora prueba cualquier endpoint, por ejemplo `GET /api/v1/dashboard/resumen`.

El token dura 1 hora. Si Swagger responde `401`, vuelve a iniciar sesión.

### Qué puede hacer cada rol

- **Administrador:** todo.
- **Docente:** consultar catálogos, ver estudiantes y registrar o editar **sus propias** calificaciones.
- **Estudiante:** ver **solo sus propios** datos, inscripciones, calificaciones e historial académico.

Si un rol intenta algo que no le corresponde, la API responde `403`; sin token responde `401`.

### Conectar tu frontend (React)

- Usa como base `http://localhost:3000/api/v1` y envía el token en cada petición: `Authorization: Bearer <accessToken>`.
- La API solo acepta peticiones desde `localhost`, `127.0.0.1` o `[::1]` (por ejemplo, `http://localhost:5173`). Si abres tu frontend con otro nombre o desde otra computadora, el navegador bloqueará las llamadas (error de CORS).

---

## 5. Pruebas automáticas

```bash
npm test            # pruebas unitarias (no necesitan base de datos)
npm run test:e2e    # pruebas de extremo a extremo (usan MySQL)
```

Para las pruebas e2e necesitas un archivo `.env.test` con una base **distinta** a la de desarrollo:

```env
DATABASE_URL="mysql://root:TU_CLAVE@localhost:3306/academia_test"
JWT_SECRET="cualquier-texto-largo-para-pruebas"
```

> ⚠️ Cada ejecución de `test:e2e` **borra y recrea** la base indicada en `.env.test`. Nunca apuntes `.env.test` a `academia` ni a una base con datos que quieras conservar.

Otros comandos útiles: `npm run lint` (revisar el código) y `npm run build` (compilar).

---

## 6. Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| `ECONNREFUSED 127.0.0.1:3306` o `P1001: Can't reach database server` | MySQL no está en marcha. Inicia el servicio `MySQL80` (`services.msc`), el contenedor de Docker o la ventana de `mysqld` (opción C). |
| `Access denied for user 'root'` | La contraseña del `DATABASE_URL` no coincide con la de MySQL, o tiene símbolos sin codificar (ver 3.2). |
| `Unknown database 'academia'` | Falta ejecutar `CREATE DATABASE academia;` (ver sección 2). |
| `JWT_SECRET no está definido` | Falta la variable en el `.env` (ver 3.2). |
| `EADDRINUSE: address already in use :::3000` | El puerto 3000 está ocupado. Cierra el otro programa o cambia `PORT` en el `.env`. |
| `Cannot find module '.prisma/client'` o errores de tipos con Prisma | Ejecuta `npx prisma generate`. |
| `401 Unauthorized` en Swagger | Falta el token o venció. Inicia sesión de nuevo y vuelve a pulsar **Authorize**. |
| `429 Too Many Requests` en el login | Máximo 10 intentos por minuto. Espera un momento. |
| Error de CORS en el navegador | Abre tu frontend desde `http://localhost:PUERTO` (ver sección 4). |

---

## 7. Estructura del proyecto

```
prisma/          esquema, migraciones y seed
src/
  auth/          login, JWT y guards de roles
  usuario/       gestión de cuentas (solo administrador)
  dashboard/     endpoints de datos agregados para el dashboard
  estudiante/ docente/ curso/ materia/ periodo-academico/ inscripcion/ calificacion/
  common/        paginación y utilidades compartidas
test/            pruebas e2e
```

Cada módulo tiene su controlador, servicio y DTOs. La especificación funcional completa está en `doc/requirements.md`.

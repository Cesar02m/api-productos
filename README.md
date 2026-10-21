# API REST de productos

API escolar construida con Node.js, Express y PostgreSQL. Docker Compose ejecuta la API y la base de datos. PostgreSQL conserva sus datos en el volumen nombrado `postgres_data`.

## Requisitos

- Docker Desktop con Docker Compose.
- Git, si se desea versionar el proyecto.

## Inicio local con Docker Compose

Desde PowerShell, en la carpeta del proyecto:

```powershell
Copy-Item .env.example .env
notepad .env
```

Puedes cambiar `DB_PASSWORD` en `.env` por una contraseña local propia. Después ejecuta:

```powershell
docker compose up --build -d
docker compose ps
docker compose logs -f api
```

La primera inicialización crea la base `productos_db`, la tabla `productos` y cinco registros de ejemplo. El script usa inserciones idempotentes. Los datos se conservan al reiniciar o recrear los contenedores gracias a `postgres_data`.

## Despliegue en Render con Docker

Render debe usar una base PostgreSQL administrada y separada para este proyecto. No conectes este servicio a bases de datos de otras prácticas. La inicialización de `db/init.sql` se ejecuta idempotentemente al arrancar el contenedor de la API; los cinco productos solo se insertan si sus IDs aún no existen.

1. Crea primero una base **PostgreSQL** nueva en Render para esta práctica (por ejemplo, `productos-db`). Elige la misma región que tendrá la API y conserva la base de datos de las otras prácticas intacta.
2. En el formulario **New Web Service**, selecciona el repositorio `Cesar02m/api-productos` y la rama principal que contiene este código.
3. Selecciona **Docker** como Language. Deja el Dockerfile en `./Dockerfile` (raíz del repositorio). No configures Build Command ni Start Command personalizados: el Dockerfile construye la imagen y ejecuta la inicialización seguida por `npm start`.
4. En **Environment Variables**, crea `DATABASE_URL` con la **Internal Database URL** de la base nueva `productos-db`. No uses External Database URL ni copies credenciales a GitHub.
5. En **Health Check Path**, configura `/health`. Render proporciona `PORT`; el servidor ya lo usa y escucha en `0.0.0.0`.
6. Crea el Web Service y revisa los logs del primer deploy. Después, abre `https://<nombre-del-servicio>.onrender.com/health` y `/api/productos`.

La URL interna solo resuelve entre servicios de Render que comparten región y workspace. Mantén la API y su PostgreSQL en la misma región. El servicio local de Compose sigue usando `DB_HOST=db`; en Render, `DATABASE_URL` tiene precedencia sobre las variables locales `DB_*`.

Al terminar, copia la URL pública del Web Service para configurarla como base URL en n8n. No hay que desplegar n8n ni modificar ninguna otra base para completar esta API.

Prueba los endpoints desde otra ventana de PowerShell:

```powershell
Invoke-RestMethod http://localhost:3000/
Invoke-RestMethod http://localhost:3000/health
Invoke-RestMethod http://localhost:3000/api/productos
Invoke-RestMethod http://localhost:3000/api/productos/1
```

Crear un producto:

```powershell
$producto = @{
  nombre = 'Webcam HD'
  descripcion = 'Webcam USB para videollamadas.'
  precio = 749.90
  stock = 12
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/productos -ContentType 'application/json' -Body $producto
```

Actualizar un producto (PUT admite actualizar uno o más campos):

```powershell
$cambios = @{ stock = 10; precio = 729.90 } | ConvertTo-Json
Invoke-RestMethod -Method Put -Uri http://localhost:3000/api/productos/6 -ContentType 'application/json' -Body $cambios
```

Eliminarlo:

```powershell
Invoke-RestMethod -Method Delete -Uri http://localhost:3000/api/productos/6
```

Algunos comandos de mantenimiento:

```powershell
docker compose logs -f db
docker compose down
```

`docker compose down` conserva el volumen. Para borrar también todos los datos locales de PostgreSQL, usa `docker compose down -v`.

## Ejecución directa de la API (opcional)

Si tienes Node.js 20 o superior, instala dependencias con `npm install`, copia `.env.example` a `.env` y arranca PostgreSQL con Compose. Para que la API local se conecte al puerto publicado, agrega `DB_HOST=localhost` al `.env`, luego ejecuta `npm start` (o `npm run dev` en desarrollo). Compose asigna `DB_HOST=db` automáticamente a la API dentro del contenedor.

## Rutas

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/` | Mensaje de estado de la API |
| GET | `/health` | Estado de la API y conexión a PostgreSQL |
| GET | `/api/productos` | Lista de productos |
| GET | `/api/productos/:id` | Consulta por ID |
| POST | `/api/productos` | Crea un producto |
| PUT | `/api/productos/:id` | Actualiza uno o más campos del producto |
| DELETE | `/api/productos/:id` | Elimina un producto |

Los productos requieren `nombre` (texto de 1 a 150 caracteres), `descripcion` (texto), `precio` (número mayor o igual a cero) y `stock` (entero mayor o igual a cero). Las consultas usan parámetros SQL. Los errores se devuelven como JSON.

## Versionado

No subas `.env` al repositorio. Puedes versionar el proyecto así:

```powershell
git init
git add .
git commit -m "Crear API REST de productos"
```

La publicación en GitHub, Render y la conexión con n8n se puede configurar después de verificar la ejecución local.

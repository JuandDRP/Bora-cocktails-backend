# BORA Cocktails Backend

API REST empresarial privada para gestión de productos, sabores, inventario, consumo, ventas, precios, dashboard y reportes.

## Stack

- Node.js + TypeScript
- NestJS 12
- MongoDB + Mongoose 9
- class-validator / class-transformer
- Swagger/OpenAPI
- Jest

No se utiliza Prisma, PostgreSQL, MySQL ni autenticación/autorización en esta versión.

## Requisitos

- Node.js 22.23.3+
- npm 10+
- MongoDB 7+ con replica set para transacciones. MongoDB Atlas funciona con transacciones de forma nativa.

## Instalación

```bash
npm install
cp .env.example .env
npm run build
```

En Windows PowerShell puedes copiar el archivo con:

```powershell
Copy-Item .env.example .env
```

Configura `MONGODB_URI` en `.env`.

## MongoDB local con Docker

Se incluye `docker-compose.yml` para levantar un MongoDB de un solo nodo con replica set `rs0`, requisito para las transacciones críticas.

```bash
docker compose up -d
```

Después verifica que MongoDB esté disponible y ejecuta:

```bash
npm run seed
```

## Ejecución

```bash
npm run start:dev
```

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`
- Health: `GET /health`

## Idempotencia

Los endpoints mutantes críticos requieren el header:

```http
Idempotency-Key: <clave-unica-del-request>
```

Aplica a:

- `POST /inventory/entries`
- `POST /inventory/adjustments`
- `POST /consumption`
- `POST /sales`

El mismo `Idempotency-Key` dentro de la misma operación no vuelve a ejecutar el descuento/registro. La clave queda asociada al resultado exitoso.

## Respuestas

Éxito:

```json
{
  "success": true,
  "message": "Operación realizada correctamente",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "code": "INSUFFICIENT_STOCK",
  "message": "Stock insuficiente. Disponible: 3 bolsas.",
  "data": {
    "available": 3,
    "requested": 4
  }
}
```

## Arquitectura

```text
src/
├─ app.module.ts
├─ main.ts
├─ config/
├─ common/
│  ├─ constants/
│  ├─ exceptions/
│  ├─ filters/
│  ├─ interceptors/
│  ├─ pipes/
│  └─ utils/
├─ database/
│  └─ seed.ts
└─ modules/
   ├─ products/
   ├─ flavors/
   ├─ inventory/
   ├─ inventory-movements/
   ├─ consumption/
   ├─ sales/
   ├─ pricing/
   ├─ dashboard/
   └─ reports/
```

No existen módulos `auth` ni `users`. La ausencia actual de autenticación no bloquea que estos módulos puedan incorporarse posteriormente porque la lógica de negocio no depende de un usuario autenticado.

## Endpoints principales

### Products

```text
GET    /products
POST   /products
PATCH  /products/:id
DELETE /products/:id
```

### Flavors

```text
GET    /flavors
POST   /flavors
PATCH  /flavors/:id
```

### Inventory

```text
GET    /inventory
POST   /inventory
GET    /inventory/:id
PATCH  /inventory/:id
POST   /inventory/entries
POST   /inventory/adjustments
```

El `POST /inventory` crea una existencia inicial y registra automáticamente un movimiento `ENTRADA`, por lo que el stock no aparece sin trazabilidad.

### Inventory movements

```text
GET /inventory-movements
GET /inventory-movements/:id
```

### Consumption

```text
POST /consumption
GET  /consumption
GET  /consumption/date/:date
```

### Sales

```text
POST /sales
GET  /sales
GET  /sales/:id
GET  /sales/date/:date
```

### Pricing

```text
GET   /pricing
POST  /pricing
PATCH /pricing/:id
```

### Dashboard

```text
GET /dashboard
```

### Reports

```text
GET /reports/sales
GET /reports/inventory
GET /reports/consumption
GET /reports/products
GET /reports/flavors
```

## Ejemplo: registrar entrada

```http
POST /inventory/entries
Idempotency-Key: entrada-mora-azul-20261001-001
Content-Type: application/json
```

```json
{
  "productId": "68f000000000000000000001",
  "flavorId": "68f000000000000000000010",
  "mode": "CON_LICOR",
  "presentation": "BOLSA",
  "capacity": 6,
  "capacityUnit": "L",
  "quantity": 3,
  "unit": "BOLSA",
  "minimumStock": 1,
  "notes": "Entrada de producción"
}
```

## Ejemplo: registrar consumo

```http
POST /consumption
Idempotency-Key: consumo-20261001-mora-001
Content-Type: application/json
```

```json
{
  "consumptionDate": "2026-10-01",
  "productId": "68f000000000000000000001",
  "flavorId": "68f000000000000000000010",
  "mode": "CON_LICOR",
  "presentation": "BOLSA",
  "capacity": 6,
  "capacityUnit": "L",
  "quantity": 2,
  "unit": "BOLSA",
  "notes": "Consumo del turno"
}
```

Con stock previo de 3 bolsas, el resultado es 1 bolsa y `totalConsumed = 12 L`.

## Ejemplo: registrar venta

```http
POST /sales
Idempotency-Key: venta-20261001-0001
Content-Type: application/json
```

```json
{
  "saleDate": "2026-10-01T19:35:00.000Z",
  "paymentMethod": "EFECTIVO",
  "details": [
    {
      "type": "VASO",
      "sizeOz": 16,
      "mode": "CON_LICOR",
      "flavorIds": ["68f000000000000000000010", "68f000000000000000000011"],
      "quantity": 2
    },
    {
      "type": "JERINGA",
      "quantity": 3
    }
  ]
}
```

El backend obtiene los precios activos desde MongoDB. Un vaso de 16 oz cuesta 15.000 COP sin importar modalidad o si es simple/combinado; cada jeringa cuesta 3.000 COP. Las ventas no descuentan inventario automáticamente: el consumo diario se registra por separado para conservar la trazabilidad real del proceso operativo.

## Tests

```bash
npm test
npm run test:integration
```

Los tests unitarios cubren cálculo de precios, clasificación simple/combinado, estado de inventario y reglas de stock. Los tests de integración utilizan `mongodb-memory-server` con replica set para validar operaciones transaccionales.

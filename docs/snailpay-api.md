# SnailPay API — Contrato

SnailPay es una **pasarela de pagos simulada** que corre dentro del backend Express de SnailRacer. No se conecta a ningún servicio real ni procesa información financiera real. Todos los datos de tarjeta usados con este servicio son **ficticios**.

- **Base URL (desarrollo):** `http://localhost:3001/api/snailpay/v1`
- **Formato:** JSON (`Content-Type: application/json`)
- **Límite del body:** 10 KB

## Índice

1. [Endpoint de cobro](#1-endpoint-de-cobro)
2. [Solicitud](#2-solicitud)
3. [Respuesta](#3-respuesta)
4. [Escenarios y datos de prueba](#4-escenarios-y-datos-de-prueba)
5. [Orden de evaluación](#5-orden-de-evaluación)
6. [Error del sistema y timeout](#6-error-del-sistema-y-timeout)
7. [Ejemplos](#7-ejemplos)
8. [Mensajes para el usuario](#8-mensajes-para-el-usuario)
9. [Variables de entorno](#9-variables-de-entorno)

---

## 1. Endpoint de cobro

```
POST /api/snailpay/v1/charges
```

Crea un cobro y devuelve su resultado de forma síncrona. Todas las respuestas, exitosas o no, tienen **la misma forma JSON** (sección 3). Lo que cambia entre escenarios es el código HTTP, `status` y `status_detail`.

### Encabezados

| Encabezado                       | Obligatorio | Descripción                                                                                                                                                                                        |
| -------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Content-Type: application/json` | Sí          |                                                                                                                                                                                                    |
| `Idempotency-Key`                | No          | Cadena única por intento de cobro (UUID). Si se repite con el mismo body, el servicio devuelve la respuesta original en lugar de cobrar otra vez. Evita cobros dobles por doble clic o reintentos. |

Comportamiento de la key (P1):

- Se guarda en memoria del proceso durante 24 h (máximo 1,000 keys; se descartan las más viejas). Se pierde al reiniciar el API.
- Misma key + mismo body (sin importar el orden de las claves) → se devuelve la respuesta original con su mismo código HTTP, aunque la primera solicitud aún se esté procesando.
- Misma key + body distinto → **422** `rejected` / `invalid_request` con `errors: [{ "field": "Idempotency-Key", ... }]`.
- Las respuestas con `status: "error"` (503, 500) no se guardan: un reintento con la misma key se procesa de nuevo.
- Key vacía o de más de 255 caracteres → **400** `invalid_request`.

## 2. Solicitud

| Campo             | Tipo   | Obligatorio | Regla de validación                                                                                                                       |
| ----------------- | ------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `card_number`     | string | Sí          | Exactamente 16 dígitos; se eliminan espacios antes de validar. **No se aplica Luhn** (la tarjeta de prueba exitosa no lo cumple).         |
| `expiration_date` | string | Sí          | Formato `MM/YY`, mes de `01` a `12`.                                                                                                      |
| `cvv`             | string | Sí          | Exactamente 3 dígitos.                                                                                                                    |
| `cardholder_name` | string | Sí          | No vacío después de `trim`, máximo 80 caracteres.                                                                                         |
| `amount`          | number | Sí          | Mayor que 0 y máximo 2 decimales, en MXN. Montos mayores a `SNAILPAY_MAX_AMOUNT` (10,000) pasan esta validación y caen en el escenario 7. |
| `payer_id`        | string | Sí          | UUID del usuario registrado.                                                                                                              |
| `payer_email`     | string | Sí          | Correo válido del usuario registrado.                                                                                                     |

```json
{
  "card_number": "1234123412341234",
  "expiration_date": "12/26",
  "cvv": "543",
  "cardholder_name": "Arturo Torres",
  "amount": 250.5,
  "payer_id": "6f1c2b8e-3a4d-4c5e-9f10-1a2b3c4d5e6f",
  "payer_email": "art@example.com"
}
```

## 3. Respuesta

Todas las respuestas contienen estos 11 campos, sin excepción:

| Campo                | Tipo           | Formato                                   | Notas                                                            |
| -------------------- | -------------- | ----------------------------------------- | ---------------------------------------------------------------- |
| `id`                 | string         | `spay_` + UUID v4                         | Identificador único de la operación, también en errores.         |
| `status`             | string         | `approved` \| `rejected` \| `error`       | Estado general.                                                  |
| `status_detail`      | string         | `snake_case`                              | Detalle del resultado (sección 4).                               |
| `transaction_amount` | number \| null | 2 decimales                               | Monto solicitado. `null` si el monto enviado no es numérico.     |
| `date_created`       | string         | ISO 8601 UTC (`2026-10-04T19:20:31.512Z`) | Momento en que se procesó.                                       |
| `authorization_code` | string \| null | 6 caracteres alfanuméricos en mayúsculas  | Solo cuando `status = approved`; `null` en cualquier otro caso.  |
| `reference`          | string         | `SNL-AAAAMMDD-XXXXXX`                     | Referencia legible de la operación (6 caracteres alfanuméricos). |
| `payer_id`           | string \| null |                                           | Eco del request.                                                 |
| `payer_email`        | string \| null |                                           | Eco del request.                                                 |
| `card_number`        | string \| null | 16 dígitos                                | Eco del request. Dato **ficticio**.                              |
| `cvv`                | string \| null | 3 dígitos                                 | Eco del request. Dato **ficticio**.                              |

Campo adicional **solo** en `invalid_request`:

| Campo    | Tipo                                   | Descripción                                   |
| -------- | -------------------------------------- | --------------------------------------------- |
| `errors` | `{ field: string, message: string }[]` | Lista de campos que no pasaron la validación. |

### Tipos de referencia

Implementados en `packages/shared/src/snailpay.ts`.

```ts
type ChargeStatus = 'approved' | 'rejected' | 'error';

type ChargeStatusDetail =
  | 'accredited'
  | 'invalid_request'
  | 'invalid_security_code'
  | 'invalid_expiration_date'
  | 'insufficient_funds'
  | 'card_declined'
  | 'amount_exceeds_limit'
  | 'service_unavailable'
  | 'internal_error'
  // Generados por el cliente, nunca por el servidor:
  | 'timeout'
  | 'network_error';

interface ChargeResponse {
  id: string;
  status: ChargeStatus;
  status_detail: ChargeStatusDetail;
  transaction_amount: number | null;
  date_created: string;
  authorization_code: string | null;
  reference: string;
  payer_id: string | null;
  payer_email: string | null;
  card_number: string | null;
  cvv: string | null;
  errors?: { field: string; message: string }[];
}
```

> **Nota de seguridad:** devolver y almacenar el número completo y el CVV es un requisito del proyecto y solo es aceptable porque los datos son ficticios. PCI DSS prohíbe almacenar el CVV; en un sistema real solo se conservaría un token o los últimos 4 dígitos.

## 4. Escenarios y datos de prueba

Para todos los escenarios: `cardholder_name` no vacío, `payer_id` y `payer_email` válidos, y `amount` válido salvo que se indique otra cosa.

| #   | Escenario             | Tarjeta                                                   | Fecha             | CVV        | Monto                            | HTTP | `status`   | `status_detail`           |
| --- | --------------------- | --------------------------------------------------------- | ----------------- | ---------- | -------------------------------- | ---- | ---------- | ------------------------- |
| 1   | **Cobro exitoso**     | `1234123412341234`                                        | `12/26`           | `543`      | > 0 y ≤ 10,000                   | 201  | `approved` | `accredited`              |
| 2   | Datos inválidos       | Formato incorrecto en cualquier campo                     | —                 | —          | ≤ 0, > 2 decimales o no numérico | 400  | `rejected` | `invalid_request`         |
| 3   | CVV incorrecto        | `1234123412341234`                                        | `12/26`           | ≠ `543`    | válido                           | 402  | `rejected` | `invalid_security_code`   |
| 4   | Fecha incorrecta      | `1234123412341234`                                        | ≠ `12/26`         | `543`      | válido                           | 402  | `rejected` | `invalid_expiration_date` |
| 5   | Fondos insuficientes  | `4000000000000002`                                        | cualquiera válida | cualquiera | válido                           | 402  | `rejected` | `insufficient_funds`      |
| 6   | Tarjeta rechazada     | `4000000000000069` o cualquier tarjeta no listada         | cualquiera válida | cualquiera | válido                           | 402  | `rejected` | `card_declined`           |
| 7   | Monto excedido        | `1234123412341234`                                        | `12/26`           | `543`      | > 10,000                         | 402  | `rejected` | `amount_exceeds_limit`    |
| 8   | **Error del sistema** | `9999999999999999` (o variable de entorno, ver sección 6) | cualquiera válida | cualquiera | válido                           | 503  | `error`    | `service_unavailable`     |
| 9   | **Timeout**           | `8888888888888888`                                        | cualquiera válida | cualquiera | válido                           | —    | `error`    | `timeout`                 |
| 10  | Error inesperado      | Cualquier excepción no controlada en el servidor          | —                 | —          | —                                | 500  | `error`    | `internal_error`          |

Notas:

- **Escenario 2:** el límite de 10,000 no es error de formato; montos mayores pasan la validación y caen en el escenario 7.
- **Escenario 4:** `12/26` es la única fecha aceptada para la tarjeta de éxito. El servicio **no compara contra la fecha actual**, de modo que el caso exitoso sigue funcionando después de diciembre de 2026.
- **Escenario 9:** el servidor tarda `SNAILPAY_SLOW_DELAY_MS` (15 s por defecto) en responder; el cliente aborta a los 8 s y construye localmente la respuesta `timeout`. Si el servidor responde después, la respuesta se descarta. Tras el retraso el servidor responde **503** `error` / `service_unavailable`, nunca `approved` (P2).

## 5. Orden de evaluación

El servicio evalúa en este orden y se detiene en la primera regla que aplica. Así ninguna entrada inesperada termina en un cobro aprobado.

1. ¿`SNAILPAY_SIMULATE_OUTAGE=true`? → **503** `service_unavailable`.
2. ¿El body falla la validación de esquema? → **400** `invalid_request` + `errors`.
3. ¿La tarjeta es de escenario especial (`9999…`, `8888…`, `4000…0002`, `4000…0069`)? → respuesta de ese escenario.
4. ¿La tarjeta es `1234123412341234`?
   1. Fecha ≠ `12/26` → **402** `invalid_expiration_date`.
   2. CVV ≠ `543` → **402** `invalid_security_code`.
   3. Monto > 10,000 → **402** `amount_exceeds_limit`.
   4. Todo correcto → **201** `approved` / `accredited`.
5. Cualquier otra tarjeta → **402** `card_declined`.

Cualquier excepción no prevista se captura en `errorHandler` → **500** `internal_error`.

En esta ruta, los errores previos a la validación también usan la forma de la sección 3: JSON malformado → **400** `invalid_request` y body mayor a 10 KB → **413** `invalid_request`, ambos con `errors: [{ "field": "body", ... }]`.

## 6. Error del sistema y timeout

### Error del sistema (503)

Hay dos formas documentadas de provocarlo:

| Forma              | Cómo                                                                                             | Cuándo usarla                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Interruptor global | Iniciar el backend con `SNAILPAY_SIMULATE_OUTAGE=true`. **Todas** las solicitudes responden 503. | Desarrollo local y pruebas automatizadas                                     |
| Tarjeta de prueba  | Usar `9999999999999999` desde la UI                                                              | Cuando no se puede reiniciar el servidor (por ejemplo, en la app desplegada) |

En ambos casos **no se aprueba ni se aplica ninguna recarga**.

```bash
# Linux / macOS
SNAILPAY_SIMULATE_OUTAGE=true npm run dev -w @snailracer/api

# Windows (PowerShell)
$env:SNAILPAY_SIMULATE_OUTAGE="true"; npm run dev -w @snailracer/api
```

### Timeout

- El cliente (`snailpayClient.ts`) usa `AbortController` con un límite de **8 segundos**.
- Al abortar, genera localmente una `ChargeResponse` con `status: "error"`, `status_detail: "timeout"`, `authorization_code: null` y un `id` con prefijo `local_`.
- El saldo **no cambia**. El mensaje indica que no se aplicó ningún cargo y que puede reintentar.
- Mejora futura en un sistema real: consultar el estado del cobro por `id` o `Idempotency-Key` antes de reintentar, para conciliar cobros que sí se procesaron del lado del servidor.

### Otras respuestas locales

El cliente construye la misma respuesta local (prefijo `local_`, referencia `SNL-AAAAMMDD-LOCAL0`, `status: "error"`) cuando:

| Situación                                                                                         | `status_detail`  |
| ------------------------------------------------------------------------------------------------- | ---------------- |
| No hubo respuesta (sin conexión, servidor caído)                                                  | `network_error`  |
| La respuesta no cumple esta sección 3, o dice `approved` sin HTTP 201, sin código o con monto ≤ 0 | `internal_error` |

En ningún caso cambia el saldo.

## 7. Ejemplos

### 7.1 Cobro exitoso

```bash
curl -i -X POST http://localhost:3001/api/snailpay/v1/charges \
  -H "Content-Type: application/json" \
  -d '{
    "card_number": "1234123412341234",
    "expiration_date": "12/26",
    "cvv": "543",
    "cardholder_name": "Arturo Torres",
    "amount": 250.5,
    "payer_id": "6f1c2b8e-3a4d-4c5e-9f10-1a2b3c4d5e6f",
    "payer_email": "art@example.com"
  }'
```

`201 Created`

```json
{
  "id": "spay_0b8f6c1e-7d2a-4e3b-9a5f-2c4d6e8f0a1b",
  "status": "approved",
  "status_detail": "accredited",
  "transaction_amount": 250.5,
  "date_created": "2026-10-04T19:20:31.512Z",
  "authorization_code": "A7K2Q9",
  "reference": "SNL-20261004-X4M8TZ",
  "payer_id": "6f1c2b8e-3a4d-4c5e-9f10-1a2b3c4d5e6f",
  "payer_email": "art@example.com",
  "card_number": "1234123412341234",
  "cvv": "543"
}
```

### 7.2 Datos inválidos

Request con `amount: 0` y `cvv: "54"`.

`400 Bad Request`

```json
{
  "id": "spay_3e9a1d7c-5b2f-4c8e-a0d1-7f6e5d4c3b2a",
  "status": "rejected",
  "status_detail": "invalid_request",
  "transaction_amount": 0,
  "date_created": "2026-10-04T19:21:05.004Z",
  "authorization_code": null,
  "reference": "SNL-20261004-P2R7NC",
  "payer_id": "6f1c2b8e-3a4d-4c5e-9f10-1a2b3c4d5e6f",
  "payer_email": "art@example.com",
  "card_number": "1234123412341234",
  "cvv": "54",
  "errors": [
    { "field": "amount", "message": "Debe ser mayor que 0" },
    { "field": "cvv", "message": "Debe tener 3 dígitos" }
  ]
}
```

### 7.3 Fondos insuficientes

Request con `card_number: "4000000000000002"`.

`402 Payment Required`

```json
{
  "id": "spay_9c2d4e6f-8a1b-4c3d-b5e7-0f2a4c6e8b1d",
  "status": "rejected",
  "status_detail": "insufficient_funds",
  "transaction_amount": 250.5,
  "date_created": "2026-10-04T19:22:40.877Z",
  "authorization_code": null,
  "reference": "SNL-20261004-K9W3HD",
  "payer_id": "6f1c2b8e-3a4d-4c5e-9f10-1a2b3c4d5e6f",
  "payer_email": "art@example.com",
  "card_number": "4000000000000002",
  "cvv": "123"
}
```

### 7.4 Error del sistema

Request con `card_number: "9999999999999999"` o servidor con `SNAILPAY_SIMULATE_OUTAGE=true`.

`503 Service Unavailable`

```json
{
  "id": "spay_7a5b3c1d-9e8f-4a6b-8c4d-2e0f1a3b5c7d",
  "status": "error",
  "status_detail": "service_unavailable",
  "transaction_amount": 250.5,
  "date_created": "2026-10-04T19:23:12.345Z",
  "authorization_code": null,
  "reference": "SNL-20261004-Q1V6LS",
  "payer_id": "6f1c2b8e-3a4d-4c5e-9f10-1a2b3c4d5e6f",
  "payer_email": "art@example.com",
  "card_number": "9999999999999999",
  "cvv": "123"
}
```

### 7.5 Timeout (generado por el cliente)

Request con `card_number: "8888888888888888"`. Tras 8 s sin respuesta, el cliente produce:

```json
{
  "id": "local_c4e6a8b0-2d1f-4e3a-9b5c-7d9f1b3d5e7a",
  "status": "error",
  "status_detail": "timeout",
  "transaction_amount": 250.5,
  "date_created": "2026-10-04T19:24:00.000Z",
  "authorization_code": null,
  "reference": "SNL-20261004-LOCAL0",
  "payer_id": "6f1c2b8e-3a4d-4c5e-9f10-1a2b3c4d5e6f",
  "payer_email": "art@example.com",
  "card_number": "8888888888888888",
  "cvv": "123"
}
```

## 8. Mensajes para el usuario

El backend devuelve códigos estables; el frontend los traduce en `statusMessages.ts`.

| `status_detail`           | Mensaje en la UI                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `accredited`              | ¡Recarga aprobada! Se agregaron {monto} a tu saldo. Código de autorización: {código}.                  |
| `invalid_request`         | Revisa los datos de la tarjeta: {campos}.                                                              |
| `invalid_security_code`   | El CVV no es correcto. Verifícalo e inténtalo de nuevo.                                                |
| `invalid_expiration_date` | La fecha de vencimiento no es correcta.                                                                |
| `insufficient_funds`      | La tarjeta no tiene fondos suficientes. Prueba con otra tarjeta.                                       |
| `card_declined`           | El banco rechazó la tarjeta. Prueba con otra tarjeta.                                                  |
| `amount_exceeds_limit`    | El monto máximo por recarga es de $10,000.00.                                                          |
| `service_unavailable`     | El servicio de pagos no está disponible en este momento. No se aplicó ningún cargo. Intenta más tarde. |
| `internal_error`          | Ocurrió un error inesperado. No se aplicó ningún cargo.                                                |
| `timeout`                 | La operación tardó demasiado. No se aplicó ningún cargo; puedes intentarlo de nuevo.                   |
| `network_error`           | No pudimos conectar con el servicio de pagos. No se aplicó ningún cargo.                               |
| (desconocido)             | No pudimos completar la recarga. No se aplicó ningún cargo.                                            |

**Regla:** solo `status === "approved"` modifica el saldo. Cualquier otro valor, incluido uno desconocido, deja el saldo igual.

## 9. Variables de entorno

Backend (`apps/api/.env`, validadas en `apps/api/src/config/env.ts`; si alguna es inválida el API no arranca):

| Variable                   | Por defecto             | Descripción                                                                                    |
| -------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| `PORT`                     | `3001`                  | Puerto del API.                                                                                |
| `CORS_ORIGIN`              | `http://localhost:5173` | Origen permitido en desarrollo.                                                                |
| `SNAILPAY_SIMULATE_OUTAGE` | `false`                 | Si es `true`, toda solicitud responde 503 `service_unavailable`. Solo acepta `true` o `false`. |
| `SNAILPAY_SLOW_DELAY_MS`   | `15000`                 | Retraso del escenario de timeout (tarjeta `8888…`).                                            |
| `SNAILPAY_MAX_AMOUNT`      | `10000`                 | Monto máximo por recarga.                                                                      |

Frontend (`apps/web/.env`):

| Variable                   | Por defecto | Descripción                                                      |
| -------------------------- | ----------- | ---------------------------------------------------------------- |
| `VITE_API_BASE_URL`        | `/api`      | Base del API (en desarrollo Vite hace proxy a `localhost:3001`). |
| `VITE_SNAILPAY_TIMEOUT_MS` | `8000`      | Tiempo máximo de espera del cliente.                             |

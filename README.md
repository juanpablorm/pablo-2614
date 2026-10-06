# SnailRacer

SnailRacer es una demo de apuestas en carreras de caracoles. Puedes registrarte, iniciar sesión, ver el dashboard con las carreras del día y recargar tu saldo con **SnailPay**, una pasarela de pagos **simulada** que corre en el backend. No hay base de datos ni pagos reales: usuarios y saldo viven en el navegador y todos los datos de tarjeta son ficticios.

Antes de contribuir lee [`CONTEXT.md`](CONTEXT.md), que tiene las reglas del proyecto.

## Contenido

1. [Requisitos](#requisitos)
2. [Instalación y ejecución](#instalación-y-ejecución)
3. [Variables de entorno](#variables-de-entorno)
4. [Pruebas](#pruebas)
5. [Tarjetas de prueba de SnailPay](#tarjetas-de-prueba-de-snailpay)
6. [Simular el error del sistema y el timeout](#simular-el-error-del-sistema-y-el-timeout)
7. [Estructura del proyecto](#estructura-del-proyecto)
8. [Decisiones y limitaciones conocidas](#decisiones-y-limitaciones-conocidas)
9. [Scripts disponibles](#scripts-disponibles)

## Requisitos

- **Node.js 24**: es la versión de [`.nvmrc`](.nvmrc), y `package.json` exige `>=24`. Con nvm basta con `nvm use`.
- **npm 11**, que viene con Node 24. El repo usa npm workspaces y versiona `package-lock.json`.

## Instalación y ejecución

```bash
git clone <url-del-repo>
cd snailracer
npm install
npm run dev
```

`npm run dev` compila `packages/shared` y después levanta tres procesos con `concurrently`: `shared` en modo watch, el API y la web.

| App           | URL                     | Notas                                                                     |
| ------------- | ----------------------- | ------------------------------------------------------------------------- |
| Web (Vite)    | `http://localhost:5173` | Puerto fijo: si está ocupado, Vite no arranca en lugar de cambiar a otro. |
| API (Express) | `http://localhost:3001` | Endpoint de cobro: `POST /api/snailpay/v1/charges`.                       |

En desarrollo, Vite reenvía `/api` al puerto 3001, así que el navegador solo habla con `localhost:5173`.

> Abre la app en `localhost`. El registro usa Web Crypto, que no está disponible al entrar por `http://` con la IP de red (por ejemplo `http://192.168.…`).

### Ejecutar cada app por separado

Ambas apps importan `@snailracer/shared` desde su carpeta `dist/`, así que primero hay que compilarlo una vez:

```bash
npm run build -w @snailracer/shared

npm run dev -w @snailracer/api   # solo el API en :3001
npm run dev -w @snailracer/web   # solo la web en :5173 (para recargar saldo, el API debe estar corriendo)
```

Si cambias algo en `packages/shared`, vuelve a compilarlo o déjalo en watch con `npm run dev -w @snailracer/shared`.

Para probar los builds de producción en local:

```bash
npm run build
npm start -w @snailracer/api        # sirve dist/ del API en :3001
npm run preview -w @snailracer/web  # sirve el build de la web (Vite muestra la URL; también reenvía /api)
```

## Variables de entorno

Todas son opcionales: sin archivo `.env` se usan los valores por defecto. Para cambiarlas, copia el ejemplo de cada app:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Los archivos `.env` no se versionan, solo los `.env.example`.

### API: [`apps/api/.env.example`](apps/api/.env.example)

Se validan al arrancar ([`apps/api/src/config/env.ts`](apps/api/src/config/env.ts)). **Si alguna es inválida, el API no arranca** y muestra el error.

| Variable                   | Por defecto             | Descripción                                                                         |
| -------------------------- | ----------------------- | ----------------------------------------------------------------------------------- |
| `PORT`                     | `3001`                  | Puerto del API.                                                                     |
| `CORS_ORIGIN`              | `http://localhost:5173` | Origen permitido por CORS.                                                          |
| `SNAILPAY_SIMULATE_OUTAGE` | `false`                 | Con `true`, toda solicitud responde 503 `service_unavailable`. Solo `true`/`false`. |
| `SNAILPAY_SLOW_DELAY_MS`   | `15000`                 | Lo que tarda en responder la tarjeta de timeout (`8888…`).                          |
| `SNAILPAY_MAX_AMOUNT`      | `10000`                 | Monto máximo por recarga, en MXN.                                                   |

### Web: [`apps/web/.env.example`](apps/web/.env.example)

Se leen en [`apps/web/src/lib/env.ts`](apps/web/src/lib/env.ts). Un valor inválido no rompe la app: se usa el valor por defecto. Vite las lee al arrancar, así que si las cambias hay que reiniciar `npm run dev`.

| Variable                   | Por defecto | Descripción                                                                    |
| -------------------------- | ----------- | ------------------------------------------------------------------------------ |
| `VITE_API_BASE_URL`        | `/api`      | Base del API. En desarrollo, Vite reenvía `/api` a `localhost:3001`.           |
| `VITE_SNAILPAY_TIMEOUT_MS` | `8000`      | Tiempo máximo que el cliente espera la respuesta de SnailPay antes de abortar. |

Más detalle en [`docs/snailpay-api.md` §9](docs/snailpay-api.md#9-variables-de-entorno).

## Pruebas

```bash
npm test
```

Compila `shared` y corre Vitest en todos los workspaces: el API con Supertest y la web con Testing Library sobre jsdom.

Para correr solo una app (requiere `shared` compilado; `npm test` lo hace por ti):

```bash
npm test -w @snailracer/api
npm test -w @snailracer/web

# Un solo archivo
npm test -w @snailracer/web -- tests/lib/money.test.ts
```

### Cobertura (opcional)

```bash
npm run test:coverage                    # ambas apps
npm run test:coverage -w @snailracer/api # solo una
```

Imprime un resumen en la terminal y deja el reporte en `apps/api/coverage/` y `apps/web/coverage/` (ignorados por git).

## Tarjetas de prueba de SnailPay

Con `npm run dev` levantado, regístrate, entra al dashboard y pulsa **Recargar**. Para todos los casos: nombre en la tarjeta no vacío y monto de al menos **$50** (mínimo de la UI).

| #   | Escenario            | Datos                                                             | Resultado esperado                               | Efecto en el saldo |
| --- | -------------------- | ----------------------------------------------------------------- | ------------------------------------------------ | ------------------ |
| 1   | **Cobro exitoso**    | `1234 1234 1234 1234`, vence `12/26`, CVV `543`, monto ≤ $10,000  | 201 `approved` / `accredited`                    | **Suma el monto**  |
| 2   | Datos inválidos      | Cualquier campo con formato incorrecto (ver nota)                 | 400 `rejected` / `invalid_request`               | Sin cambio         |
| 3   | CVV incorrecto       | `1234 1234 1234 1234`, vence `12/26`, CVV distinto de `543`       | 402 `rejected` / `invalid_security_code`         | Sin cambio         |
| 4   | Fecha incorrecta     | `1234 1234 1234 1234`, vencimiento distinto de `12/26`, CVV `543` | 402 `rejected` / `invalid_expiration_date`       | Sin cambio         |
| 5   | Fondos insuficientes | `4000 0000 0000 0002`, cualquier fecha y CVV válidos              | 402 `rejected` / `insufficient_funds`            | Sin cambio         |
| 6   | Tarjeta rechazada    | `4000 0000 0000 0069` o cualquier tarjeta no listada              | 402 `rejected` / `card_declined`                 | Sin cambio         |
| 7   | Monto excedido       | Datos del #1 con monto mayor a $10,000                            | 402 `rejected` / `amount_exceeds_limit`          | Sin cambio         |
| 8   | Error del sistema    | `9999 9999 9999 9999` (o la variable de la sección siguiente)     | 503 `error` / `service_unavailable`              | Sin cambio         |
| 9   | Timeout              | `8888 8888 8888 8888`                                             | El cliente aborta a los 8 s: `error` / `timeout` | Sin cambio         |
| 10  | Error inesperado     | Excepción no controlada en el servidor                            | 500 `error` / `internal_error`                   | Sin cambio         |

**Solo el escenario 1 cambia el saldo.** Cada intento enviado, aprobado o no, aparece en el historial de recargas.

Notas:

- **#1 y #4:** `12/26` es la única fecha aceptada para la tarjeta exitosa. No se compara con la fecha actual, así que sigue funcionando después de diciembre de 2026.
- **#2:** el formulario valida antes de enviar, así que desde la UI solo verás los errores por campo. Para ver la respuesta 400 del API, llámalo directamente:

  ```bash
  curl -i -X POST http://localhost:3001/api/snailpay/v1/charges \
    -H "Content-Type: application/json" \
    -d '{"card_number":"123","expiration_date":"13/26","cvv":"5","cardholder_name":"","amount":-1,"payer_id":"x","payer_email":"x"}'
  ```

  En Windows PowerShell usa `curl.exe` en lugar de `curl`.

- **#7:** la UI no tiene tope de monto precisamente para poder llegar a este caso.
- **#10:** no hay una tarjeta para provocarlo; se cubre en las pruebas del API inyectando un servicio que falla ([`apps/api/tests`](apps/api/tests)).

La lista completa de reglas, el orden de evaluación y los mensajes que ve el usuario están en [`docs/snailpay-api.md` §4](docs/snailpay-api.md#4-escenarios-y-datos-de-prueba).

## Simular el error del sistema y el timeout

### Error del sistema (503)

Hay dos formas. En ninguna se aprueba ni se aplica la recarga.

**Tarjeta:** usa `9999 9999 9999 9999` desde la UI. No hace falta reiniciar nada.

**Variable de entorno:** arranca el API con `SNAILPAY_SIMULATE_OUTAGE=true`. Así, **todas** las solicitudes responden 503, incluso con la tarjeta exitosa.

```bash
# Linux / macOS
SNAILPAY_SIMULATE_OUTAGE=true npm run dev -w @snailracer/api
```

```powershell
# Windows (PowerShell)
$env:SNAILPAY_SIMULATE_OUTAGE="true"; npm run dev -w @snailracer/api
```

También puedes poner `SNAILPAY_SIMULATE_OUTAGE=true` en `apps/api/.env` y usar `npm run dev` normal. Recuerda quitarla (o ponerla en `false`) al terminar.

### Timeout

Usa la tarjeta `8888 8888 8888 8888`. El servidor tarda `SNAILPAY_SLOW_DELAY_MS` (15 s) en responder, y el cliente aborta a los `VITE_SNAILPAY_TIMEOUT_MS` (8 s). Al abortar, muestra "Esto tardó demasiado" y no cambia el saldo. Si el servidor responde después, esa respuesta se descarta.

Si cambias estos valores, el retraso del servidor debe seguir siendo mayor que el timeout del cliente. Si no, el servidor responde primero con un 503 y verás "Servicio no disponible" en lugar del timeout.

Detalle en [`docs/snailpay-api.md` §6](docs/snailpay-api.md#6-error-del-sistema-y-timeout).

## Estructura del proyecto

```text
snailracer/
├── apps/
│   ├── api/                  Express 5 + TypeScript: SnailPay
│   │   ├── src/
│   │   │   ├── config/       Variables de entorno (Zod)
│   │   │   ├── routes/       Rutas /api/snailpay/v1
│   │   │   ├── controllers/  Cobros e Idempotency-Key
│   │   │   ├── services/     Escenarios de tarjeta y armado de respuestas
│   │   │   └── middlewares/  404 y manejo de errores
│   │   └── tests/
│   └── web/                  React 19 + Vite 8 + Tailwind 4
│       ├── src/
│       │   ├── features/     auth, wallet (recarga), stats (dashboard)
│       │   ├── components/   UI reutilizable
│       │   ├── pages/        Pantallas y rutas
│       │   └── lib/          LocalStorage, HTTP, dinero, PRNG
│       └── tests/
├── packages/
│   └── shared/               Contrato de SnailPay (tipos y esquemas Zod)
└── docs/
```

- [`docs/architecture.md`](docs/architecture.md): capas, flujos de sesión y recarga, modelo de datos en LocalStorage y manejo de errores.
- [`docs/snailpay-api.md`](docs/snailpay-api.md): contrato del API (solicitud, respuesta, escenarios, idempotencia, mensajes).
- [`docs/styles.md`](docs/styles.md): guía visual.

## Decisiones y limitaciones conocidas

Las siguientes decisiones solo se aceptan porque esto es una simulación. Más detalle en [`docs/architecture.md` §5](docs/architecture.md#5-modelo-de-datos-en-localstorage) y en [`CONTEXT.md` §7](CONTEXT.md#7-decisiones).

**Contraseña.** Nunca se guarda en texto plano, y la confirmación tampoco se guarda. Se guarda un hash PBKDF2-SHA256 (Web Crypto), con una sal aleatoria de 16 bytes y 600,000 iteraciones. El login recalcula el hash y responde con un error genérico que no revela si el correo existe. Como todo pasa en el navegador, no reemplaza a una autenticación en el servidor con argon2 o bcrypt.

**LocalStorage.** Usuarios, sesión (expira a las 24 h), saldo e historial se guardan en el navegador, con claves `snailracer:v1:…`. Todo acceso pasa por [`apps/web/src/lib/storage.ts`](apps/web/src/lib/storage.ts) y se valida con Zod al leer. Esto implica:

- Los datos son por navegador y por origen: otro navegador o una ventana privada empiezan de cero.
- Cualquiera puede editar su saldo desde las DevTools.
- Cualquier script del mismo origen puede leerlos, así que un XSS los expondría.
- Si los datos guardados están corruptos, no se sobrescriben: la app cierra la sesión y te manda a iniciar sesión con un aviso. Para empezar de cero, borra los datos del sitio.

**Datos de tarjeta ficticios.** El número completo y el CVV se devuelven en la respuesta y se guardan en el historial porque así lo pide el alcance del proyecto. Eso contradice PCI DSS: en un sistema real solo se guardaría un token o los últimos 4 dígitos, y nunca el CVV. La UI los muestra enmascarados (`•••• 1234`) y el modal avisa que solo se usen tarjetas de prueba. **No ingreses datos reales.**

**Otras:**

- El saldo se maneja en centavos enteros.
- Las `Idempotency-Key` se guardan en memoria del API y se pierden al reiniciarlo.
- Los datos del dashboard se generan con una semilla (la fecha del día), así que se repiten al recargar la página.
- No hay sección para apostar ni carreras animadas; están fuera de alcance.

## Scripts disponibles

### Raíz

| Comando                 | Qué hace                                                                      |
| ----------------------- | ----------------------------------------------------------------------------- |
| `npm run dev`           | Compila `shared` y levanta `shared` (watch), el API (:3001) y la web (:5173). |
| `npm run build`         | Compila `shared`, `api` y `web`, en ese orden.                                |
| `npm test`              | Compila `shared` y corre las pruebas de todos los workspaces.                 |
| `npm run test:coverage` | Igual que `npm test`, pero con reporte de cobertura.                          |
| `npm run typecheck`     | Verifica tipos en todos los workspaces.                                       |
| `npm run lint`          | ESLint, con reglas de accesibilidad para React.                               |
| `npm run format`        | Formatea todo con Prettier.                                                   |
| `npm run format:check`  | Revisa el formato sin modificar archivos.                                     |

### Por workspace

Se ejecutan con `npm run <script> -w <paquete>`, por ejemplo `npm run dev -w @snailracer/api`.

| Paquete              | Scripts                                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| `@snailracer/api`    | `dev` (tsx en watch), `build` (a `dist/`), `start` (corre `dist/`), `typecheck`, `test`, `test:coverage`    |
| `@snailracer/web`    | `dev` (Vite), `build` (typecheck + build), `preview` (sirve el build), `typecheck`, `test`, `test:coverage` |
| `@snailracer/shared` | `build`, `dev` (watch), `typecheck`                                                                         |

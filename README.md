# SnailRacer

Demo de apuestas en carreras de caracoles con una pasarela de pagos **simulada** (SnailPay). Todos los datos de tarjeta son ficticios.

Antes de contribuir lee [`CONTEXT.md`](CONTEXT.md). Más detalle en [`docs/`](docs/).

## Requisitos

- Node.js 24 (ver `.nvmrc`) y npm 11.

## Instalación

```bash
npm install
```

Variables de entorno opcionales: copia `apps/api/.env.example` a `apps/api/.env` y `apps/web/.env.example` a `apps/web/.env`. Sin ellas se usan los valores por defecto.

## Scripts (desde la raíz)

| Comando             | Qué hace                                                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`       | Levanta `shared` (watch), el API en `http://localhost:3001` y la web en `http://localhost:5173` (con proxy de `/api`). |
| `npm run build`     | Compila `shared`, `api` y `web` en ese orden.                                                                          |
| `npm test`          | Corre las pruebas de todos los workspaces.                                                                             |
| `npm run typecheck` | Verifica tipos en todos los workspaces.                                                                                |
| `npm run lint`      | ESLint (incluye reglas de accesibilidad para React).                                                                   |
| `npm run format`    | Formatea con Prettier.                                                                                                 |

## Estructura

```text
apps/web         React + Vite + TS
apps/api         Express + TS (SnailPay)
packages/shared  Tipos del contrato SnailPay
docs/            Arquitectura, contrato del API y guía de estilos
```

> Nota: abre la app en `localhost` o por HTTPS. El registro usa Web Crypto, que no funciona en `http://` por IP de red.

## Tarjetas de prueba (SnailPay)

Con `npm run dev`, inicia sesión y usa **Recargar** en el dashboard. Para todas: nombre no vacío y monto de al menos $50 (mínimo de la UI). Detalle completo en [`docs/snailpay-api.md`](docs/snailpay-api.md).

| Tarjeta               | Vencimiento | CVV        | Resultado                                                             |
| --------------------- | ----------- | ---------- | --------------------------------------------------------------------- |
| `1234 1234 1234 1234` | `12/26`     | `543`      | **Aprobada**: suma el monto al saldo                                  |
| `1234 1234 1234 1234` | `12/26`     | otro       | Rechazada: CVV incorrecto                                             |
| `1234 1234 1234 1234` | otra        | `543`      | Rechazada: fecha incorrecta                                           |
| `1234 1234 1234 1234` | `12/26`     | `543`      | Rechazada si el monto es mayor a $10,000                              |
| `4000 0000 0000 0002` | cualquiera  | cualquiera | Rechazada: fondos insuficientes                                       |
| `4000 0000 0000 0069` | cualquiera  | cualquiera | Rechazada: tarjeta rechazada (igual que cualquier tarjeta no listada) |
| `9999 9999 9999 9999` | cualquiera  | cualquiera | Error: servicio no disponible                                         |
| `8888 8888 8888 8888` | cualquiera  | cualquiera | Timeout: el cliente se rinde a los 8 s                                |

Solo la aprobada cambia el saldo. Para simular una caída total del servicio:

```powershell
$env:SNAILPAY_SIMULATE_OUTAGE="true"; npm run dev -w @snailracer/api
```

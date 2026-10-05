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

Las instrucciones completas (tarjetas de prueba, despliegue) se agregan cuando las funcionalidades estén listas.

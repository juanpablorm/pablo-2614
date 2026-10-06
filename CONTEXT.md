# SnailRacer — Contexto del proyecto

Este archivo resume **qué es el proyecto, qué reglas no se rompen y cómo se trabaja en él**. Léelo antes de escribir código (persona o asistente de IA). Los detalles técnicos están en:

- [`docs/architecture.md`](docs/architecture.md) — arquitectura, capas, rutas y modelo de datos.
- [`docs/snailpay-api.md`](docs/snailpay-api.md) — contrato del servicio de pagos simulado.
- [`docs/styles.md`](docs/styles.md) — guía de estilos y componentes.

---

## 1. Qué es

SnailRacer es una aplicación web de demostración con temática de apuestas en carreras de caracoles. Permite:

1. Registrarse, iniciar sesión y cerrar sesión (autenticación **simulada en el navegador**).
2. Ver un dashboard con el nombre del usuario, su saldo y dos gráficas de **datos simulados**:
   - Donut de apuestas ganadas vs. perdidas.
   - Barras con las victorias de 6 caracoles en un día de 6 carreras.
3. Recargar saldo mediante **SnailPay**, una pasarela de pagos simulada implementada en Express.

Todo el estado del usuario (perfil, sesión, saldo, historial de recargas) vive en **LocalStorage**. El backend no guarda estado.

## 2. Stack

| Capa           | Tecnología                                                                          |
| -------------- | ----------------------------------------------------------------------------------- |
| Frontend       | React + Vite + TypeScript (strict)                                                  |
| Rutas          | React Router                                                                        |
| Formularios    | React Hook Form + Zod                                                               |
| UI             | Tailwind CSS + componentes propios (cva, clsx, tailwind-merge), iconos lucide-react |
| Gráficas       | Recharts                                                                            |
| Backend        | Express + TypeScript (tsx en desarrollo)                                            |
| Validación API | Zod                                                                                 |
| Pruebas        | Vitest, Supertest, React Testing Library                                            |
| Calidad        | ESLint + Prettier, Conventional Commits                                             |
| Repo           | Monorepo con npm workspaces (`apps/web`, `apps/api`, `packages/shared`)             |

El stack es fijo: React, Express, TypeScript en ambos lados y LocalStorage para el estado del usuario. No se agregan bases de datos ni servicios externos.

**Versiones** (últimas estables al iniciar, fijadas en `package-lock.json`): Node 24, TypeScript 6, React 19, Vite 8, Tailwind 4, Express 5, Zod 4, Vitest 5. ESLint se mantiene en la rama 9 porque `eslint-plugin-jsx-a11y` aún no soporta ESLint 10.

## 3. Reglas que nunca se rompen

Estas reglas son el núcleo del proyecto. Cada una tiene al menos una prueba automatizada o una regla de ESLint que la verifica.

1. **El saldo solo cambia con un cobro aprobado.** Únicamente `status === "approved"` suma saldo. `rejected`, `error`, timeout, error de red, respuesta malformada o HTTP inesperado **no modifican el saldo**.
2. **Nunca un falso cobro exitoso.** SnailPay solo aprueba la combinación exacta documentada. Cualquier otra entrada que no coincida con un escenario se rechaza.
3. **La contraseña nunca se guarda en texto plano.** Se guarda `hash + salt + iterations` (PBKDF2-SHA256 vía Web Crypto). La confirmación de contraseña tampoco se guarda.
4. **El saldo se maneja en centavos (enteros).** Nunca se suman `number` con decimales.
5. **El dashboard solo es accesible con sesión activa.** Sin sesión → `/login`. También si la sesión expira o se cierra en otra pestaña con el dashboard abierto.
6. **Saldo inicial = $0.**
7. **Los datos de las gráficas son congruentes:** 6 caracoles, 6 carreras, exactamente un ganador por carrera (las victorias suman 6). Las apuestas simuladas se resuelven contra esas mismas carreras.
8. **Todo acceso a LocalStorage pasa por `lib/storage.ts`** y se valida con Zod al leer. Los componentes nunca llaman a `localStorage` directamente (ESLint lo prohíbe fuera de `storage.ts`). Datos guardados ilegibles nunca se sobrescriben.
9. **Datos de tarjeta siempre ficticios.** El número y el CVV se devuelven en la respuesta y se guardan en LocalStorage por requisito del proyecto; en la UI se muestran enmascarados y el modal avisa que solo deben usarse tarjetas de prueba.
10. **Sin referencias a terceros.** El repositorio y el código no contienen nombres, logotipos ni enlaces de organizaciones ajenas al proyecto. Las herramientas usadas sí pueden nombrarse (incluida la coautoría de IA en los commits). Las fuentes se auto-hospedan y no hay enlaces externos, salvo el del propio repositorio en el README (`apps/api/tests/externalReferences.test.ts`).

## 4. Fuera de alcance (no construir)

- Sección para realizar apuestas.
- Lógica o animación para ejecutar carreras.
- Recuperación de contraseña, verificación de correo, administración de usuarios.
- Base de datos real o conexión a pasarelas reales.
- Carga de archivos en formularios.

## 5. Convenciones

### Código

- TypeScript `strict`. Sin `any`; si es inevitable, `unknown` + validación con Zod.
- Componentes en `PascalCase.tsx`; hooks `useAlgo.ts`; servicios y utilidades en `camelCase.ts`.
- Organización por **feature** (`features/auth`, `features/wallet`, `features/stats`), no por tipo de archivo.
- La lógica de negocio vive en servicios puros (fáciles de probar); los componentes solo orquestan y pintan.
- Mensajes al usuario en español. Códigos de API (`status`, `status_detail`) en inglés y `snake_case`.
- Montos con `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })`.

### Git

- Commits pequeños con Conventional Commits: `feat(auth): ...`, `fix(wallet): ...`, `test(api): ...`, `docs: ...`, `chore: ...`.
- Nunca se suben archivos `.env`; solo `.env.example`.

### Pruebas

- Prioridad: lo que pierde dinero, expone contraseñas o rompe el contrato del API.
- `npm test` en la raíz corre las pruebas de todos los workspaces.

## 6. Cómo se usa la IA en este repo

Se permite usar asistentes de IA para análisis, diseño, código, pruebas y documentación, con estas condiciones:

- Todo código generado se revisa línea por línea antes de aceptarlo; quien lo integra debe poder explicarlo y modificarlo.
- Las reglas de la sección 3 tienen prioridad sobre cualquier sugerencia.
- Se registra qué se pidió, qué se aceptó y qué se corrigió (bitácora fuera del repo).

## 7. Decisiones

### Tomadas

| Tema                 | Decisión                                                                                                                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Versiones            | Últimas estables al iniciar; ESLint 9 por compatibilidad con jsx-a11y.                                                                                                                                                                            |
| Gráfica de apuestas  | Donut con Recharts (styles.md actualizado).                                                                                                                                                                                                       |
| Datos de tarjeta     | Se guardan completos (ficticios) por requisito; UI enmascarada; el modal no promete "solo últimos 4".                                                                                                                                             |
| Fuentes              | Auto-hospedadas con `@fontsource` (subconjunto latino).                                                                                                                                                                                           |
| Logo                 | `snailracer-logo.svg`; prefijo de animaciones `sr-`. Entrada en login/registro: llega rápido, frena en seco con polvo y luego salen las letras; una vez por carga.                                                                                |
| Contraseña y nombre  | Nombre 3–80 caracteres tras `trim`; contraseña 8–128 con mayúscula, minúscula y número (P4).                                                                                                                                                      |
| Caracoles            | Carloscol, Conchosio, Baberto, Lentejo, Espirolio y Snailio (P5). En celular las barras van horizontales para leer el nombre completo.                                                                                                            |
| Carga del dashboard  | Diferida con `React.lazy` tras confirmar la sesión: Recharts va en su propio chunk y no se descarga en login/registro.                                                                                                                            |
| Líder en empate      | Se resaltan todos los empatados y el texto dice "Empate en el primer lugar" (P6).                                                                                                                                                                 |
| `react-is`           | DevDependency raíz en la versión de React: Recharts lo toma como peer desde la raíz, no la 17 de Testing Library.                                                                                                                                 |
| Monto de recarga     | UI mín. $50 con chips ($100, $200, $500, $1,000) + monto libre; sin tope de $10,000 en el cliente para alcanzar el escenario 7 (P3).                                                                                                              |
| Tarjeta en historial | Columna "Tarjeta" con `•••• 1234`; sin detección de marca (P7).                                                                                                                                                                                   |
| Copy de errores      | Mensaje de la tabla 8 + referencia; títulos propios: "Esto tardó demasiado" (timeout), "Servicio no disponible" (503), "No se pudo completar la recarga" (500, red), "Revisa los datos" (400), "Monto no permitido" (escenario 7) (P8).           |
| Errores del cliente  | `network_error` es un `status_detail` generado por el cliente, como `timeout`; una respuesta malformada se guarda como `internal_error` local.                                                                                                    |
| Modal                | `components/ui/Dialog.tsx` propio, sin dependencias: foco atrapado, Esc cierra, página inerte, el foco regresa a Recargar.                                                                                                                        |
| Idempotency-Key      | `Map` en memoria con TTL de 24 h y tope de 1,000 keys; misma key + mismo body → respuesta original; body distinto → 422; los 503/500 no se guardan (P1). En el cliente, Reintentar reenvía la misma key y un envío nuevo del formulario usa otra. |
| Tarjeta `8888…`      | Tras `SNAILPAY_SLOW_DELAY_MS` responde 503 `service_unavailable`, nunca `approved` (P2).                                                                                                                                                          |
| Contrato compartido  | `chargeResponseSchema` (Zod) vive en `packages/shared`: lo usan el frontend y las pruebas del API.                                                                                                                                                |

### Pendientes

Ninguna.

## 8. Estado

| Área                                             | Estado                     |
| ------------------------------------------------ | -------------------------- |
| Documentación de contexto, arquitectura y API    | Hecho                      |
| Setup del monorepo                               | Hecho                      |
| Auth (registro, login, logout, rutas protegidas) | Hecho                      |
| SnailPay (backend)                               | Hecho                      |
| Dashboard y gráficas                             | Hecho                      |
| Recarga de saldo (integración)                   | Hecho                      |
| Pulido de UI y accesibilidad                     | Hecho                      |
| README de ejecución                              | Hecho                      |
| Despliegue en un solo proceso (architecture §8)  | No implementado (opcional) |

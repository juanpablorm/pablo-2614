# SnailRacer — Guía de estilos

Sistema visual del sitio de apuestas en carreras de caracoles. Estilo **simple, profesional y juguetón**: tipografía redondeada, colores cálidos de tierra, esquinas rectas y botones con "peso" (sombra sólida inferior).

Pantallas: `/registro`, `/login`, `/dashboard` (protegida), modal de recarga (dentro del dashboard) y `404`.

Los tokens de esta guía están implementados en `apps/web/src/styles/index.css` (bloque `@theme` de Tailwind), por lo que existen utilidades como `bg-surface`, `text-text-muted`, `shadow-cta` o `font-display`.

---

## 1. Color

### Paleta base

| Token               | Hex       | Uso                                                                    |
| ------------------- | --------- | ---------------------------------------------------------------------- |
| `--color-bg`        | `#FDF2E7` | Fondo general, fondo de inputs, filas de tabla                         |
| `--color-text`      | `#432304` | Texto, navegación, estructura, panel lateral de auth, tarjeta de saldo |
| `--color-primary`   | `#F07E13` | CTA, elementos principales, barras del gráfico                         |
| `--color-secondary` | `#58613A` | Elementos secundarios, éxito, apuestas ganadas, avatar                 |
| `--color-surface`   | `#E9D8C7` | Cards, superficies, cajas de información                               |
| `--color-highlight` | `#D9A52E` | Premios, destacados, líder, estado "sin confirmar" / timeout           |
| `--color-accent`    | `#B95332` | Competencia, estados especiales, error, rechazado, sombra de CTA       |

### Colores derivados

| Token                      | Hex       | Uso                                                                   |
| -------------------------- | --------- | --------------------------------------------------------------------- |
| `--color-text-muted`       | `#7A5634` | Texto secundario, placeholders, ayudas de campo, encabezados de tabla |
| `--color-border`           | `#8F7358` | Borde de inputs y botones secundarios                                 |
| `--color-error-text`       | `#8F3A1F` | Texto de error pequeño (mensajes por campo, alertas)                  |
| `--color-surface-shadow`   | `#D7C0A8` | Sombra sólida de las cards de formulario                              |
| `--color-input-disabled`   | `#F4E7D9` | Fondo de inputs deshabilitados                                        |
| `--color-primary-disabled` | `#F3B47A` | CTA en estado procesando                                              |
| `--color-error-bg`         | `#F3D9CC` | Fondo de alerta de error / halo de "rechazado"                        |
| `--color-success-bg`       | `#DCDDC6` | Fondo de aviso de éxito / halo de "aprobado"                          |
| `--color-success-text`     | `#3D4426` | Texto sobre fondo de éxito                                            |
| `--color-warning-bg`       | `#F2E1B8` | Halo del estado timeout                                               |
| `--color-overlay`          | `#977F6A` | Fondo detrás del modal (en el lienzo de estados)                      |

### Logo

Archivo: `apps/web/src/assets/snailracer-logo.svg`.

| Pieza            | Hex       |
| ---------------- | --------- |
| Espira exterior  | `#F5AB66` |
| Espira media     | `#F2933A` |
| Concha principal | `#F07E13` |
| Cuerpo           | `#6E3907` |

### Reglas de uso

- **Texto sobre naranja siempre café (`#432304`), nunca blanco.** Blanco sobre `#F07E13` da 2.7:1 y no pasa; café da 5.2:1.
- **Texto naranja solo sobre fondos oscuros** (`#432304`), como "Racer" en el panel de marca. Sobre `#FDF2E7` no pasa contraste.
- **`#B95332` no se usa para texto pequeño** sobre superficies (3.5:1 sobre `#E9D8C7`). Para mensajes de error usa `#8F3A1F`; reserva `#B95332` para bordes, íconos, badges con texto blanco y la sombra del CTA.
- **Significado consistente:** verde = ganado / aprobado; óxido = perdido / rechazado / error; dorado = líder / destacado / pendiente.
- No distinguir estados solo por color: acompaña con ícono, texto o forma (en la leyenda de apuestas, Ganadas es un cuadro y Perdidas un círculo).

### Contrastes verificados

| Texto / Fondo         | Ratio  |
| --------------------- | ------ |
| `#432304` / `#FDF2E7` | 12.9:1 |
| `#432304` / `#E9D8C7` | 10.2:1 |
| `#432304` / `#F07E13` | 5.2:1  |
| `#432304` / `#D9A52E` | 6.3:1  |
| `#FDF2E7` / `#58613A` | 6.0:1  |
| `#FFFFFF` / `#B95332` | 4.8:1  |
| `#7A5634` / `#FDF2E7` | 5.9:1  |
| `#7A5634` / `#E9D8C7` | 4.7:1  |
| `#8F3A1F` / `#E9D8C7` | 5.4:1  |
| `#8F3A1F` / `#F3D9CC` | 5.6:1  |
| `#3D4426` / `#DCDDC6` | 7.4:1  |

---

## 2. Tipografía

Las fuentes se **auto-hospedan** con los paquetes `@fontsource/fredoka` y `@fontsource/figtree` (solo subconjunto latino, que cubre el español). No se cargan desde servicios externos. Las importaciones están en `apps/web/src/main.tsx`.

| Rol     | Familia     | Pesos              | Uso                                         |
| ------- | ----------- | ------------------ | ------------------------------------------- |
| Display | **Fredoka** | 500, 600, 700      | Títulos, montos, números, botones, logotipo |
| Texto   | **Figtree** | 400, 500, 600, 700 | Cuerpo, labels, inputs, tablas, ayudas      |

### Escala

| Estilo                       | Familia | Tamaño                      | Peso      | Line-height | Tracking           |
| ---------------------------- | ------- | --------------------------- | --------- | ----------- | ------------------ |
| Hero 404                     | Fredoka | `clamp(120px, 18vw, 200px)` | 700       | 1           | -0.04em            |
| Logotipo animado             | Fredoka | `clamp(48px, 5.4vw, 78px)`  | 600       | 1           | -0.02em            |
| Monto de saldo               | Fredoka | 56px                        | 600       | 1           | -0.02em            |
| Porcentaje (efectividad)     | Fredoka | 48px                        | 600       | 1           | —                  |
| H1 página (dashboard)        | Fredoka | 40px                        | 600       | —           | -0.01em            |
| H1 formulario                | Fredoka | 36px                        | 600       | 1.1         | -0.01em            |
| H1 404                       | Fredoka | `clamp(30px, 3.4vw, 42px)`  | 600       | 1.12        | —                  |
| H2 modal (estado)            | Fredoka | 28px                        | 600       | —           | —                  |
| H2 card / modal              | Fredoka | 24–26px                     | 600       | —           | —                  |
| Botón primario               | Fredoka | 19px (17px en modal)        | 600       | —           | —                  |
| Número de gráfico            | Fredoka | 18px                        | 600       | —           | —                  |
| Cuerpo                       | Figtree | 16px                        | 400       | 1.5         | —                  |
| Botón secundario / tabla     | Figtree | 15px                        | 600       | —           | —                  |
| Label                        | Figtree | 14px                        | 600       | —           | —                  |
| Eyebrow ("SALDO DISPONIBLE") | Figtree | 14px                        | 700       | —           | 0.08em, mayúsculas |
| Ayuda / error de campo       | Figtree | 13px                        | 400 / 600 | —           | —                  |
| Encabezado de tabla          | Figtree | 12px                        | 700       | —           | 0.06em, mayúsculas |

---

## 3. Espaciado, forma y elevación

**Espaciado** (múltiplos de 2 y 4):
`4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 24 · 28 · 32 · 40 · 48 · 56 · 72`

| Contexto                      | Valor                                 |
| ----------------------------- | ------------------------------------- |
| Label → input                 | 6px                                   |
| Entre campos de formulario    | 18px                                  |
| Bloques dentro de una card    | 20–28px                               |
| Padding de card               | 32px (form: `clamp(28px, 4vw, 44px)`) |
| Padding de modal              | 30px                                  |
| Gap entre cards del dashboard | 24px                                  |
| Ancho máx. contenido          | 1200px                                |
| Ancho máx. card de formulario | 470px                                 |
| Ancho del modal               | 400px                                 |

**Radios:** `0` en todo (cards, botones, inputs, badges, barras, modales). La escala `rounded-*` de Tailwind está fijada en 0.
Excepciones circulares (`rounded-full`): avatar, íconos grandes de estado del modal y el marcador "Perdidas" de la leyenda.

**Sombras** (sólidas, sin difuminado, salvo el modal):

| Token            | Valor                               | Uso                                   |
| ---------------- | ----------------------------------- | ------------------------------------- |
| `--shadow-cta`   | `0 4px 0 #B95332`                   | Botón primario                        |
| `--shadow-card`  | `0 8px 0 #D7C0A8`                   | Card de formulario (registro / login) |
| `--shadow-modal` | `0 24px 48px rgba(67, 35, 4, 0.35)` | Modal                                 |
| `--ring-success` | `0 0 0 10px #DCDDC6`                | Halo del ícono "aprobado"             |
| `--ring-error`   | `0 0 0 10px #F3D9CC`                | Halo del ícono "rechazado"            |
| `--ring-warning` | `0 0 0 10px #F2E1B8`                | Halo del ícono "timeout"              |

**Foco:** `outline: 3px solid #F07E13; outline-offset: 2px` en inputs, enlaces y botones (aplicado globalmente con `:focus-visible`).

---

## 4. Componentes

### Botón primario (CTA)

- Fondo `#F07E13`, texto `#432304`, Fredoka 600 19px.
- Alto 54px (52px en modal), padding horizontal 28px, radio 0.
- Sombra `0 4px 0 #B95332`.
- **Procesando:** fondo `#F3B47A`, spinner + "Procesando pago…", `disabled`, `cursor: not-allowed`.

### Botón secundario

- Transparente, borde `2px solid #432304`, texto `#432304`.
- Alto 44px (header) o 52px (modal).

### Botón de ícono (cerrar modal)

- 44×44px, fondo `#E9D8C7`, ícono 18px, `aria-label` obligatorio.

### Input

- Alto 50px, padding `0 16px`, borde `2px solid #8F7358`, fondo `#FDF2E7` (blanco dentro del modal), Figtree 16px.
- **Error:** borde `#B95332` + mensaje 13px/600 en `#8F3A1F` con ícono de alerta 16px.
- **Deshabilitado:** fondo `#F4E7D9`, opacidad 0.6.
- Siempre con `<label for>` visible.

### Selector de monto (chips)

- Grid de 4 columnas, gap 8px, alto 44px, borde `2px solid #8F7358`.
- **Seleccionado:** fondo y borde `#432304`, texto `#FDF2E7`, `aria-pressed="true"`.

### Card

- Fondo `#E9D8C7`, padding 32px, radio 0.
- **Card destacada (saldo):** fondo `#432304`, texto `#FDF2E7`, eyebrow y meta en `#E9D8C7`.

### Alertas

| Tipo         | Fondo     | Borde         | Texto     |
| ------------ | --------- | ------------- | --------- |
| Error        | `#F3D9CC` | `2px #B95332` | `#8F3A1F` |
| Éxito / info | `#DCDDC6` | `2px #58613A` | `#3D4426` |

Padding `14px 16px`, ícono 22px, texto 15px/600, `role="alert"` o `role="status"`.

### Badges de estado

Padding `4px 12px`, 13px/700, radio 0.

| Estado                      | Fondo     | Texto     |
| --------------------------- | --------- | --------- |
| Aprobada                    | `#58613A` | `#FDF2E7` |
| Rechazada                   | `#B95332` | `#FFFFFF` |
| Sin confirmar               | `#D9A52E` | `#432304` |
| Líder (con ícono de corona) | `#D9A52E` | `#432304` |

### Tabla (historial de recargas)

- Contenedor `#FDF2E7` con `overflow-x: auto`, ancho mín. 520px.
- Celdas `14px 18px`, separador `1.5px solid #E9D8C7`.
- Tarjeta siempre enmascarada (últimos 4 dígitos) con ícono de tarjeta en `#7A5634`. El formato exacto queda pendiente (P7 en CONTEXT.md): no hay detección de marca.

### Header (dashboard)

- Alto mín. 80px, borde inferior `2px solid #E9D8C7`.
- Logo 42px + "SnailRacer" Fredoka 24px · avatar 40px (`#58613A`) + nombre · botón "Cerrar sesión".

### Panel de marca (registro / login)

- Fondo `#432304`, contenido centrado.
- Concha del logo grande (`clamp(160px, 18vw, 240px)`) + "Snail" en `#FDF2E7` y "Racer" en `#F07E13`.
- Pie legal 13px en `#E9D8C7`.

---

## 5. Gráficas

**Barras: victorias por caracol** (Recharts)

- Barras `#F07E13`; los líderes en `#D9A52E`. En empate se resaltan todos (P6). Encima, texto con ícono de corona: "Líder: Carloscol · 2 victorias" o "Empate en el primer lugar: …", para no depender solo del color.
- **Desde 640px:** barras verticales; valor en Fredoka 18px sobre cada barra; nombre debajo en 13px/600; eje Y solo con enteros. Alto del área 240px, ancho máx. de barra 68px, eje base `3px solid #432304`.
- **Debajo de 640px:** barras horizontales para que el nombre se lea completo: nombre a la izquierda (13px/600, eje base `3px solid #432304`), valor a la derecha de cada barra, eje de valores solo con enteros. Alto del área 260px, grosor máx. de barra 28px.
- `role="img"` con `aria-label` que lista las victorias de cada caracol.

**Donut: apuestas ganadas vs. perdidas** (Recharts)

- Donut de 170px de diámetro, grosor del anillo 20px, sin separación entre segmentos.
- Segmento de ganadas `#58613A`, segmento de perdidas `#B95332`; tamaño proporcional al conteo.
- Al centro: porcentaje Fredoka 40px en `#58613A` + "efectividad" 14px.
- Leyenda debajo con cuadro (ganadas) y círculo (perdidas), con los conteos.
- `role="img"` con `aria-label` que diga los conteos; sin depender del tooltip para la información.

**Ambas gráficas** llevan la etiqueta visible "Datos de demostración del día" y se dibujan sin animación de entrada. Debajo, la lista "Resultados de las carreras" ("Carrera 1: ganó Carloscol") hace visible que barras y donut salen de las mismas carreras.

---

## 6. Modal de recarga

Es la única parte con explicación detallada; el resto del sitio usa el mínimo de texto.

| Estado          | Ícono                    | Título               | Acciones                                      |
| --------------- | ------------------------ | -------------------- | --------------------------------------------- |
| Formulario      | —                        | Recargar saldo       | Cancelar · **Recargar $X**                    |
| Procesando      | Spinner en el botón      | Recargar saldo       | Todo deshabilitado; "No cierres esta ventana" |
| Aprobado        | Check, círculo `#58613A` | ¡Recarga aprobada!   | **Listo**                                     |
| Rechazado       | X, círculo `#B95332`     | Tarjeta rechazada    | **Probar con otra tarjeta** · Cerrar          |
| Error / timeout | Reloj, círculo `#D9A52E` | Esto tardó demasiado | **Reintentar** · Ver historial                |

- Ícono de estado: 92px con halo de 10px (ver sombras).
- **Formulario:** número de tarjeta, vencimiento, CVV, chips de monto ($100, $200, $500, $1,000) + monto libre (mín. $50, ver P3).
  - Caja de resumen en `#E9D8C7`: cuánto se cobra y cuándo se suma al saldo.
  - **Aviso de datos de prueba:** "Usa solo tarjetas de prueba. Esta demo guarda los datos de la tarjeta en tu navegador." (No prometer que solo se guardan los últimos 4 dígitos: el contrato guarda número y CVV ficticios.)
- **Aprobado:** resumen con tarjeta enmascarada, fecha y nuevo saldo, más confeti en dorado, naranja y verde.
- **Rechazado:** aclarar que **no se hizo ningún cobro**.
- **Timeout:** indicar que no se aplicó ningún cargo, mostrar la referencia y permitir reintentar (copy final pendiente P8; títulos propios para `service_unavailable` e `internal_error`).
- Semántica: `role="dialog"` para formulario y aprobado, `role="alertdialog"` para rechazado y timeout, `aria-busy="true"` mientras procesa.

---

## 7. Movimiento

```css
@keyframes sr-slide {
  0% {
    transform: translateX(-70vw) rotate(-360deg);
  }
  100% {
    transform: translateX(0) rotate(0);
  }
}
@keyframes sr-pop {
  0% {
    opacity: 0;
    transform: translateY(18px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
.sr-shell {
  animation: sr-slide 1.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.sr-l {
  display: inline-block;
  opacity: 0;
  animation: sr-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@media (prefers-reduced-motion: reduce) {
  .sr-shell,
  .sr-l {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
```

- **Entrada del logo** (registro / login): la concha llega rodando en 1.6s; las letras aparecen una a una desde 1.35s, cada 70ms, con una pausa extra antes de "Racer". Corre una vez.
- **Spinner** del botón procesando: rotación lineal de 0.9s, infinita.
- Respetar siempre `prefers-reduced-motion` (además hay una regla global en `index.css` que reduce animaciones y transiciones).

---

## 8. Layout responsivo

- Páginas fluidas, no de ancho fijo; diseño base a 1440px.
- **Auth:** dos columnas (`flex: 1 1 520px` marca / `flex: 1 1 560px` formulario) que se apilan en pantallas angostas.
- **Dashboard:** filas de cards `flex-wrap` con proporción 1:2 (`flex: 1 1 340px` / `flex: 2 1 560px`); en celular quedan en una columna y la gráfica de victorias cambia a barras horizontales (< 640px).
- El header hace wrap; la tabla hace scroll horizontal dentro de su caja.
- Áreas táctiles de 44px como mínimo.

---

## 9. Tono del texto

- Español, tuteo, frases cortas. Nada de párrafos explicativos fuera del modal de recarga.
- Errores directos: "Correo no válido.", "Las contraseñas no coinciden.", "Correo o contraseña incorrectos." (genérico en login, nunca decir cuál falló).
- Guiños juguetones solo en títulos: "Únete a la carrera", "Qué bueno verte", "Este caracol se salió de la pista".
- Montos con signo y dos decimales: `$1,250.00 MXN`. Fechas cortas: `2 oct 2026`.

---

## 10. Variables CSS

Equivalencia de referencia; la fuente de verdad es `apps/web/src/styles/index.css`.

```css
:root {
  /* Base */
  --color-bg: #fdf2e7;
  --color-text: #432304;
  --color-primary: #f07e13;
  --color-secondary: #58613a;
  --color-surface: #e9d8c7;
  --color-highlight: #d9a52e;
  --color-accent: #b95332;

  /* Derivados */
  --color-text-muted: #7a5634;
  --color-border: #8f7358;
  --color-error-text: #8f3a1f;
  --color-error-bg: #f3d9cc;
  --color-success-text: #3d4426;
  --color-success-bg: #dcddc6;
  --color-warning-bg: #f2e1b8;
  --color-surface-shadow: #d7c0a8;
  --color-input-disabled: #f4e7d9;
  --color-primary-disabled: #f3b47a;

  /* Tipografía */
  --font-display: 'Fredoka', sans-serif;
  --font-body: 'Figtree', sans-serif;

  /* Forma y elevación */
  --radius: 0;
  --shadow-cta: 0 4px 0 #b95332;
  --shadow-card: 0 8px 0 #d7c0a8;
  --shadow-modal: 0 24px 48px rgba(67, 35, 4, 0.35);
  --focus-ring: 3px solid #f07e13;

  /* Medidas */
  --container: 1200px;
  --input-h: 50px;
  --btn-h: 54px;
  --touch-min: 44px;
}
```

# MEMORY.md — Memoria del proyecto

Registro de **cambios relevantes**, **problemas encontrados y sus soluciones** y **estado de las fases**.

> Este archivo se actualiza con cada cambio relevante. Las entradas son aditivas: lo más reciente al final de cada sección.

---

## 📍 Estado actual de las fases

| Fase | Descripción | Estado |
|---|---|---|
| 0 | Inicialización (andamiaje, docs, repo, CI) | ✅ Completada |
| 1 | Núcleo jugable (solver + generador + tablero) | ✅ Completada |
| 2 | Mecánicas completas (notas, deshacer, cronómetro, dificultades) | ✅ Completada |
| 3 | Pantallas + i18n (es / ca / en) | ✅ Completada |
| 4 | Visual, sonido y accesibilidad | ✅ Completada |
| 5 | Responsive y accesibilidad en móvil | ⬜ Pendiente |
| 6 | PWA + GitHub Pages | ⬜ Pendiente |
| 7 | Android (TWA con Bubblewrap) | ⬜ Pendiente |
| 8 | Tarjeta en el portfolio (ES/EN) | ⬜ Pendiente |

---

## 📝 Registro de cambios

### 2026-10-15 — Fase 0: inicialización del proyecto
- `git init` en rama **`main`** (se evita desde el inicio la discrepancia
  `master`/`main` que arrastran los otros repos).
- Andamiaje Vite + TypeScript: `package.json` (scripts `dev`, `build`,
  `preview`), `tsconfig.json` (strict), `vite.config.ts` con **`base: './'`**,
  `index.html` y `src/main.ts` con pantalla provisional.
  - *Decisión:* `base: './'` (relativa, igual que 3 en raya) en lugar de
    `base: '/sudoku/'`: funciona igual en local y en el subdirectorio de Pages.
- `src/styles/base.css`: **variables de tema desde el inicio**
  (`--bg`, `--acento`, `--error`, `--linea`…) — arquitectura de temas lista.
- `.gitignore` adaptado de 3 en raya (incluye keystore, gradle y APK/AAB de la Fase 7).
- Documentación inicial: `PLAN.md` (9 fases), `AGENTS.md`, `MEMORY.md` y `README.md`.
- CI mínima (`.github/workflows/ci.yml`): `npm ci` + `npm.cmd run build` en
  cada push/PR a `main`. El workflow de despliegue a Pages llega en la Fase 6.
- **Nota:** los comandos `prueba` / `iconos` **no existen todavía**; se añaden
  a `package.json` en las Fases 1 y 6 respectivamente (documentar solo lo que existe).

### 2026-10-15 — Fase 1: núcleo jugable
- `src/game/solver.ts`: reglas (`esValida`, `sinConflictos`, `estaResuelto`) y
  solver backtracking; `contarSoluciones(t, límite)` cuenta con corte en el
  límite → con `2` responde «¿es única?». Semántica robusta: un tablero con
  conflictos devuelve **0 soluciones** (no "1 falsa").
- `src/game/generador.ts`:
  - `generarSolucion()`: relleno con candidatos barajados (Fisher-Yates).
  - `generarPuzzle(dificultad)`: vacía casillas por **pares simétricos**
    (i, 80-i) manteniendo la unicidad en cada paso; se detiene al objetivo de
    pistas sin bajar del mínimo del rango.
  - Rangos: fácil 40-46, medio 33-38, difícil 26-31 pistas.
  - `crearRng(semilla)` (mulberry32) para pruebas **deterministas**; por
    defecto `Math.random` en ejecución normal.
- **Pruebas** (`pruebas/generador.ts`, `npm.cmd run prueba`): 87 comprobaciones
  ✅ — reglas (fila/columna/bloque), soluciones válidas, unicidad de los 15
  puzzles (5 por dificultad, semillas fijas), pistas dentro de rango, coherencia
  puzzle↔solución y que el solver reproduce la solución.
- UI (`src/ui/`):
  - `menu.ts`: inicio con las 3 dificultades; exporta `OpcionesPartida`.
  - `game.ts`: tablero 9×9 (CSS grid, cortes de bloque 3×3 con clases
    `corte-dcho`/`corte-abajo`), selección de casilla, escritura/borrado,
    **errores marcados automáticamente contra la solución** (el ajuste
    «automático vs botón comprobar» llega en Fase 2) y superposición de
    victoria con Otra partida / Menú.
  - `teclado.ts`: teclado numérico en pantalla, rejilla 5×2 (1-9 + ⌫),
    targets de 52 px.
- `src/main.ts`: router menú → partida → victoria → otra/menú.
- `ci.yml`: añadido el paso `npm run prueba` antes del build.
- **Incidencia TS:** TypeScript no conserva el estrechamiento de
  `getElementById` dentro de las funciones → `document.getElementById('app')!`
  (mismo patrón que tres-en-raya).
- **Incidencia de publicación (pendiente):** el primer push a GitHub fue
  rechazado — el token `gh` no tiene el scope `workflow` (necesario para
  subir `.github/workflows/`). Solución: ejecutar `gh auth refresh -s workflow`
  (flujo de dispositivo interactivo) y volver a hacer push.

### 2026-10-15 — Incidencia de publicación resuelta + CI en verde
- El usuario autorizó el scope `workflow` con `gh auth refresh -h github.com -s workflow`
  (flujo de dispositivo: se lanzó en segundo plano y se le pasó el código).
- Push de `main` a `https://github.com/andreu-marbor/sudoku` ✅.
- Workflow **CI** (run 38694083291) en verde: `npm ci` + `npm run prueba` + `npm run build`.

### 2026-10-15 — Fase 2: mecánicas completas
- `src/persistencia.ts`: acceso **centralizado** a localStorage con tolerancia
  a errores (modo privado/cuota llena: nunca tirar la partida por no guardar).
- `src/game/notas.ts`: candidatos (modo lápiz) como **máscara de bits** por
  casilla — 81 números en vez de 81 arrays.
- `src/game/cronometro.ts`: cronómetro con pausa (iniciar/pausar/alternar/
  reiniciar, tick a 500 ms).
- `src/game/partida.ts`: **máquina de estados sin DOM** (todo testeable):
  - `colocarNumero` escribe/borra y **limpia el candidato del valor en fila,
    columna y bloque**; `alternarNota` alterna candidatos.
  - `deshacer` con pila de jugadas que guarda el estado anterior de lo
    afectado (valor, notas propias y notas de los pares modificados).
  - `esError` (contra la solución), `estaCompletado`, `formatearTiempo`.
  - `validarPartida`: al leer de localStorage descarta datos corruptos
    (longitudes, rangos, modo/dificultad desconocidos).
- UI:
  - **Menú**: «Continuar partida» (si hay guardada), **mejores tiempos** por
    dificultad y ajuste «Marcar errores automáticamente» (persistido; por
    defecto activo — el plan lo deja como preferencia).
  - **Partida**: cabecera con cronómetro, botones **↩ deshacer**, **✏️/🔢**
    modo números-notas y **✓ comprobar**; el teclado se tiñe en modo lápiz;
    las notas se pintan como mini rejilla 3×3 dentro de la casilla.
  - **Pausa automática** al pasar a segundo plano (`visibilitychange`) y
    guardado al salir (`pagehide`); al completar se borra la partida guardada
    y se registra el mejor tiempo (el overlay avisa si es **¡Nuevo récord!**).
  - `main.ts`: el router limpia listeners y cronómetro de la pantalla anterior.
- **Pruebas**: `pruebas/partida.ts` (`npm.cmd run prueba:partida`) — 51
  comprobaciones ✅: creación, escritura, limpieza de candidatos, deshacer,
  notas, modo, errores, Victoria, tiempo y validación de datos corruptos.
- **Bug corregido**: `crearTeclado` pisaba el `className` del contenedor y el
  teclado se quedaba sin el ancho fijo; ahora el contenedor trae sus clases y
  la función no las toca.
- **Verificado**: `npm.cmd run prueba` ✅ (generador + partida) y
  `npm.cmd run build` ✅.

### 2026-10-15 — Fase 3: i18n completo (es · ca · en)
- `src/i18n/index.ts`: sistema propio — claves planas en inglés, 26 claves ×
  3 JSON, `t('clave', params)` con sustitución de `{parametros}`,
  `setLang()` persistente, `aplicarIdiomaInicial()` (localStorage →
  `navigator.language` → `es`), `onCambioIdioma()` (suscripción de
  repintado) y actualización del atributo `<html lang>`.
  - Guardas `typeof document !== 'undefined'`: el mismo módulo funciona en
    Node para las pruebas.
- `src/ui/lang.ts`: selector reutilizable **ES · VA · EN** (botones-pastilla
  con `aria-pressed`, nombre completo en `title` y `aria-label`).
- `menu.ts`: textos por `t()` + selector de idioma en una fila inferior; se
  repinta entero al cambiar de idioma (devuelve la baja de la suscripción).
- `game.ts`: **cambio de idioma en partida sin perder el estado** —
  `repintarTextos()` actualiza cabecera, aria-labels de las 81 casillas
  (incluidas notas), teclado, superposición de victoria y selector.
  `ETIQUETAS_DIFICULTAD` → `CLAVES_DIFICULTAD` (i18n en menú y cabecera).
- `main.ts`: `aplicarIdiomaInicial()` al arrancar y `document.title` ligado
  al idioma. `mostrarMenu` ahora devuelve su limpieza (como `mostrarJuego`).
- **Pruebas**: `pruebas/i18n.ts` (`npm.cmd run prueba:i18n`) — paridad de
  claves entre los 3 JSON, sin textos vacíos, placeholders `{param}`
  idénticos por clave, claves críticas y traducciones concretas de comprobación.
- CSS: `.fila-idioma`, `.selector-idioma` y `.boton-idioma` (targets de 44 px,
  activo resaltado con `--acento`).
- **Verificado**: `npm.cmd run prueba` ✅ (generador + partida + i18n) y
  `npm.cmd run build` ✅.

### 2026-10-15 — Fase 4: visual y "game feel"
- `src/efectos.ts`: motor de **sonido WebAudio con tonos generados**
  (cero assets): escribir (Do5), nota (Mi5, triángulo), borrar (Re4),
  error (graves, cuadrada), clic de UI y **fanfarria de Victoria**
  (Do–Mi–Sol–Do). `AudioContext` perezoso + `resume()` (política de autoplay
  móvil). **Vibración háptica** (`navigator.vibrate` con detección de
  soporte), `prefiereMovimientoReducido()` y **botón 🔊/🔇** persistido en
  `localStorage` (activo por defecto).
- `src/ui/confeti.ts`: lluvia de confeti DOM (60 piezas con color, tamaño,
  deriva, giro y retardo aleatorios); se omite con `prefers-reduced-motion`
  y se limpia a los 4,6 s.
- `src/styles/animations.css`: número que **entra con rebote**
  (`cubic-bezier(0.34,1.56,0.64,1)`), **sacudida** al marcar error, tarjeta
  de victoria con rebote y caída del confeti — todo anulado bajo
  `prefers-reduced-motion`.
- `game.ts`: feedback integrado — error con prioridad (sonido grave +
  vibración `[25,45,25]`), tono de éxito + vibración corta al escribir,
  tono distinto en modo notas y al borrar; `efectos.ui()` en deshacer,
  modo y comprobar; fanfarria + confeti + vibración larga al completar.
- Fila de ajustes (`.fila-ajustes`): selector de idioma **y** botón de
  sonido, en menú y en partida.
- Nueva clave `sound.label` (27 claves por idioma; la paridad i18n la cubre
  la prueba existente).
- **Verificado**: `npm.cmd run prueba` ✅ (las 3 suites) y `npm.cmd run build` ✅.

# MEMORY.md — Memoria del proyecto

Registro de **cambios relevantes**, **problemas encontrados y sus soluciones** y **estado de las fases**.

> Este archivo se actualiza con cada cambio relevante. Las entradas son aditivas: lo más reciente al final de cada sección.

---

## 📍 Estado actual de las fases

| Fase | Descripción | Estado |
|---|---|---|
| 0 | Inicialización (andamiaje, docs, repo, CI) | ✅ Completada |
| 1 | Núcleo jugable (solver + generador + tablero) | ✅ Completada |
| 2 | Mecánicas completas (notas, deshacer, cronómetro, dificultades) | ⬜ Pendiente |
| 3 | Pantallas + i18n (es / ca / en) | ⬜ Pendiente |
| 4 | Visual, sonido y accesibilidad | ⬜ Pendiente |
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

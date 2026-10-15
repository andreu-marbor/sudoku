# MEMORY.md — Memoria del proyecto

Registro de **cambios relevantes**, **problemas encontrados y sus soluciones** y **estado de las fases**.

> Este archivo se actualiza con cada cambio relevante. Las entradas son aditivas: lo más reciente al final de cada sección.

---

## 📍 Estado actual de las fases

| Fase | Descripción | Estado |
|---|---|---|
| 0 | Inicialización (andamiaje, docs, repo, CI) | ✅ Completada |
| 1 | Núcleo jugable (solver + generador + tablero) | ⬜ Pendiente |
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

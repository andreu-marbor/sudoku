# AGENTS.md — Información del proyecto

## ¿Qué es este proyecto?

Un **sudoku para Android** (y web) pensado como proyecto de portfolio.
Juego completo: generador propio con dificultades, notas, deshacer, cronómetro,
persistencia de partida y acabado visual cuidado. Multilenguaje: **español,
valenciano y inglés**.

- **Objetivo:** juego completo publicado (PWA + APK) en 6-7 días de trabajo.
- **Público:** usuarios casuales + revisores de portfolio.
- **Idioma del código y la documentación:** español.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Lenguaje | TypeScript |
| Build | Vite |
| Render | DOM + CSS (no Canvas) |
| Estilo | CSS con variables (arquitectura de temas) |
| i18n | Sistema propio con JSON (`es`, `ca`, `en`) |
| Persistencia | `localStorage` |
| Sonido | WebAudio (tonos generados, sin assets externos) |
| Pruebas | esbuild + Node (`npm.cmd run prueba`) — sin Jest/Vitest |
| Empaquetado Android | PWA + Bubblewrap (sin Android Studio) |
| Entorno | Solo VSCode + terminal |

## Estructura de directorios

Ver el árbol completo en **[PLAN.md](./PLAN.md)** (sección 3). Resumen:

```
sudoku/
├── index.html · package.json · vite.config.ts
├── PLAN.md · MEMORY.md · AGENTS.md · README.md
├── .github/workflows/         # ci.yml (build) · despliegue.yml (Pages, Fase 6)
├── scripts/                   # generar-iconos.mjs (Fase 6)
├── pruebas/                   # esbuild + Node
├── public/                    # manifest.json, sw.js, icons (Fase 6)
├── src/
│   ├── main.ts                # arranque + router de pantallas
│   ├── persistencia.ts · efectos.ts
│   ├── styles/                # base.css (variables) · animations.css
│   ├── game/                  # solver · generador · partida · notas · cronometro
│   ├── i18n/                  # index.ts + es.json · ca.json · en.json
│   └── ui/                    # menu · game · teclado · result · lang · confeti
└── twa-manifest.json + android.keystore + gradle/   # Fase 7 (Bubblewrap)
```

> ⚠️ `app/`, `gradle/`, `build.gradle`... son **generados** por `bubblewrap build`
> a partir de `twa-manifest.json`. No editarlos a mano.
> `build/`, `.gradle/`, `local.properties`, `*.apk/aab` y `*.keystore` están en `.gitignore`.

## Convenciones del proyecto

- **Todo el texto visible al usuario pasa por `t('clave')`** — nunca cadenas
  hardcodeadas (una vez exista i18n, Fase 3; hasta entonces se documenta en `MEMORY.md`).
- **Colores y tipografía SIEMPRE vía variables CSS** (`--bg`, `--acento`...),
  nunca valores fijos.
- **Código, comentarios y documentación en español.**
- Nombres de archivos en minúscula/sin espacios.
- Claves i18n planas y en inglés (`menu.continuar`, `game.error`).
- Persistencia (`localStorage`) centralizada en `persistencia.ts`.
- Pruebas deterministas; sin dependencias nuevas para lo que ya resuelve Node.

## Idiomas soportados

| Código ISO | Idioma | Nota |
|---|---|---|
| `es` | Español | Idioma por defecto (`fallback`) |
| `ca` | Valencià | Código ISO del catalán/valenciano; el nombre visible es "Valencià" |
| `en` | English | |

Detección de idioma: `localStorage` → `navigator.language` → `es`.

## Comandos útiles

> ⚠️ En PowerShell la política de ejecución bloquea `npm.ps1`; usar siempre la
> variante **`npm.cmd`** (contexto en `tres-en-raya/MEMORY.md`).

```bash
npm.cmd install        # instalar dependencias
npm.cmd run dev        # servidor de desarrollo
npm.cmd run build      # build de producción (tsc + vite)
npm.cmd run preview    # previsualizar build (localhost:4173)
npm.cmd run prueba     # pruebas (disponible desde la Fase 1)
```

### Publicación (Fases 6-7)

> Igual que `npm`: usar **`bubblewrap.cmd`** (JDK + Android SDK en
> `~/.bubblewrap/config.json`; contraseñas FUERA del repo).

```bash
gh run list                       # estado del último workflow
gh workflow run despliegue.yml    # lanzar el despliegue a mano (Fase 6)

bubblewrap.cmd doctor             # valida JDK + SDK
bubblewrap.cmd build              # genera APK + AAB (Fase 7)
```

**URLs:** web → `https://andreu-marbor.github.io/sudoku/` · repo → `https://github.com/andreu-marbor/sudoku`

## ⚠️ Memoria del proyecto

Existe un archivo **[MEMORY.md](./MEMORY.md)** que registra cambios relevantes,
problemas encontrados con su solución y el estado de las fases.

**Instrucción para agentes:** tras cada cambio relevante o incidencia,
**actualizar `MEMORY.md`** añadiendo una entrada con fecha, descripción y
solución. No borrar entradas anteriores; solo añadir.

## Plan

El plan completo (fases, alcance, decisiones) está en **[PLAN.md](./PLAN.md)**.

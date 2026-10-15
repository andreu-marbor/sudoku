# Plan: Sudoku multilenguaje (es · va · en)

Juego de sudoku para Android, completo y con acabado cuidado, pensado como
proyecto de portfolio: una sola base de código para web (PWA) y APK (TWA).

## 1. Decisiones confirmadas

| Aspecto | Decisión |
|---|---|
| Stack | TypeScript + Vite + DOM/CSS (sin framework, sin dependencias de runtime) |
| Alcance v1 | Juego completo: generador con dificultades, notas, deshacer, errores, cronómetro, persistencia, sonido/háptica |
| Idiomas | Español, Valencià, English — selector persistente + detección automática |
| Android | PWA instalable → TWA con **Bubblewrap** (sin Android Studio) |
| Publicación | Repo `andreu-marbor/sudoku` en rama **`main`** + CI a GitHub Pages + APK en releases |
| Portfolio | Tarjeta en `andreu-marbor.github.io` (ES y EN) |
| Entorno | Solo VSCode + terminal (sin IDE específico) |

## 2. Stack técnico

| Elección | Motivo |
|---|---|
| **Vite + TypeScript** | Arranque instantáneo, build optimizado, mismo flujo que el resto de proyectos |
| **DOM + CSS** (no Canvas) | Para un tablero 9×9 el DOM da mejor acabado: animaciones CSS baratas, texto i18n nativo, accesibilidad ARIA |
| **JSON de idiomas** | Sistema i18n propio (no hace falta i18next para ~60 claves) |
| **Pruebas con esbuild + Node** | Se reutiliza el compilador que ya está en el proyecto; sin Jest ni Vitest |
| **PWA + Bubblewrap** | APK/AAB sin abrir Android Studio |

## 3. Estructura del proyecto

```
sudoku/
├── index.html
├── package.json · tsconfig.json · vite.config.ts   # base './' (subdirectorio de Pages)
├── PLAN.md                   # este archivo
├── MEMORY.md                 # memoria de cambios y problemas (solo aditiva)
├── AGENTS.md                 # información del proyecto para agentes
├── README.md                 # README del portfolio
├── .github/
│   └── workflows/
│       ├── ci.yml             # CI: build en cada push/PR
│       └── despliegue.yml     # (Fase 6) prueba + build + deploy en Pages
├── docs/capturas/             # imágenes y GIFs para el README (Fase 6)
├── scripts/
│   └── generar-iconos.mjs     # genera los PNG del PWA (Fase 6)
├── pruebas/
│   ├── generador.ts           # unicidad y validez de los puzzles (Fase 1)
│   ├── partida.ts             # máquina de estados de la partida (Fase 2)
│   └── i18n.ts                # paridad de claves entre idiomas (Fase 3)
├── public/
│   ├── manifest.json          # PWA (Fase 6)
│   ├── sw.js                  # service worker (Fase 6)
│   └── icons/                 # SVG fuentes + PNG generados (Fase 6)
├── src/
│   ├── main.ts                # arranque + router de pantallas
│   ├── vite-env.d.ts
│   ├── persistencia.ts        # acceso centralizado a localStorage
│   ├── efectos.ts             # sonido WebAudio, vibración y botón 🔊 (Fase 4)
│   ├── styles/
│   │   ├── base.css           # variables de tema
│   │   └── animations.css     # animaciones (Fase 4)
│   ├── game/
│   │   ├── solver.ts          # backtracking + conteo de soluciones (únicidad)
│   │   ├── generador.ts       # genera puzzles con dificultad
│   │   ├── partida.ts         # estado de la partida + movimientos
│   │   ├── notas.ts           # candidatos (lápiz) 9×9
│   │   └── cronometro.ts      # tiempo con pausa
│   ├── i18n/
│   │   ├── index.ts           # setLang(), t('key')
│   │   ├── es.json · ca.json · en.json
│   └── ui/
│       ├── menu.ts            # inicio: idioma + dificultad + continuar
│       ├── game.ts            # tablero 9×9 + estados
│       ├── teclado.ts         # teclado numérico en pantalla (1-9, borrar, notas)
│       ├── result.ts          # superposición de Victoria + estadísticas
│       ├── lang.ts            # selector ES · VA · EN
│       └── confeti.ts         # confeti de Victoria (Fase 4)
│
│ # ── Empaquetado Android (Fase 7, Bubblewrap) ──
├── twa-manifest.json          # packageId com.andreumarbor.sudoku, startUrl /sudoku/
├── manifest-checksum.txt
├── android.keystore           # clave de firma (GITOUCHADA — contraseña FUERA del repo)
├── build.gradle / settings.gradle / gradle.properties / gradlew / gradle/ / app/
└── README.md
```

> ⚠️ `app/`, `gradle/`, `build.gradle`… son **generados** por `bubblewrap build`
> a partir de `twa-manifest.json`. No editarlos a mano.

## 4. Decisiones técnicas clave

- **Generador propio** (sin banco de puzzles): solver backtracking con
  **conteo de soluciones** (corta en 2 → unicidad garantizada), relleno por
  barajado y eliminación simétrica de casillas.
- **Dificultad** por nº de pistas + verificación de resolubilidad con técnicas
  simples (naked singles) en las dificultades fáciles.
- **Base relativa `./`** en Vite: funciona en local y en el subdirectorio
  `https://andreu-marbor.github.io/sudoku/` (patrón probado en 3 en raya).
- **Rama única `main`** desde el init: evita la discrepancia `master`/`main`
  que arrastran otros repos.
- **Keystore**: se reutiliza el de 3 en raya (misma huella); en
  `assetlinks.json` solo se añade el `package_name` nuevo.

## 5. Fases de trabajo

### Fase 0 — Inicialización
- `git init` en `main`, andamiaje Vite + TS, `.gitignore`.
- Documentación: `PLAN.md`, `AGENTS.md`, `MEMORY.md`, `README.md`.
- Repo en GitHub + CI mínima (build en push/PR).
- ✅ *Resultado: `npm.cmd run build` verde y push a `main`.*

### Fase 1 — Núcleo jugable
- `solver.ts` + `generador.ts` con pruebas de unicidad y validez.
- Tablero 9×9 DOM, entrada de números, validación, detección de Victoria.
- Variables CSS del tema definidas desde el inicio.
- ✅ *Resultado: se genera y completa un sudoku válido.*

### Fase 2 — Mecánicas completas
- Notas/lápiz (candidatos), deshacer (pila de movimientos).
- Marcado de errores, cronómetro con pausa, 3 dificultades.
- Partida en curso persistida en `localStorage` + mejores tiempos.
- ✅ *Resultado: partida compleja que se retoma tras recargar.*

### Fase 3 — Pantallas + i18n
- Router: menú → partida → Victoria → revancha/nuevo juego.
- Sistema i18n + los 3 JSON (`es`, `ca`, `en`), selector persistente.
- Prueba de paridad de claves; 0 textos fuera de `t()`.
- ✅ *Resultado: el juego completo en los 3 idiomas.*

### Fase 4 — Visual y "game feel"
- Estética con identidad, animaciones (número que entra, error, confeti).
- Sonido WebAudio generado (cero assets) + vibración háptica + botón 🔊.
- Accesibilidad: ARIA-grid, flechas de teclado, foco, `prefers-reduced-motion`.
- ✅ *Resultado: acabado de portfolio.*

### Fase 5 — Responsive y accesibilidad
- Targets ≥44 px, orientación vertical/horizontal, test en móvil real.
- ✅ *Resultado: cómodo en pantalla táctil.*

### Fase 6 — PWA + GitHub Pages
- `manifest.json`, service worker, iconos con sharp, README con capturas.
- Workflow `despliegue.yml`: prueba → build → Pages en cada push a `main`.
- ✅ *Resultado: jugable en https://andreu-marbor.github.io/sudoku/.*

### Fase 7 — Android (TWA)
- Keystore + `twa-manifest.json` (`com.andreumarbor.sudoku`, `startUrl /sudoku/`).
- `bubblewrap.cmd build` → APK/AAB, publicación en releases.
- Entrada nueva en `andreu-marbor.github.io/.well-known/assetlinks.json`.
- ✅ *Resultado: APK instalada, abierta a pantalla completa.*

### Fase 8 — Portfolio
- Tarjeta `<article class="proyecto" id="sudoku">` en `index.html` **y** `en.html`
  (etiqueta, resumen, arquitectura, decisiones, enlaces Jugar/Código/APK).
- ✅ *Resultado: el proyecto visible en el portfolio.*

## 6. Arquitectura de temas

Desde la Fase 1 todo el diseño usa variables CSS (`--bg`, `--acento`…),
definidas en `src/styles/base.css`. Un futuro `[data-theme="oscuro"]` cambia
la paleta sin tocar el resto del CSS ni la lógica.

## 7. Publicación

- Web → `https://andreu-marbor.github.io/sudoku/`
- Repo → `https://github.com/andreu-marbor/sudoku`
- APK → releases del repo
- `assetlinks.json` alojado en la raíz del dominio del portfolio
  (patrón ya probado con 3 en raya).

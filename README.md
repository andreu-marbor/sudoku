# Sudoku — multilenguaje (es · va · en)

Juego de **sudoku** para Android y web: generador propio con solución única,
dificultades, notas (modo lápiz), deshacer, cronómetro con pausa, mejores
tiempos y partida en curso persistida. Una sola base de código para la PWA y
la APK (Trusted Web Activity).

Proyecto de portfolio escrito en español: TypeScript + Vite + DOM/CSS, sin
framework ni dependencias de runtime.

## Enlaces

- **Web (PWA):** https://andreu-marbor.github.io/sudoku/
- **Código:** https://github.com/andreu-marbor/sudoku
- **APK:** releases del repo *(Fase 7)*

## Desarrollo

```bash
npm.cmd install        # instalar dependencias
npm.cmd run dev        # servidor de desarrollo (localhost:5173)
npm.cmd run build      # build de producción (tsc + vite)
npm.cmd run preview    # previsualizar el build
npm.cmd run prueba     # pruebas (generador + partida + i18n)
npm.cmd run iconos     # regenerar los PNG del PWA desde los SVG
```

> En PowerShell usa siempre `npm.cmd` (la política de ejecución bloquea `npm.ps1`).

## Características

- Generador propio de puzzles con **solución única** (backtracking con
  conteo de soluciones) y tres dificultades por nº de pistas.
- Modo lápiz con candidatos, deshacer ilimitado, comprobación de errores
  (automática o a demanda) y cronómetro con pausa automática al cambiar de
  app.
- Multilenguaje: **español, valencià y english**, con selector persistente
  y detección automática del navegador.
- PWA instalable con trabajo offline (red con respaldo en caché).
- Sonido generado con WebAudio (cero assets), vibración háptica y soporte de
  `prefers-reduced-motion`.
- Accesibilidad: ARIA grid con flechas de teclado, región viva y targets
  táctiles de 44 px.

## Estado

El avance por fases se documenta en [`PLAN.md`](./PLAN.md) y el registro de
cambios en [`MEMORY.md`](./MEMORY.md).

## Licencia

Proyecto personal — Andreu Martínez Bordes.

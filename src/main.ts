/* ============================================================
   main.ts — Arranque y router de pantallas
   Flujo: menú → partida (nueva o continua) → victoria (superposición)
   → otra partida o menú. La persistencia vive en localStorage.
   ============================================================ */

import './styles/base.css';
import './styles/animations.css';

import { generarPuzzle } from './game/generador';
import {
  crearPartida,
  validarPartida,
  type EstadoPartida,
} from './game/partida';
import type { Dificultad } from './game/generador';
import { borrar, guardarJson, guardarTexto, leerJson, leerTexto } from './persistencia';
import { aplicarIdiomaInicial, onCambioIdioma, t } from './i18n';
import { mostrarMenu, type OpcionesPartida, type ReferenciaMenu } from './ui/menu';
import { mostrarJuego } from './ui/game';

const app = document.getElementById('app')!;

// Idioma inicial: preferencia guardada → navegador → 'es'
aplicarIdiomaInicial();

// El título del documento también cambia de idioma
function actualizarTitulo(): void {
  document.title = t('app.title');
}
onCambioIdioma(actualizarTitulo);
actualizarTitulo();

// PWA: registrar el service worker solo en producción (red con respaldo
// en caché; en dev se omite para no interferir con el HMR)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.warn('Service worker no registrado:', error);
    });
  });
}

const CLAVE_PARTIDA = 'partida';
const CLAVE_MEJORES = 'mejoresTiempos';
const CLAVE_ERRORES = 'erroresAutomaticos';

let limpiarActual: (() => void) | null = null;

// --- Utilidades de persistencia ---

function cargarPartidaGuardada(): EstadoPartida | null {
  return validarPartida(leerJson<unknown>(CLAVE_PARTIDA));
}

function cargarMejores(): Partial<Record<Dificultad, number>> {
  const m = leerJson<Partial<Record<Dificultad, number>>>(CLAVE_MEJORES);
  return m !== null && typeof m === 'object' ? m : {};
}

function erroresAutomaticos(): boolean {
  return leerTexto(CLAVE_ERRORES) !== '0'; // activados por defecto
}

function registrarResultado(p: EstadoPartida): boolean {
  borrar(CLAVE_PARTIDA); // ya no hay "continuar"
  const mejores = cargarMejores();
  const actual = mejores[p.dificultad];
  if (actual === undefined || p.tiempoMs < actual) {
    mejores[p.dificultad] = p.tiempoMs;
    guardarJson(CLAVE_MEJORES, mejores);
    return true;
  }
  return false;
}

// --- Router sencillo ---

function irAMenu(): void {
  limpiarActual?.();
  const ref: ReferenciaMenu = {
    hayPartidaGuardada: cargarPartidaGuardada() !== null,
    mejoresTiempos: cargarMejores(),
    erroresAutomaticos: erroresAutomaticos(),
  };
  limpiarActual = mostrarMenu(app, ref, {
    onJugar: irAJuego,
    onContinuar: () => {
      const guardada = cargarPartidaGuardada();
      if (guardada) arrancar(guardada);
      else irAMenu();
    },
    onCambiarErrores: (activo) => guardarTexto(CLAVE_ERRORES, activo ? '1' : '0'),
  });
}

function irAJuego(opciones: OpcionesPartida): void {
  const puzzle = generarPuzzle(opciones.dificultad);
  arrancar(crearPartida(puzzle.puzzle, puzzle.solucion, opciones.dificultad));
}

function arrancar(partida: EstadoPartida): void {
  limpiarActual?.();
  limpiarActual = mostrarJuego(app, partida, {
    irAMenu,
    onOtra: () => irAJuego({ dificultad: partida.dificultad }),
    alGuardar: (p) => guardarJson(CLAVE_PARTIDA, p),
    alCompletar: registrarResultado,
    erroresAutomaticos: erroresAutomaticos(),
  });
}

irAMenu();

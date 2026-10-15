/* ============================================================
   main.ts — Arranque y router de pantallas
   Flujo: menú (dificultad) → partida → victoria (superposición)
   → otra partida o menú.
   ============================================================ */

import './styles/base.css';

import { mostrarMenu, type OpcionesPartida } from './ui/menu';
import { mostrarJuego } from './ui/game';

const app = document.getElementById('app')!;

// --- Router sencillo ---
function irAMenu(): void {
  mostrarMenu(app, irAJuego);
}

function irAJuego(opciones: OpcionesPartida): void {
  mostrarJuego(app, opciones, irAMenu);
}

irAMenu();

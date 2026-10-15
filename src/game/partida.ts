/* partida.ts — estado de la partida y reglas de movimiento (sin DOM).
   Todas las mutaciones pasan por aquí: así se pueden deshacer, persistir
   y testear. Cada jugada guarda el estado anterior de lo que toca. */

import { type Dificultad } from './generador';
import { crearNotas, quitarCandidato, type Notas } from './notas';
import { bloqueDe, columnaDe, filaDe, VACIO, type Tablero } from './solver';

export type Modo = 'numeros' | 'notas';

export interface Jugada {
  casilla: number;
  valorAnterior: number;
  notasAnteriores: number;
  paresModificados: Array<{ casilla: number; bitsAnteriores: number }>;
}

export interface EstadoPartida {
  puzzle: Tablero; // casillas dadas (inmutables)
  solucion: Tablero; // solución única (para errores y Victoria)
  tablero: Tablero; // estado escrito por el jugador
  notas: Notas; // candidatos por casilla (máscara de bits)
  modo: Modo;
  dificultad: Dificultad;
  pistas: number;
  tiempoMs: number;
  jugadas: Jugada[]; // pila de deshacer
}

export function crearPartida(
  puzzle: Tablero,
  solucion: Tablero,
  dificultad: Dificultad,
): EstadoPartida {
  return {
    puzzle: puzzle.slice(),
    solucion: solucion.slice(),
    tablero: puzzle.slice(),
    notas: crearNotas(),
    modo: 'numeros',
    dificultad,
    pistas: puzzle.filter((v) => v !== VACIO).length,
    tiempoMs: 0,
    jugadas: [],
  };
}

export function esPista(e: EstadoPartida, i: number): boolean {
  return e.puzzle[i] !== VACIO;
}

export function alternarModo(e: EstadoPartida): void {
  e.modo = e.modo === 'numeros' ? 'notas' : 'numeros';
}

/** Escribe un número (0 = borrar). Al escribir v se limpia el candidato v
    de las casillas que lo tengan en fila, columna y bloque. */
export function colocarNumero(e: EstadoPartida, i: number, v: number): boolean {
  if (esPista(e, i) || e.tablero[i] === v) return false;

  const jugada: Jugada = {
    casilla: i,
    valorAnterior: e.tablero[i],
    notasAnteriores: e.notas[i],
    paresModificados: [],
  };

  if (v !== VACIO) {
    for (let j = 0; j < e.tablero.length; j++) {
      if (j === i || e.notas[j] === 0) continue;
      const mismaFila = filaDe(j) === filaDe(i);
      const mismaColumna = columnaDe(j) === columnaDe(i);
      const mismoBloque = bloqueDe(j) === bloqueDe(i);
      if ((mismaFila || mismaColumna || mismoBloque) && e.notas[j] & (1 << (v - 1))) {
        jugada.paresModificados.push({ casilla: j, bitsAnteriores: e.notas[j] });
        quitarCandidato(e.notas, j, v);
      }
    }
  }

  e.tablero[i] = v;
  e.notas[i] = 0;
  e.jugadas.push(jugada);
  return true;
}

/** Alterna el candidato v en la casilla (modo lápiz). */
export function alternarNota(e: EstadoPartida, i: number, v: number): boolean {
  if (esPista(e, i) || e.tablero[i] !== VACIO || v === VACIO) return false;
  e.jugadas.push({
    casilla: i,
    valorAnterior: e.tablero[i],
    notasAnteriores: e.notas[i],
    paresModificados: [],
  });
  e.notas[i] ^= 1 << (v - 1);
  return true;
}

export function deshacer(e: EstadoPartida): boolean {
  const jugada = e.jugadas.pop();
  if (!jugada) return false;
  e.tablero[jugada.casilla] = jugada.valorAnterior;
  e.notas[jugada.casilla] = jugada.notasAnteriores;
  for (const par of jugada.paresModificados) {
    e.notas[par.casilla] = par.bitsAnteriores;
  }
  return true;
}

/** Error contra la solución (las pistas siempre coinciden). */
export function esError(e: EstadoPartida, i: number): boolean {
  return e.tablero[i] !== VACIO && e.tablero[i] !== e.solucion[i];
}

export function estaCompletado(e: EstadoPartida): boolean {
  return e.tablero.every((v, i) => v === e.solucion[i]);
}

export function formatearTiempo(ms: number): string {
  const totalSegundos = Math.floor(ms / 1000);
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

function esTablero(x: unknown): x is number[] {
  return (
    Array.isArray(x) &&
    x.length === 81 &&
    x.every((v) => Number.isInteger(v) && v >= 0 && v <= 9)
  );
}

function esDificultad(x: unknown): x is Dificultad {
  return x === 'facil' || x === 'medio' || x === 'dificil';
}

/** Valida una partida leída de localStorage; null si está corrupta. */
export function validarPartida(obj: unknown): EstadoPartida | null {
  if (typeof obj !== 'object' || obj === null) return null;
  const p = obj as Record<string, unknown>;

  if (!esTablero(p.puzzle) || !esTablero(p.solucion) || !esTablero(p.tablero)) return null;
  if (
    !Array.isArray(p.notas) ||
    p.notas.length !== 81 ||
    !p.notas.every((n) => Number.isInteger(n) && n >= 0 && n < 512)
  ) {
    return null;
  }
  if (p.modo !== 'numeros' && p.modo !== 'notas') return null;
  if (!esDificultad(p.dificultad)) return null;
  if (typeof p.pistas !== 'number' || !Number.isInteger(p.pistas)) return null;
  if (typeof p.tiempoMs !== 'number' || !Number.isFinite(p.tiempoMs) || p.tiempoMs < 0) {
    return null;
  }
  if (!Array.isArray(p.jugadas)) return null;
  const puzzle = p.puzzle;
  const solucion = p.solucion;
  if (puzzle.some((v, i) => v !== 0 && v !== solucion[i])) return null;

  return p as unknown as EstadoPartida;
}

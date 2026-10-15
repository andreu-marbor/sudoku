/* ============================================================
   generador.ts — Generación de puzzles con dificultad.
   Método: se rellena un tablero completo al azar y se vacían casillas
   por pares simétricos comprobando en cada paso que la solución sigue
   siendo ÚNICA (contarSoluciones(..., 2) === 1).
   ============================================================ */

import {
  contarSoluciones,
  crearTablero,
  esValida,
  TAMANO,
  VACIO,
  type Tablero,
} from './solver';

export type Dificultad = 'facil' | 'medio' | 'dificil';

/** RNG inyectable: por defecto Math.random; las pruebas usan crearRng(). */
export type Rng = () => number;

/** Rango de pistas (casillas dadas) por dificultad. */
export const RANGO_PISTAS: Record<Dificultad, readonly [number, number]> = {
  facil: [40, 46],
  medio: [33, 38],
  dificil: [26, 31],
};

export const DIFICULTADES: readonly Dificultad[] = ['facil', 'medio', 'dificil'];

export interface Puzzle {
  puzzle: Tablero; // casillas dadas (0 en el resto)
  solucion: Tablero; // solución única completa
  pistas: number; // casillas dadas
  dificultad: Dificultad;
}

/** RNG reproducible (mulberry32) para que las pruebas sean deterministas. */
export function crearRng(semilla: number): Rng {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function barajar<T>(elementos: readonly T[], rng: Rng): T[] {
  const copia = elementos.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Tablero completo y válido, rellenado con candidatos en orden aleatorio. */
export function generarSolucion(rng: Rng = Math.random): Tablero {
  const t = crearTablero();
  const candidatos = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  if (!rellenar(t, 0, candidatos, rng)) {
    throw new Error('No se pudo generar una solución (no debería ocurrir)');
  }
  return t;
}

function rellenar(t: Tablero, i: number, candidatos: readonly number[], rng: Rng): boolean {
  if (i === TAMANO * TAMANO) return true;
  for (const v of barajar(candidatos, rng)) {
    if (esValida(t, i, v)) {
      t[i] = v;
      if (rellenar(t, i + 1, candidatos, rng)) return true;
      t[i] = VACIO;
    }
  }
  return false;
}

/** Puzzle con solución única y nº de pistas dentro del rango de la dificultad. */
export function generarPuzzle(dificultad: Dificultad, rng: Rng = Math.random): Puzzle {
  const solucion = generarSolucion(rng);
  const puzzle = solucion.slice();
  const [min, max] = RANGO_PISTAS[dificultad];
  const objetivo = Math.round(min + rng() * (max - min));

  // Pares simétricos (i, 80-i): se vacían juntos para conservar la
  // simetría rotacional del tablero (el 40 es la casilla central).
  const pares: Array<readonly [number, number]> = [];
  for (let i = 0; i < (TAMANO * TAMANO - 1) / 2; i++) {
    pares.push([i, TAMANO * TAMANO - 1 - i]);
  }
  const orden = barajar(pares, rng);

  let pistas = TAMANO * TAMANO;
  for (const [a, b] of orden) {
    const nVaciar = a === b ? 1 : 2;
    if (pistas <= objetivo || pistas - nVaciar < min) break;

    puzzle[a] = VACIO;
    puzzle[b] = VACIO;
    if (contarSoluciones(puzzle, 2) === 1) {
      pistas -= nVaciar;
    } else {
      puzzle[a] = solucion[a];
      puzzle[b] = solucion[b];
    }
  }

  return { puzzle, solucion, pistas, dificultad };
}

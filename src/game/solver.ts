/* ============================================================
   solver.ts — Reglas del sudoku y solver backtracking.
   - esValida(): ¿puede el valor v ocupar la casilla i?
   - encontrarSolucion(): devuelve la solución o null.
   - contarSoluciones(): cuenta hasta `limite` soluciones; se usa
     con límite 2 para garantizar la unicidad de un puzzle.
   ============================================================ */

export type Tablero = number[]; // 81 casillas (0 = vacía), fila a fila

export const TAMANO = 9;
export const VACIO = 0;

export function casilla(fila: number, columna: number): number {
  return fila * TAMANO + columna;
}

export function filaDe(i: number): number {
  return Math.floor(i / TAMANO);
}

export function columnaDe(i: number): number {
  return i % TAMANO;
}

export function bloqueDe(i: number): number {
  return Math.floor(filaDe(i) / 3) * 3 + Math.floor(columnaDe(i) / 3);
}

export function crearTablero(): Tablero {
  return new Array<number>(TAMANO * TAMANO).fill(VACIO);
}

/** ¿Es lícito colocar `v` en la casilla `i`? (fila, columna y bloque sin `v`) */
export function esValida(t: Tablero, i: number, v: number): boolean {
  const f = filaDe(i);
  const c = columnaDe(i);
  const b = bloqueDe(i);
  for (let j = 0; j < TAMANO * TAMANO; j++) {
    if (j === i || t[j] !== v) continue;
    if (filaDe(j) === f || columnaDe(j) === c || bloqueDe(j) === b) return false;
  }
  return true;
}

/** Sin conflictos: todas las casillas ocupadas cumplen las reglas. */
export function sinConflictos(t: Tablero): boolean {
  for (let i = 0; i < t.length; i++) {
    if (t[i] !== VACIO && !esValida(t, i, t[i])) return false;
  }
  return true;
}

/** Tablero completo y sin conflictos → partida resuelta. */
export function estaResuelto(t: Tablero): boolean {
  return t.every((v) => v !== VACIO) && sinConflictos(t);
}

function casillaVacia(t: Tablero): number {
  for (let i = 0; i < t.length; i++) {
    if (t[i] === VACIO) return i;
  }
  return -1;
}

/** Primera solución encontrada (copia), o null si no existe. */
export function encontrarSolucion(t: Tablero): Tablero | null {
  if (!sinConflictos(t)) return null;
  const copia = t.slice();
  return resolver(copia) ? copia : null;
}

/** Cuenta soluciones hasta `limite` (por defecto 2: ¿es única?). */
export function contarSoluciones(t: Tablero, limite = 2): number {
  if (!sinConflictos(t)) return 0;
  return contar(t.slice(), limite);
}

function resolver(t: Tablero): boolean {
  const i = casillaVacia(t);
  if (i === -1) return true;
  for (let v = 1; v <= TAMANO; v++) {
    if (esValida(t, i, v)) {
      t[i] = v;
      if (resolver(t)) return true;
      t[i] = VACIO;
    }
  }
  return false;
}

function contar(t: Tablero, limite: number): number {
  const i = casillaVacia(t);
  if (i === -1) return 1;
  let total = 0;
  for (let v = 1; v <= TAMANO; v++) {
    if (esValida(t, i, v)) {
      t[i] = v;
      total += contar(t, limite - total);
      t[i] = VACIO;
      if (total >= limite) break;
    }
  }
  return total;
}

/* Pruebas de generación y solver (esbuild + node): npm.cmd run prueba.
   Deterministas: usan RNG con semilla fija. */

import {
  contarSoluciones,
  crearTablero,
  esValida,
  estaResuelto,
  encontrarSolucion,
  filaDe,
  columnaDe,
  bloqueDe,
  sinConflictos,
  TAMANO,
  type Tablero,
} from '../src/game/solver';
import {
  DIFICULTADES,
  generarPuzzle,
  generarSolucion,
  crearRng,
  RANGO_PISTAS,
} from '../src/game/generador';

let fallos = 0;
function comprobar(condicion: boolean, mensaje: string): void {
  if (condicion) {
    console.log(`  ✅ ${mensaje}`);
  } else {
    fallos++;
    console.error(`  ❌ ${mensaje}`);
  }
}

/** ¿Las 9 filas, 9 columnas y 9 bloques contienen cada uno el 1..9? */
function esSolucionCompleta(t: Tablero): boolean {
  const esperado = '1,2,3,4,5,6,7,8,9';
  const ordenado = (v: number[]) => v.slice().sort((a, b) => a - b).join(',');
  for (let f = 0; f < TAMANO; f++) {
    const fila = Array.from({ length: TAMANO }, (_, c) => t[f * TAMANO + c]);
    if (ordenado(fila) !== esperado) return false;
  }
  for (let c = 0; c < TAMANO; c++) {
    const col = Array.from({ length: TAMANO }, (_, f) => t[f * TAMANO + c]);
    if (ordenado(col) !== esperado) return false;
  }
  for (let b = 0; b < 9; b++) {
    const bloque = Array.from({ length: TAMANO }, (_, k) => {
      const f = Math.floor(b / 3) * 3 + Math.floor(k / 3);
      const c = (b % 3) * 3 + (k % 3);
      return t[f * TAMANO + c];
    });
    if (ordenado(bloque) !== esperado) return false;
  }
  return true;
}

// --- 1. Reglas ---
console.log('\nReglas:');
{
  const t = crearTablero();
  comprobar(esValida(t, 0, 7), 'admite un valor en tablero vacío');

  t[0] = 5;
  comprobar(!esValida(t, 0 + 3, 5), 'rechaza el mismo valor en su fila');
  comprobar(!esValida(t, 9, 5), 'rechaza el mismo valor en su columna');
  comprobar(!esValida(t, 10, 5), 'rechaza el mismo valor en su bloque');
  comprobar(esValida(t, 10, 6), 'admite otro valor en su bloque');

  t[10] = 5; // conflicto 0 (fila 0) vs 10 (bloque 0) → misma fila de bloque... asegurar conflicto real
  comprobar(!sinConflictos(t), 'detecta conflicto en el tablero');
}
{
  const t = crearTablero();
  t[0] = 5;
  t[80] = 5;
  comprobar(sinConflictos(t), 'valores lejanos no son conflicto');
}
{
  const t = crearTablero();
  comprobar(contarSoluciones(t, 2) === 2, 'el tablero vacío tiene más de una solución');
  comprobar(encontrarSolucion(t) !== null, 'el tablero vacío es resoluble');
}
{
  const t = crearTablero();
  t[0] = 5;
  t[1] = 5; // mismo bloque y fila
  comprobar(contarSoluciones(t, 2) === 0, 'tablero con conflicto no tiene soluciones válidas');
  comprobar(encontrarSolucion(t) === null, 'tablero con conflicto no es resoluble');
}
{
  const t = crearTablero();
  comprobar(!estaResuelto(t), 'tablero vacío no está resuelto');
}

// --- 2. Soluciones generadas ---
console.log('\nSoluciones generadas:');
for (let semilla = 1; semilla <= 5; semilla++) {
  const sol = generarSolucion(crearRng(semilla));
  comprobar(esSolucionCompleta(sol), `solución válida (semilla ${semilla})`);
  comprobar(estaResuelto(sol), `solución completa y sin conflictos (semilla ${semilla})`);
  comprobar(
    contarSoluciones(sol, 2) === 1,
    `solución completa tiene solución única (semilla ${semilla})`,
  );
}

// --- 3. Puzzles por dificultad ---
console.log('\nPuzzles generados:');
let semilla = 100;
for (const d of DIFICULTADES) {
  const [min, max] = RANGO_PISTAS[d];
  for (let intento = 1; intento <= 5; intento++) {
    semilla++;
    const { puzzle, solucion, pistas } = generarPuzzle(d, crearRng(semilla));
    const etq = `${d}, semilla ${semilla}`;

    comprobar(esSolucionCompleta(solucion), `solución válida — ${etq}`);
    comprobar(contarSoluciones(puzzle, 2) === 1, `solución única — ${etq}`);
    comprobar(
      pistas >= min && pistas <= max,
      `pistas ${pistas} dentro de [${min}, ${max}] — ${etq}`,
    );
    comprobar(
      puzzle.every((v, i) => v === 0 || v === solucion[i]),
      `el puzzle encaja con su solución — ${etq}`,
    );
    // Recalcular pistas coherente
    const recontadas = puzzle.filter((v) => v !== 0).length;
    comprobar(recontadas === pistas, `conteo de pistas coherente — ${etq}`);
    // La solución del solver sobre el puzzle coincide con la solución
    const resuelto = encontrarSolucion(puzzle);
    comprobar(
      resuelto !== null && resuelto.every((v, i) => v === solucion[i]),
      `el solver reproduce la solución — ${etq}`,
    );
  }
}

// --- Resultado ---
console.log('');
if (fallos === 0) {
  console.log('TODAS LAS PRUEBAS PASAN ✅');
} else {
  console.error(`${fallos} comprobaciones fallan ❌`);
  process.exit(1);
}

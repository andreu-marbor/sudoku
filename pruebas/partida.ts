/* Pruebas de la máquina de estados de la partida (esbuild + node):
   npm.cmd run prueba:partida. Deterministas: RNG con semilla fija. */

import { crearRng, generarPuzzle, generarSolucion } from '../src/game/generador';
import { candidatosDe, tieneCandidato } from '../src/game/notas';
import { filaDe, VACIO } from '../src/game/solver';
import {
  alternarModo,
  alternarNota,
  colocarNumero,
  crearPartida,
  deshacer,
  esError,
  esPista,
  estaCompletado,
  formatearTiempo,
  validarPartida,
  type EstadoPartida,
} from '../src/game/partida';

let fallos = 0;
function comprobar(condicion: boolean, mensaje: string): void {
  if (condicion) {
    console.log(`  ✅ ${mensaje}`);
  } else {
    fallos++;
    console.error(`  ❌ ${mensaje}`);
  }
}

function primeraVacia(e: EstadoPartida): number {
  for (let i = 0; i < 81; i++) {
    if (e.tablero[i] === VACIO) return i;
  }
  throw new Error('sin casillas vacías');
}

function primeraPista(e: EstadoPartida): number {
  for (let i = 0; i < 81; i++) {
    if (e.tablero[i] !== VACIO) return i;
  }
  throw new Error('sin pistas');
}

function parEnFila(e: EstadoPartida, i: number): number {
  for (let j = 0; j < 81; j++) {
    if (j !== i && e.tablero[j] === VACIO && filaDe(j) === filaDe(i)) return j;
  }
  throw new Error('sin compañero de fila vacío');
}

const { puzzle, solucion } = generarPuzzle('medio', crearRng(42));
const IDX_PISTA = puzzle.findIndex((v) => v !== VACIO);

// --- 1. Creación ---
console.log('\nCreación de partida:');
const e0 = crearPartida(puzzle, solucion, 'medio');
comprobar(e0.tablero.join() === puzzle.join(), 'el tablero empieza igual al puzzle');
comprobar(e0.notas.every((n) => n === 0), 'sin notas al empezar');
comprobar(e0.pistas === puzzle.filter((v) => v !== VACIO).length, 'conteo de pistas correcto');
comprobar(!estaCompletado(e0), 'no empieza completado');
comprobar(esPista(e0, primeraPista(e0)), 'las casillas dadas son pistas');
comprobar(e0.jugadas.length === 0, 'sin jugadas al empezar');

// --- 2. Escritura ---
console.log('\nEscritura de números:');
{
  const e = crearPartida(puzzle, solucion, 'medio');
  const c1 = primeraVacia(e);
  const v = solucion[c1];

  comprobar(colocarNumero(e, c1, v), 'escribe en una casilla vacía');
  comprobar(e.tablero[c1] === v, 'el valor queda escrito');
  comprobar(!colocarNumero(e, c1, v), 'repetir el mismo valor no es un movimiento');
  comprobar(!colocarNumero(e, IDX_PISTA, 1), 'no se puede escribir sobre una pista');
}

// --- 3. Limpieza de candidatos al escribir ---
console.log('\nLimpieza de candidatos:');
{
  const e = crearPartida(puzzle, solucion, 'medio');
  const c1 = primeraVacia(e);
  const v = solucion[c1];
  const par = parEnFila(e, c1);

  comprobar(alternarNota(e, par, v), 'anota el candidato v en el compañero de fila');
  comprobar(alternarNota(e, c1, 5), 'anota otro candidato en la casilla');
  const jugadasPrevias = e.jugadas.length;

  comprobar(colocarNumero(e, c1, v), 'reescribe la casilla con el valor v');
  comprobar(!tieneCandidato(e.notas, c1, 5), 'las notas propias se limpian al escribir');
  comprobar(!tieneCandidato(e.notas, par, v), 'el candidato v se limpia del compañero de fila');
  comprobar(e.jugadas.length === jugadasPrevias + 1, 'la escritura queda registrada para deshacer');
}

// --- 4. Deshacer ---
console.log('\nDeshacer:');
{
  const e = crearPartida(puzzle, solucion, 'medio');
  const c1 = primeraVacia(e);
  const v = solucion[c1];
  const par = parEnFila(e, c1);
  alternarNota(e, par, v);
  alternarNota(e, c1, 5);
  colocarNumero(e, c1, v);

  comprobar(deshacer(e), 'deshace la escritura');
  comprobar(e.tablero[c1] === VACIO, 'la casilla vuelve a quedar vacía');
  comprobar(tieneCandidato(e.notas, c1, 5), 'restaura las propias notas');
  comprobar(tieneCandidato(e.notas, par, v), 'restaura las notas del compañero de fila');

  comprobar(deshacer(e), 'deshace la nota de la casilla');
  comprobar(!tieneCandidato(e.notas, c1, 5), 'la nota de la casilla se revierte');

  comprobar(deshacer(e), 'deshace la nota del compañero');
  comprobar(!tieneCandidato(e.notas, par, v), 'la nota del compañero se revierte');
  comprobar(!deshacer(e), 'con la pila vacía no hay nada que deshacer');
}

// --- 5. Notas ---
console.log('\nNotas:');
{
  const e = crearPartida(puzzle, solucion, 'medio');
  const c = primeraVacia(e);

  comprobar(alternarNota(e, c, 7), 'alterna un candidato');
  comprobar(tieneCandidato(e.notas, c, 7), 'el candidato queda activo');
  comprobar(alternarNota(e, c, 7), 'alterna de nuevo');
  comprobar(!tieneCandidato(e.notas, c, 7), 'el candidato se apaga');
  comprobar(candidatosDe(e.notas, c).length === 0, 'sin candidatos tras apagar');

  colocarNumero(e, c, solucion[c]);
  comprobar(!alternarNota(e, c, 9), 'no anota sobre una casilla con número');
  comprobar(!alternarNota(e, primeraPista(e), 7), 'no anota sobre una pista');
}

// --- 6. Modo, errores y Victoria ---
console.log('\nModo, errores y Victoria:');
{
  const e = crearPartida(puzzle, solucion, 'medio');
  const c = primeraVacia(e);
  const correcto = solucion[c];
  const incorrecto = correcto === 9 ? 8 : correcto + 1;

  colocarNumero(e, c, incorrecto);
  comprobar(esError(e, c), 'marca como error un valor incorrecto');
  colocarNumero(e, c, correcto);
  comprobar(!esError(e, c), 'un valor correcto no es error');
  comprobar(!esError(e, primeraPista(e)), 'una pista nunca es error');

  const modoPrevio = e.modo;
  alternarModo(e);
  comprobar(e.modo !== modoPrevio, 'el modo alterna entre números y notas');
  alternarModo(e);
  comprobar(e.modo === modoPrevio, 'dos alternancias vuelven al modo inicial');
}
{
  const sol = generarSolucion(crearRng(7));
  const casi = sol.slice();
  const hueco = 40;
  casi[hueco] = VACIO;
  const p = crearPartida(casi, sol, 'dificil');
  comprobar(!estaCompletado(p), 'una partida casi llena sigue incompleta');
  comprobar(colocarNumero(p, hueco, sol[hueco]), 'escribe la última casilla');
  comprobar(estaCompletado(p), 'la partida queda completada');
}

// --- 7. Tiempo y validación ---
console.log('\nTiempo y validación:');
comprobar(formatearTiempo(0) === '00:00', 'formatea 0 ms');
comprobar(formatearTiempo(65_000) === '01:05', 'formatea 65 s');
comprobar(formatearTiempo(3_599_000) === '59:59', 'formatea 59:59');

{
  const objeto: unknown = JSON.parse(JSON.stringify(e0));
  comprobar(validarPartida(objeto) !== null, 'acepta una partida serializada');
  comprobar(validarPartida('tocho') === null, 'rechaza basura');
  comprobar(validarPartida(null) === null, 'rechaza null');

  const base = (): Record<string, unknown> => JSON.parse(JSON.stringify(objeto)) as Record<string, unknown>;
  comprobar(validarPartida({ ...base(), tablero: [] }) === null, 'rechaza un tablero vacío');
  comprobar(validarPartida({ ...base(), modo: 'quantum' }) === null, 'rechaza un modo desconocido');
  comprobar(
    validarPartida({ ...base(), dificultad: 'imposible' }) === null,
    'rechaza una dificultad desconocida',
  );
  comprobar(validarPartida({ ...base(), notas: [] }) === null, 'rechaza notas corruptas');
  comprobar(validarPartida({ ...base(), tiempoMs: -5 }) === null, 'rechaza un tiempo negativo');
}

// --- Resultado ---
console.log('');
if (fallos === 0) {
  console.log('TODAS LAS PRUEBAS PASAN ✅');
} else {
  console.error(`${fallos} comprobaciones fallan ❌`);
  process.exit(1);
}

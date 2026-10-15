/* Pruebas de i18n (esbuild + node): npm.cmd run prueba:i18n.
   Paridad de claves entre los 3 JSON, textos no vacíos, mismos
   placeholders y traducciones concretas de comprobación. */

import es from '../src/i18n/es.json';
import ca from '../src/i18n/ca.json';
import en from '../src/i18n/en.json';
import { CODIGOS, NOMBRES, setLang, t, type Idioma } from '../src/i18n/index';

let fallos = 0;
function comprobar(condicion: boolean, mensaje: string): void {
  if (condicion) {
    console.log(`  ✅ ${mensaje}`);
  } else {
    fallos++;
    console.error(`  ❌ ${mensaje}`);
  }
}

const RECURSOS: Record<Idioma, Record<string, string>> = { es, ca, en };
const claves = (r: Record<string, string>): string[] => Object.keys(r).sort();

// --- 1. Paridad de claves ---
console.log('\nParidad de claves:');
comprobar(claves(es).length === claves(ca).length, 'es y ca tienen el mismo nº de claves');
comprobar(claves(es).length === claves(en).length, 'es y en tienen el mismo nº de claves');
comprobar(claves(es).join('|') === claves(ca).join('|'), 'las claves de es y ca coinciden');
comprobar(claves(es).join('|') === claves(en).join('|'), 'las claves de es y en coinciden');
comprobar(claves(es).length >= 20, `hay un número razonable de claves (${claves(es).length})`);

// --- 2. Textos y placeholders ---
console.log('\nTextos y placeholders:');
for (const [id, recurso] of Object.entries(RECURSOS)) {
  const vacias = Object.entries(recurso)
    .filter(([, v]) => v.trim() === '')
    .map(([k]) => k);
  comprobar(vacias.length === 0, `${id}: sin textos vacíos`);
}
const placeholders = (texto: string): string[] =>
  (texto.match(/\{[a-zA-Z]+\}/g) ?? []).sort();
for (const clave of claves(es)) {
  const pEs = placeholders(es[clave]).join(',');
  const pCa = placeholders(ca[clave]).join(',');
  const pEn = placeholders(en[clave]).join(',');
  comprobar(pEs === pCa && pEs === pEn, `placeholders coherentes en «${clave}»`);
}

// --- 3. Claves críticas ---
console.log('\nClaves críticas:');
const criticas = [
  'app.title',
  'menu.continue',
  'menu.choose',
  'menu.best',
  'game.cell',
  'game.notes',
  'result.title',
  'result.record',
  'lang.label',
];
for (const clave of criticas) {
  comprobar(clave in es, `existe «${clave}»`);
}

// --- 4. Traducciones concretas ---
console.log('\nTraducciones:');
setLang('es');
comprobar(t('menu.choose') === 'Elige la dificultad', 'es: menu.choose');
comprobar(t('menu.best', { tiempo: '05:32' }) === 'Mejor: 05:32', 'es: parámetro {tiempo}');
setLang('ca');
comprobar(t('menu.choose') === 'Tria la dificultat', 'ca: menu.choose');
comprobar(t('app.title') === 'Sudoku', 'ca: app.title');
setLang('en');
comprobar(t('game.undo') === 'Undo', 'en: game.undo');
comprobar(t('game.cell', { fila: 3, columna: 9 }) === 'Cell row 3, column 9', 'en: celda 3,9');
comprobar(CODIGOS.ca === 'VA', 'el código visible del valenciano es VA');
comprobar(NOMBRES.ca === 'Valencià', 'el nombre del valenciano es Valencià');
comprobar(t('clave.inexistente') === 'clave.inexistente', 'clave inexistente devuelve la clave');
setLang('es');

// --- Resultado ---
console.log('');
if (fallos === 0) {
  console.log('TODAS LAS PRUEBAS PASAN ✅');
} else {
  console.error(`${fallos} comprobaciones fallan ❌`);
  process.exit(1);
}

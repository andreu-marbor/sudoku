/* game — tablero 9×9 y partida.
   Fase 1: generar puzzle, escribir/borrar números, marcar errores y
   detectar la victoria. Notas, deshacer y cronómetro llegan en la Fase 2. */

import { generarPuzzle } from '../game/generador';
import { filaDe, columnaDe, VACIO } from '../game/solver';
import { crearTeclado } from './teclado';
import { ETIQUETAS_DIFICULTAD, type OpcionesPartida } from './menu';

export function mostrarJuego(
  raiz: HTMLElement,
  opciones: OpcionesPartida,
  irAMenu: () => void,
): void {
  const { puzzle, solucion, dificultad, pistas } = generarPuzzle(opciones.dificultad);
  const tablero = puzzle.slice();
  let seleccion = -1;
  let completado = false;

  raiz.innerHTML = `
    <main class="partida">
      <header class="cabecera">
        <button type="button" class="boton-icono" id="volver" aria-label="Volver al menú">←</button>
        <span class="cabecera-dato">
          <strong>${ETIQUETAS_DIFICULTAD[dificultad]}</strong>
          <span class="cabecera-secundario">${pistas} pistas</span>
        </span>
        <span class="cabecera-derecha" aria-hidden="true"></span>
      </header>

      <div class="tablero" role="group" aria-label="Tablero de sudoku"></div>
      <div class="teclado-contenedor" aria-label="Teclado numérico"></div>

      <div class="superposicion" hidden>
        <div class="tarjeta" role="dialog" aria-modal="true" aria-labelledby="titulo-victoria">
          <h2 id="titulo-victoria">¡Completado! 🎉</h2>
          <div class="tarjeta-acciones">
            <button type="button" class="boton primario" id="otra">Otra partida</button>
            <button type="button" class="boton" id="al-menu">Menú</button>
          </div>
        </div>
      </div>
    </main>
  `;

  // --- Construcción del tablero (81 casillas) ---
  const tableroEl = raiz.querySelector<HTMLElement>('.tablero')!;
  const celdas: HTMLButtonElement[] = [];

  for (let i = 0; i < puzzle.length; i++) {
    const celda = document.createElement('button');
    celda.type = 'button';
    celda.className = 'celda';
    if (columnaDe(i) % 3 === 2 && columnaDe(i) !== 8) celda.classList.add('corte-dcho');
    if (filaDe(i) % 3 === 2 && filaDe(i) !== 8) celda.classList.add('corte-abajo');
    celda.addEventListener('click', () => {
      if (completado) return;
      seleccion = i;
      pintar();
    });
    tableroEl.appendChild(celda);
    celdas.push(celda);
  }

  // --- Pintado completo del estado ---
  function pintar(): void {
    for (let i = 0; i < tablero.length; i++) {
      const v = tablero[i];
      const esPista = puzzle[i] !== VACIO;
      const celda = celdas[i];
      celda.textContent = v === VACIO ? '' : String(v);
      celda.classList.toggle('pista', esPista);
      celda.classList.toggle('jugador', !esPista && v !== VACIO);
      celda.classList.toggle('error', !esPista && v !== VACIO && v !== solucion[i]);
      celda.classList.toggle('seleccionada', i === seleccion);

      const ubicacion = `Casilla fila ${filaDe(i) + 1}, columna ${columnaDe(i) + 1}`;
      celda.setAttribute(
        'aria-label',
        v === VACIO ? `${ubicacion}, vacía` : `${ubicacion}, ${v}${esPista ? ' (pista)' : ''}`,
      );
    }
  }

  // --- Escritura / borrado ---
  function colocar(valor: number): void {
    if (completado || seleccion < 0) return;
    if (puzzle[seleccion] !== VACIO) return; // las pistas no se tocan
    tablero[seleccion] = valor;
    pintar();

    if (valor !== VACIO && tablero.every((v, i) => v === solucion[i])) {
      completado = true;
      mostrarVictoria();
    }
  }

  function mostrarVictoria(): void {
    const capa = raiz.querySelector<HTMLElement>('.superposicion')!;
    capa.hidden = false;
    capa.querySelector<HTMLButtonElement>('#otra')!.focus();
  }

  // --- Conexiones ---
  crearTeclado(raiz.querySelector<HTMLElement>('.teclado-contenedor')!, colocar);

  raiz.querySelector<HTMLButtonElement>('#volver')!.addEventListener('click', irAMenu);
  raiz
    .querySelector<HTMLButtonElement>('#otra')!
    .addEventListener('click', () => mostrarJuego(raiz, opciones, irAMenu));
  raiz.querySelector<HTMLButtonElement>('#al-menu')!.addEventListener('click', irAMenu);

  pintar();
}

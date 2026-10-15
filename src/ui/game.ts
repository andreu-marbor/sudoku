/* game — partida: tablero 9×9, teclado, notas (modo lápiz), deshacer,
   cronómetro con pausa y comprobación de errores.
   El estado vive en EstadoPartida (game/partida.ts); aquí solo se pinta
   y se traducen gestos en llamadas a esa lógica. */

import { filaDe, columnaDe, VACIO } from '../game/solver';
import {
  alternarModo,
  alternarNota,
  colocarNumero,
  deshacer,
  esError,
  esPista,
  estaCompletado,
  formatearTiempo,
  type EstadoPartida,
} from '../game/partida';
import { candidatosDe, tieneCandidato, tieneNotas } from '../game/notas';
import { crearCronometro } from '../game/cronometro';
import { crearTeclado } from './teclado';
import { ETIQUETAS_DIFICULTAD } from './menu';

export interface AccionesJuego {
  irAMenu: () => void;
  onOtra: () => void;
  alGuardar: (p: EstadoPartida) => void;
  alCompletar: (p: EstadoPartida) => boolean; // true → nuevo récord
  erroresAutomaticos: boolean; // ajuste del menú
}

/** Devuelve una función de limpieza (listeners globales + cronómetro). */
export function mostrarJuego(
  raiz: HTMLElement,
  partida: EstadoPartida,
  acc: AccionesJuego,
): () => void {
  let seleccion = -1;
  let verificando = false; // resultado del botón "comprobar"
  let completado = false;
  let pausadoPorOcultar = false;

  raiz.innerHTML = `
    <main class="partida">
      <header class="cabecera">
        <button type="button" class="boton-icono" id="volver" aria-label="Volver al menú">←</button>
        <span class="cabecera-dato">
          <strong>${ETIQUETAS_DIFICULTAD[partida.dificultad]}</strong>
          <span class="cabecera-secundario" id="tiempo">${formatearTiempo(partida.tiempoMs)}</span>
        </span>
        <span class="cabecera-botones">
          <button type="button" class="boton-icono" id="deshacer" aria-label="Deshacer">↩</button>
          <button type="button" class="boton-icono" id="modo" aria-label="Modo de escritura">✏️</button>
          <button type="button" class="boton-icono" id="comprobar" aria-label="Comprobar errores">✓</button>
        </span>
      </header>

      <div class="tablero" role="group" aria-label="Tablero de sudoku"></div>
      <div class="teclado-contenedor teclado" aria-label="Teclado numérico"></div>

      <div class="superposicion" hidden>
        <div class="tarjeta" role="dialog" aria-modal="true" aria-labelledby="titulo-victoria">
          <h2 id="titulo-victoria">¡Completado! 🎉</h2>
          <p class="tarjeta-tiempo" id="tiempo-final"></p>
          <p class="tarjeta-nota" id="nota-final"></p>
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

  for (let i = 0; i < partida.tablero.length; i++) {
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

  const contTeclado = raiz.querySelector<HTMLElement>('.teclado-contenedor')!;
  const etiquetaTiempo = raiz.querySelector<HTMLElement>('#tiempo')!;
  const botonModo = raiz.querySelector<HTMLButtonElement>('#modo')!;

  // --- Cronómetro (sigue el tiempo en partida.tiempoMs) ---
  const cronometro = crearCronometro((ms) => {
    partida.tiempoMs = ms;
    etiquetaTiempo.textContent = formatearTiempo(ms);
  });

  // --- Pintado completo del estado ---
  function pintar(): void {
    const mostrarErrores = acc.erroresAutomaticos || verificando;

    for (let i = 0; i < partida.tablero.length; i++) {
      const v = partida.tablero[i];
      const pista = esPista(partida, i);
      const celda = celdas[i];
      const hayNotas = v === VACIO && tieneNotas(partida.notas, i);

      celda.classList.toggle('pista', pista);
      celda.classList.toggle('jugador', !pista && v !== VACIO);
      celda.classList.toggle('error', mostrarErrores && !pista && esError(partida, i));
      celda.classList.toggle('seleccionada', i === seleccion);
      celda.classList.toggle('con-notas', hayNotas);

      if (v !== VACIO) {
        celda.textContent = String(v);
      } else if (hayNotas) {
        celda.innerHTML = Array.from({ length: 9 }, (_, k) => k + 1)
          .map(
            (n) =>
              `<span class="nota${tieneCandidato(partida.notas, i, n) ? '' : ' ausente'}">${n}</span>`,
          )
          .join('');
      } else {
        celda.textContent = '';
      }

      const ubicacion = `Casilla fila ${filaDe(i) + 1}, columna ${columnaDe(i) + 1}`;
      let etiqueta: string;
      if (v !== VACIO) {
        etiqueta = `${ubicacion}, ${v}${pista ? ' (pista)' : ''}`;
      } else if (hayNotas) {
        etiqueta = `${ubicacion}, notas ${candidatosDe(partida.notas, i).join(' ')}`;
      } else {
        etiqueta = `${ubicacion}, vacía`;
      }
      celda.setAttribute('aria-label', etiqueta);
    }

    contTeclado.classList.toggle('modo-notas', partida.modo === 'notas');
    botonModo.textContent = partida.modo === 'notas' ? '🔢' : '✏️';
  }

  // --- Persistencia (nunca al final: la partida completada se borra) ---
  function guardar(): void {
    if (!completado) acc.alGuardar(partida);
  }

  // --- Escritura / borrado ---
  function tecla(valor: number): void {
    if (completado || seleccion < 0) return;
    const ok =
      partida.modo === 'notas' && valor !== VACIO
        ? alternarNota(partida, seleccion, valor)
        : colocarNumero(partida, seleccion, valor);
    if (!ok) return;
    pintar();
    guardar();
    if (estaCompletado(partida)) {
      completado = true;
      cronometro.pausar();
      const record = acc.alCompletar(partida);
      mostrarVictoria(record);
    }
  }

  function mostrarVictoria(record: boolean): void {
    const capa = raiz.querySelector<HTMLElement>('.superposicion')!;
    capa.querySelector<HTMLElement>('#tiempo-final')!.textContent =
      `Tiempo: ${formatearTiempo(partida.tiempoMs)}`;
    capa.querySelector<HTMLElement>('#nota-final')!.textContent = record ? '¡Nuevo récord! 🏆' : '';
    capa.hidden = false;
    capa.querySelector<HTMLButtonElement>('#otra')!.focus();
  }

  // --- Conexiones ---
  crearTeclado(contTeclado, tecla);

  raiz.querySelector<HTMLButtonElement>('#volver')!.addEventListener('click', () => {
    guardar();
    acc.irAMenu();
  });
  raiz.querySelector<HTMLButtonElement>('#deshacer')!.addEventListener('click', () => {
    if (completado) return;
    if (deshacer(partida)) {
      pintar();
      guardar();
    }
  });
  botonModo.addEventListener('click', () => {
    if (completado) return;
    alternarModo(partida);
    pintar();
  });
  raiz.querySelector<HTMLButtonElement>('#comprobar')!.addEventListener('click', () => {
    if (completado) return;
    verificando = true;
    pintar();
  });
  raiz.querySelector<HTMLButtonElement>('#otra')!.addEventListener('click', acc.onOtra);
  raiz.querySelector<HTMLButtonElement>('#al-menu')!.addEventListener('click', () => {
    guardar();
    acc.irAMenu();
  });

  // --- Pausa automática al pasar a segundo plano + guardado al salir ---
  function alOcultar(): void {
    if (document.hidden) {
      if (cronometro.corriendo() && !completado) {
        pausadoPorOcultar = true;
        cronometro.pausar();
      }
      guardar();
    } else if (pausadoPorOcultar) {
      pausadoPorOcultar = false;
      cronometro.iniciar();
    }
  }

  function alSalir(): void {
    guardar();
    cronometro.destruir();
  }

  document.addEventListener('visibilitychange', alOcultar);
  window.addEventListener('pagehide', alSalir);

  pintar();
  cronometro.reiniciar(partida.tiempoMs, true);

  return () => {
    document.removeEventListener('visibilitychange', alOcultar);
    window.removeEventListener('pagehide', alSalir);
    cronometro.destruir();
  };
}

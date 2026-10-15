/* game — partida: tablero 9×9, teclado, notas (modo lápiz), deshacer,
   cronómetro con pausa y comprobación de errores.
   El estado vive en EstadoPartida (game/partida.ts); aquí solo se pinta
   y se traducen gestos en llamadas a esa lógica. Al cambiar de idioma se
   repintan los textos SIN perder la partida. */

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
import { onCambioIdioma, t } from '../i18n';
import { crearTeclado } from './teclado';
import { CLAVES_DIFICULTAD } from './menu';
import { crearSelectorIdioma } from './lang';

export interface AccionesJuego {
  irAMenu: () => void;
  onOtra: () => void;
  alGuardar: (p: EstadoPartida) => void;
  alCompletar: (p: EstadoPartida) => boolean; // true → nuevo récord
  erroresAutomaticos: boolean; // ajuste del menú
}

/** Devuelve una función de limpieza (listeners + cronómetro + i18n). */
export function mostrarJuego(
  raiz: HTMLElement,
  partida: EstadoPartida,
  acc: AccionesJuego,
): () => void {
  let seleccion = -1;
  let verificando = false; // resultado del botón "comprobar"
  let completado = false;
  let fueRecord = false;
  let pausadoPorOcultar = false;

  raiz.innerHTML = `
    <main class="partida">
      <header class="cabecera">
        <button type="button" class="boton-icono" id="volver" aria-label="${t('game.back')}">←</button>
        <span class="cabecera-dato">
          <strong id="dificultad">${t(CLAVES_DIFICULTAD[partida.dificultad])}</strong>
          <span class="cabecera-secundario" id="tiempo">${formatearTiempo(partida.tiempoMs)}</span>
        </span>
        <span class="cabecera-botones">
          <button type="button" class="boton-icono" id="deshacer" aria-label="${t('game.undo')}">↩</button>
          <button type="button" class="boton-icono" id="modo" aria-label="${t('game.modeNumbers')}">✏️</button>
          <button type="button" class="boton-icono" id="comprobar" aria-label="${t('game.check')}">✓</button>
        </span>
      </header>

      <div class="tablero" role="group" aria-label="${t('game.board')}"></div>
      <div class="teclado-contenedor teclado" aria-label="${t('game.keypad')}"></div>
      <div class="fila-idioma"></div>

      <div class="superposicion" hidden>
        <div class="tarjeta" role="dialog" aria-modal="true" aria-labelledby="titulo-victoria">
          <h2 id="titulo-victoria">${t('result.title')}</h2>
          <p class="tarjeta-tiempo" id="tiempo-final"></p>
          <p class="tarjeta-nota" id="nota-final"></p>
          <div class="tarjeta-acciones">
            <button type="button" class="boton primario" id="otra">${t('result.again')}</button>
            <button type="button" class="boton" id="al-menu">${t('result.menu')}</button>
          </div>
        </div>
      </div>
    </main>
  `;

  // --- Referencias ---
  const tableroEl = raiz.querySelector<HTMLElement>('.tablero')!;
  const contTeclado = raiz.querySelector<HTMLElement>('.teclado-contenedor')!;
  const etiquetaTiempo = raiz.querySelector<HTMLElement>('#tiempo')!;
  const etiquetaDificultad = raiz.querySelector<HTMLElement>('#dificultad')!;
  const botonVolver = raiz.querySelector<HTMLButtonElement>('#volver')!;
  const botonDeshacer = raiz.querySelector<HTMLButtonElement>('#deshacer')!;
  const botonModo = raiz.querySelector<HTMLButtonElement>('#modo')!;
  const botonComprobar = raiz.querySelector<HTMLButtonElement>('#comprobar')!;
  const capaVictoria = raiz.querySelector<HTMLElement>('.superposicion')!;

  // --- Construcción del tablero (81 casillas) ---
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

  // --- Cronómetro (sigue el tiempo en partida.tiempoMs) ---
  const cronometro = crearCronometro((ms) => {
    partida.tiempoMs = ms;
    etiquetaTiempo.textContent = formatearTiempo(ms);
  });

  // --- Pintado del estado (casillas, modo y errores) ---
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

      const ubicacion = t('game.cell', { fila: filaDe(i) + 1, columna: columnaDe(i) + 1 });
      let etiqueta: string;
      if (v !== VACIO) {
        etiqueta = `${ubicacion}, ${v} ${pista ? t('game.given') : ''}`.trim();
      } else if (hayNotas) {
        etiqueta = `${ubicacion}, ${t('game.notes', { valores: candidatosDe(partida.notas, i).join(' ') })}`;
      } else {
        etiqueta = `${ubicacion}, ${t('game.empty')}`;
      }
      celda.setAttribute('aria-label', etiqueta);
    }

    contTeclado.classList.toggle('modo-notas', partida.modo === 'notas');
    botonModo.textContent = partida.modo === 'notas' ? '🔢' : '✏️';
    botonModo.setAttribute(
      'aria-label',
      partida.modo === 'notas' ? t('game.modeNotes') : t('game.modeNumbers'),
    );
  }

  /** Repinta solo los textos (no toca el estado de la partida). */
  function repintarTextos(): void {
    etiquetaDificultad.textContent = t(CLAVES_DIFICULTAD[partida.dificultad]);
    botonVolver.setAttribute('aria-label', t('game.back'));
    botonDeshacer.setAttribute('aria-label', t('game.undo'));
    botonComprobar.setAttribute('aria-label', t('game.check'));
    tableroEl.setAttribute('aria-label', t('game.board'));
    contTeclado.setAttribute('aria-label', t('game.keypad'));
    if (!capaVictoria.hidden) {
      capaVictoria.querySelector<HTMLElement>('#titulo-victoria')!.textContent = t('result.title');
      capaVictoria.querySelector<HTMLElement>('#tiempo-final')!.textContent = t('result.time', {
        tiempo: formatearTiempo(partida.tiempoMs),
      });
      capaVictoria.querySelector<HTMLElement>('#nota-final')!.textContent = fueRecord
        ? t('result.record')
        : '';
      capaVictoria.querySelector<HTMLButtonElement>('#otra')!.textContent = t('result.again');
      capaVictoria.querySelector<HTMLButtonElement>('#al-menu')!.textContent = t('result.menu');
    }
    crearSelectorIdioma(raiz.querySelector<HTMLElement>('.fila-idioma')!);
    pintar();
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
      fueRecord = acc.alCompletar(partida);
      mostrarVictoria();
    }
  }

  function mostrarVictoria(): void {
    capaVictoria.querySelector<HTMLElement>('#tiempo-final')!.textContent = t('result.time', {
      tiempo: formatearTiempo(partida.tiempoMs),
    });
    capaVictoria.querySelector<HTMLElement>('#nota-final')!.textContent = fueRecord
      ? t('result.record')
      : '';
    capaVictoria.hidden = false;
    capaVictoria.querySelector<HTMLButtonElement>('#otra')!.focus();
  }

  // --- Conexiones ---
  crearTeclado(contTeclado, tecla);

  botonVolver.addEventListener('click', () => {
    guardar();
    acc.irAMenu();
  });
  botonDeshacer.addEventListener('click', () => {
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
  botonComprobar.addEventListener('click', () => {
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

  const desuscribirIdioma = onCambioIdioma(repintarTextos);
  document.addEventListener('visibilitychange', alOcultar);
  window.addEventListener('pagehide', alSalir);

  pintar();
  crearSelectorIdioma(raiz.querySelector<HTMLElement>('.fila-idioma')!);
  cronometro.reiniciar(partida.tiempoMs, true);

  return () => {
    desuscribirIdioma();
    document.removeEventListener('visibilitychange', alOcultar);
    window.removeEventListener('pagehide', alSalir);
    cronometro.destruir();
  };
}

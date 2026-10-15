/* menú — pantalla inicial: continuar partida guardada o elegir dificultad.
   Muestra los mejores tiempos por dificultad y el ajuste de errores.
   Los textos son provisionales: pasan por t() en la Fase 3 (i18n). */

import { DIFICULTADES, type Dificultad } from '../game/generador';
import { formatearTiempo } from '../game/partida';

export interface OpcionesPartida {
  dificultad: Dificultad;
}

export const ETIQUETAS_DIFICULTAD: Record<Dificultad, string> = {
  facil: 'Fácil',
  medio: 'Medio',
  dificil: 'Difícil',
};

export interface ReferenciaMenu {
  hayPartidaGuardada: boolean;
  mejoresTiempos: Partial<Record<Dificultad, number>>;
  erroresAutomaticos: boolean;
}

export interface AccionesMenu {
  onJugar: (opciones: OpcionesPartida) => void;
  onContinuar: () => void;
  onCambiarErrores: (activo: boolean) => void;
}

export function mostrarMenu(raiz: HTMLElement, ref: ReferenciaMenu, acc: AccionesMenu): void {
  raiz.innerHTML = `
    <main class="inicio">
      <h1 class="titulo">Sudoku</h1>
      ${
        ref.hayPartidaGuardada
          ? `<button type="button" class="boton primario grande" id="continuar">Continuar partida</button>`
          : ''
      }
      <p class="lema">Elige la dificultad</p>
      <div class="dificultades">
        ${DIFICULTADES.map((d) => {
          const mejor = ref.mejoresTiempos[d];
          return `
          <div class="dificultad">
            <button type="button" class="boton" data-dificultad="${d}">
              ${ETIQUETAS_DIFICULTAD[d]}
            </button>
            ${mejor !== undefined ? `<span class="mejor">Mejor: ${formatearTiempo(mejor)}</span>` : ''}
          </div>`;
        }).join('')}
      </div>
      <label class="ajuste">
        <input type="checkbox" id="errores" ${ref.erroresAutomaticos ? 'checked' : ''}>
        Marcar errores automáticamente
      </label>
    </main>
  `;

  const botonContinuar = raiz.querySelector<HTMLButtonElement>('#continuar');
  if (botonContinuar) botonContinuar.addEventListener('click', acc.onContinuar);

  raiz.querySelectorAll<HTMLButtonElement>('[data-dificultad]').forEach((boton) => {
    boton.addEventListener('click', () => {
      acc.onJugar({ dificultad: boton.dataset.dificultad as Dificultad });
    });
  });

  raiz.querySelector<HTMLInputElement>('#errores')!.addEventListener('change', (evento) => {
    acc.onCambiarErrores((evento.target as HTMLInputElement).checked);
  });
}

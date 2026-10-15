/* menú — pantalla inicial: elegir dificultad y empezar partida.
   Los textos son provisionales: pasan por t() en la Fase 3 (i18n). */

import { DIFICULTADES, type Dificultad } from '../game/generador';

export interface OpcionesPartida {
  dificultad: Dificultad;
}

export const ETIQUETAS_DIFICULTAD: Record<Dificultad, string> = {
  facil: 'Fácil',
  medio: 'Medio',
  dificil: 'Difícil',
};

export function mostrarMenu(
  raiz: HTMLElement,
  onJugar: (opciones: OpcionesPartida) => void,
): void {
  raiz.innerHTML = `
    <main class="inicio">
      <h1 class="titulo">Sudoku</h1>
      <p class="lema">Elige la dificultad</p>
      <div class="dificultades">
        ${DIFICULTADES.map(
          (d) => `
          <button type="button" class="boton" data-dificultad="${d}">
            ${ETIQUETAS_DIFICULTAD[d]}
          </button>`,
        ).join('')}
      </div>
    </main>
  `;

  raiz.querySelectorAll<HTMLButtonElement>('[data-dificultad]').forEach((boton) => {
    boton.addEventListener('click', () => {
      onJugar({ dificultad: boton.dataset.dificultad as Dificultad });
    });
  });
}

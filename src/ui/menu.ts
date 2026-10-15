/* menú — pantalla inicial: continuar partida guardada o elegir dificultad.
   Muestra los mejores tiempos por dificultad, el ajuste de errores y el
   selector de idioma. Se repinta entero al cambiar de idioma. */

import { DIFICULTADES, type Dificultad } from '../game/generador';
import { formatearTiempo } from '../game/partida';
import { crearBotonSonido } from '../efectos';
import { onCambioIdioma, t } from '../i18n';
import { crearSelectorIdioma } from './lang';

export interface OpcionesPartida {
  dificultad: Dificultad;
}

export const CLAVES_DIFICULTAD: Record<Dificultad, string> = {
  facil: 'menu.easy',
  medio: 'menu.medium',
  dificil: 'menu.hard',
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

/** Devuelve la baja de la suscripción al cambio de idioma. */
export function mostrarMenu(
  raiz: HTMLElement,
  ref: ReferenciaMenu,
  acc: AccionesMenu,
): () => void {
  const desuscribir = onCambioIdioma(pintar);
  pintar();
  return desuscribir;

  function pintar(): void {
    raiz.innerHTML = `
      <main class="inicio">
        <h1 class="titulo">${t('app.title')}</h1>
        ${
          ref.hayPartidaGuardada
            ? `<button type="button" class="boton primario grande" id="continuar">${t('menu.continue')}</button>`
            : ''
        }
        <p class="lema">${t('menu.choose')}</p>
        <div class="dificultades">
          ${DIFICULTADES.map((d) => {
            const mejor = ref.mejoresTiempos[d];
            return `
            <div class="dificultad">
              <button type="button" class="boton" data-dificultad="${d}">
                ${t(CLAVES_DIFICULTAD[d])}
              </button>
              ${
                mejor !== undefined
                  ? `<span class="mejor">${t('menu.best', { tiempo: formatearTiempo(mejor) })}</span>`
                  : ''
              }
            </div>`;
          }).join('')}
        </div>
        <label class="ajuste">
          <input type="checkbox" id="errores" ${ref.erroresAutomaticos ? 'checked' : ''}>
          ${t('menu.autoErrors')}
        </label>
        <div class="fila-ajustes"><div class="fila-idioma"></div></div>
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

    crearSelectorIdioma(raiz.querySelector<HTMLElement>('.fila-idioma')!);
    raiz.querySelector<HTMLElement>('.fila-ajustes')!.appendChild(crearBotonSonido());
  }
}

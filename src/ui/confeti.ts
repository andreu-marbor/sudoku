/* confeti.ts — lluvia de confeti DOM al completar (cero assets).
   Se omite con prefers-reduced-motion. */

import { prefiereMovimientoReducido } from '../efectos';

const COLORES = ['var(--acento)', 'var(--ok)', 'var(--error)', 'var(--nota)'];

export function lanzarConfeti(raiz: HTMLElement): void {
  if (prefiereMovimientoReducido()) return;

  const contenedor = document.createElement('div');
  contenedor.className = 'confeti';
  contenedor.setAttribute('aria-hidden', 'true');

  for (let i = 0; i < 60; i++) {
    const pieza = document.createElement('span');
    pieza.className = 'confeti-pieza';
    pieza.style.left = `${Math.random() * 100}%`;
    pieza.style.background = COLORES[Math.floor(Math.random() * COLORES.length)];
    pieza.style.width = `${6 + Math.random() * 6}px`;
    pieza.style.height = pieza.style.width;
    pieza.style.animationDelay = `${Math.random() * 0.8}s`;
    pieza.style.animationDuration = `${2.6 + Math.random() * 1.6}s`;
    pieza.style.setProperty('--deriva', `${(Math.random() - 0.5) * 120}px`);
    pieza.style.setProperty('--giro', `${Math.random() * 720 - 360}deg`);
    contenedor.appendChild(pieza);
  }

  raiz.appendChild(contenedor);
  setTimeout(() => contenedor.remove(), 4600);
}

/* efectos.ts — sonido WebAudio (tonos generados, cero assets), vibración
   háptica, botón 🔊/🔇 y detección de movimiento reducido. */

import { guardarTexto, leerTexto } from './persistencia';
import { t } from './i18n';

const CLAVE_SONIDO = 'sonido';

let contexto: AudioContext | null = null;

export function sonidoActivado(): boolean {
  return leerTexto(CLAVE_SONIDO) !== '0'; // activado por defecto
}

export function alternarSonido(): boolean {
  const nuevo = !sonidoActivado();
  guardarTexto(CLAVE_SONIDO, nuevo ? '1' : '0');
  return nuevo;
}

export function prefiereMovimientoReducido(): boolean {
  return (
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function tono(
  frecuencia: number,
  duracion: number,
  tipo: OscillatorType = 'sine',
  volumen = 0.06,
): void {
  if (!sonidoActivado()) return;
  try {
    contexto = contexto ?? new AudioContext();
    if (contexto.state === 'suspended') void contexto.resume();
    const oscilador = contexto.createOscillator();
    const ganancia = contexto.createGain();
    oscilador.type = tipo;
    oscilador.frequency.value = frecuencia;
    ganancia.gain.setValueAtTime(volumen, contexto.currentTime);
    ganancia.gain.exponentialRampToValueAtTime(0.0001, contexto.currentTime + duracion);
    oscilador.connect(ganancia);
    ganancia.connect(contexto.destination);
    oscilador.start();
    oscilador.stop(contexto.currentTime + duracion);
  } catch {
    /* sin audio seguimos jugando */
  }
}

export const efectos = {
  escribir: () => tono(523, 0.09),
  nota: () => tono(659, 0.06, 'triangle', 0.05),
  borrar: () => tono(294, 0.09),
  error: () => tono(147, 0.2, 'square', 0.04),
  ui: () => tono(440, 0.05, 'triangle', 0.05),
  Victoria: () => {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tono(f, 0.18), i * 120));
  },
};

/** Vibración háptica (solo en dispositivos que la soporten). */
export function vibrar(patron: number | number[]): void {
  try {
    navigator.vibrate?.(patron);
  } catch {
    /* sin háptica */
  }
}

/** Botón 🔊/🔇 persistente; las pantallas actualizan la etiqueta al repintar. */
export function crearBotonSonido(): HTMLButtonElement {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'boton-icono boton-sonido';
  pintarBotonSonido(boton);
  boton.addEventListener('click', () => {
    alternarSonido();
    pintarBotonSonido(boton);
    if (sonidoActivado()) efectos.ui();
  });
  return boton;
}

export function pintarBotonSonido(boton: HTMLButtonElement): void {
  boton.textContent = sonidoActivado() ? '🔊' : '🔇';
  boton.setAttribute('aria-label', t('sound.label'));
}

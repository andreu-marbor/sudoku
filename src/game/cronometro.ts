/* cronometro.ts — tiempo de partida con pausa, en milisegundos. */

export interface Cronometro {
  iniciar(): void;
  pausar(): void;
  alternar(): void;
  reiniciar(desdeMs?: number, correr?: boolean): void;
  ms(): number;
  corriendo(): boolean;
  destruir(): void;
}

export function crearCronometro(
  alCambiar: (ms: number) => void,
  intervaloMs = 500,
): Cronometro {
  let acumulado = 0;
  let desde: number | null = null;
  let temporizador: ReturnType<typeof setInterval> | null = null;

  const total = (): number => acumulado + (desde === null ? 0 : Date.now() - desde);

  function arrancarIntervalo(): void {
    if (temporizador === null) {
      temporizador = setInterval(() => alCambiar(total()), intervaloMs);
    }
  }

  function pararIntervalo(): void {
    if (temporizador !== null) {
      clearInterval(temporizador);
      temporizador = null;
    }
  }

  function iniciar(): void {
    if (desde !== null) return;
    desde = Date.now();
    arrancarIntervalo();
    alCambiar(total());
  }

  function pausar(): void {
    if (desde === null) return;
    acumulado = total();
    desde = null;
    pararIntervalo();
    alCambiar(acumulado);
  }

  function reiniciar(desdeMs = 0, correr = false): void {
    acumulado = desdeMs;
    desde = null;
    pararIntervalo();
    if (correr) iniciar();
    else alCambiar(acumulado);
  }

  return {
    iniciar,
    pausar,
    alternar: () => (desde === null ? iniciar() : pausar()),
    reiniciar,
    ms: total,
    corriendo: () => desde !== null,
    destruir: pararIntervalo,
  };
}

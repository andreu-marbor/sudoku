/* notas.ts — candidatos (modo lápiz) como máscara de bits por casilla.
   Bit (v-1) encendido = el candidato v está anotado en la casilla. */

export type Notas = number[]; // 81 máscaras (0..511)

export function crearNotas(): Notas {
  return new Array<number>(81).fill(0);
}

export function alternarCandidato(notas: Notas, i: number, v: number): void {
  notas[i] ^= 1 << (v - 1);
}

export function quitarCandidato(notas: Notas, i: number, v: number): void {
  notas[i] &= ~(1 << (v - 1));
}

export function tieneCandidato(notas: Notas, i: number, v: number): boolean {
  return (notas[i] & (1 << (v - 1))) !== 0;
}

export function candidatosDe(notas: Notas, i: number): number[] {
  const res: number[] = [];
  for (let v = 1; v <= 9; v++) {
    if (tieneCandidato(notas, i, v)) res.push(v);
  }
  return res;
}

export function tieneNotas(notas: Notas, i: number): boolean {
  return notas[i] !== 0;
}

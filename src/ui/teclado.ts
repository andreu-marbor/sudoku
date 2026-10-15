/* teclado — teclado numérico en pantalla (1-9 y borrar).
   onTecla(0) significa "borrar". El contenedor debe traer ya sus clases
   (`.teclado` y `.teclado-contenedor`); aquí no se toca el className. */

export function crearTeclado(contenedor: HTMLElement, onTecla: (valor: number) => void): void {
  contenedor.innerHTML = '';

  for (let v = 1; v <= 9; v++) {
    const tecla = document.createElement('button');
    tecla.type = 'button';
    tecla.className = 'tecla';
    tecla.textContent = String(v);
    tecla.addEventListener('click', () => onTecla(v));
    contenedor.appendChild(tecla);
  }

  const borrar = document.createElement('button');
  borrar.type = 'button';
  borrar.className = 'tecla borrar';
  borrar.textContent = '⌫';
  borrar.setAttribute('aria-label', 'Borrar casilla');
  borrar.addEventListener('click', () => onTecla(0));
  contenedor.appendChild(borrar);
}

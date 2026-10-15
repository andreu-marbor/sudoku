import './styles/base.css';

// Arranque del sudoku — Fase 0 (andamiaje).
// Esta pantalla provisional se sustituye por el menú real en la Fase 1.
const raiz = document.getElementById('app');
if (!raiz) throw new Error('Falta el elemento #app en index.html');

raiz.innerHTML = `
  <main class="inicio">
    <h1>Sudoku</h1>
    <p>Proyecto inicializado — fase 0.</p>
  </main>
`;

// Mouse and keyboard: translates raw events into game actions the main loop
// dispatches. Hit-testing lives in render.js, which owns the layout.
import { hitTest, toLogical } from './render.js';

export function createInput(canvas, dispatch) {
  function point(event) {
    return toLogical(canvas, event.clientX, event.clientY);
  }

  canvas.addEventListener('mousemove', (event) => {
    const p = point(event);
    dispatch({ type: 'hover', x: p.x, y: p.y });
  });
  canvas.addEventListener('mouseleave', () => dispatch({ type: 'hover', x: -1, y: -1 }));
  canvas.addEventListener('click', (event) => {
    const p = point(event);
    dispatch({ type: 'click', x: p.x, y: p.y });
  });
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key;
    if (key === ' ' || key === 'ArrowDown') event.preventDefault();
    dispatch({ type: 'key', key });
  });

  return { hitTest };
}

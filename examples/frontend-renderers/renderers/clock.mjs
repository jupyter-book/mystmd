// Anywidget-style renderer for `clock` nodes.
//
// Demonstrates lifecycle cleanup: the returned function clears the interval
// when the element is removed from the page.
export default function render({ el, node }) {
  const label = node?.label ?? '';

  const time = document.createElement('time');
  time.style.cssText = 'font-variant-numeric:tabular-nums;font-weight:600;';

  const tick = () => {
    const now = new Date();
    time.dateTime = now.toISOString();
    time.textContent = `${label}${label ? ' ' : ''}${now.toLocaleTimeString()}`;
  };
  tick();
  const interval = setInterval(tick, 1000);

  el.replaceChildren(time);

  return () => {
    clearInterval(interval);
  };
}

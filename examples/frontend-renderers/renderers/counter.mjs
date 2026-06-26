// Anywidget-style renderer for `counter` nodes.
//
// The default export receives the target element and the mdast node, mounts
// some UI, and may return a cleanup function that runs when the element is
// torn down.
export default function render({ el, node }) {
  let count = node?.start ?? 0;
  const label = node?.label ?? 'Count';

  const button = document.createElement('button');
  button.style.cssText =
    'padding:0.5rem 1rem;border-radius:0.5rem;border:1px solid #d0d7de;cursor:pointer;font:inherit;';

  const update = () => {
    button.textContent = `${label}: ${count}`;
  };
  update();

  const onClick = () => {
    count += 1;
    update();
  };
  button.addEventListener('click', onClick);

  el.replaceChildren(button);

  return () => {
    button.removeEventListener('click', onClick);
  };
}

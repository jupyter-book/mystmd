function render({ model, el }) {
  let count = () => model.get('count');
  let btn = document.createElement('button');
  btn.classList.add('counter-button');
  btn.innerHTML = `count is ${count()}`;
  btn.addEventListener('click', () => {
    model.set('count', count() + 1);
    model.save_changes();
  });
  model.on('change:count', () => {
    btn.innerHTML = `count is ${count()}`;
  });
  el.appendChild(btn);
}
export default { render };

function render({ model, el }) {
  // Setup quick-access to state
  const getCount = () => model.get('count');
  const setCount = (count) => model.set('count', count);

  // Create button
  let btn = document.createElement('button');
  btn.classList.add('counter-button');
  btn.innerHTML = `count is ${getCount()}`;

  // Handle button click
  btn.addEventListener('click', () => {
    setCount(getCount() + 1);
    model.save_changes();
  });
  // Update text when count changes
  model.on('change:count', () => {
    btn.innerHTML = `count is ${getCount()}`;
  });
  el.appendChild(btn);

  // Destructor to clean-up when MyST is finished with us!
  return () => btn.remove();
}
export default { render };

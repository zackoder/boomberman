export function createHTML(tag, atri, ...children) {
  const element = document.createElement(tag);
  //   const [key, value] = Object.entries(atri);

  for (const key in atri) {
    element[key] = atri[key];
  }
  element.append(...children)
  return element;
}

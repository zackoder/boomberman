export function createHTML(elment = root, Vdom) {
  if (
    typeof Vdom == "string" ||
    typeof Vdom == "number" ||
    Vdom === undefined ||
    !Vdom
  ) {
    const el = document.createTextNode(String(Vdom || ""));
    elment.append(el); // <p id="1" onclick = (e) => {} >text node</p>
    return el;
  }

  const el = document.createElement(Vdom.tag);

  // Appliquer les attributs
  for (const [key, value] of Object.entries(Vdom.attrs)) { // [[id: "1"], [class: "class1"], [onclick: functon(){}] ]
    // if (key === "") continue
    if (typeof value === "function" && key.startsWith("on")) el[key] = value;
    else el.setAttribute(key, value);
  }

  if (Vdom.children) {
    for (const child of Vdom.children.flat()) {
      createHTML(el, child);
    }
  }
  elment.append(el);
  return el;
}

export const root = document.getElementById("root");

export function jsx(tag, attrs, ...children) {
  if (typeof tag === "function") {
    return tag(attrs, ...children);
  } else {
    return {
      tag,
      attrs: attrs || {},
      children,
    };
  }
}

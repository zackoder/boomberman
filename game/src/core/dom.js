// export function createHTML(elment = root.children[0], Vdom) {
//   // debugger
//   if (!root.children[0]) elment = root
//   if (
//     typeof Vdom == "string" ||
//     typeof Vdom == "number" ||
//     Vdom === undefined ||
//     !Vdom
//   ) {
//     const el = document.createTextNode(String(Vdom || ""));
//     // console.log("element", elment, el);

//     elment.appendChild(el); // <p id="1" onclick = (e) => {} >text node</p>
//     return elment;
//   }
//   if (!Vdom.attrs) Vdom.attrs = {};
//   if (!Vdom.children) Vdom.children = {};
//   const el = document.createElement(Vdom.tag);

//   // Appliquer les attributs
//   for (const [key, value] of Object.entries(Vdom.attrs)) {
//     // [[id: "1"], [class: "class1"], [onclick: functon(){}] ]
//     // if (key === "") continue
//     if (typeof value === "function" && key.startsWith("on")) el[key] = value;
//     else el.setAttribute(key, value);
//   }

//   if (Array.isArray(Vdom.children)) {
//     for (const child of Vdom.children) {
//       createHTML(el, child);
//     }
//   }
//   elment.appendChild(el);
//   return el;
// }

export function createHTML(element = root, Vdom) {
  if (!Vdom && Vdom !== 0) return; // skip null, undefined, etc. but allow 0

  // Handle text or number nodes
  if (typeof Vdom === "string" || typeof Vdom === "number") {
    const textNode = document.createTextNode(String(Vdom));
    element.appendChild(textNode);
    return element;
  }

  // Ensure tag exists
  if (!Vdom?.tag) return;

  const el = document.createElement(Vdom.tag);

  // Apply attributes
  const attrs = Vdom.attrs || {};
  for (const [key, value] of Object.entries(attrs)) {
    if (typeof value === "function" && key.startsWith("on")) {
      el[key] = value; // Directly assign event handler
    } else {
      el.setAttribute(key, value);
    }
  }

  // Recursively create and append children
  const children = Array.isArray(Vdom.children) ? Vdom.children : [];
  for (const child of children) {
    createHTML(el, child);
  }

  element.appendChild(el);
  return el;
}


export const root = document.getElementById("root");

export function jsx(tag, attrs, ...children) {
  if (tag === "p") console.log(...children);

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

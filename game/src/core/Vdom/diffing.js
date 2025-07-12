import { createHTML, root } from "../dom.js";
// import { htmlToObject } from "./create.js";
// import { objectToHTML } from "./render.js";

// export function diffAndApply(oldNode, newNode) {
//   walk(oldNode, newNode, null, null);
// }

export function UpdateDOM(realElemt, oldVdom, newVdom) {
  if (!newVdom) {
    return;
  }
  if (!oldVdom || oldVdom.tag !== newVdom.tag) {
    const newElement = createHTML(realElemt, newVdom);
    realElemt?.parentNode?.replaceChild(newElement, realElemt);
    return;
  }
  updateAttrs(oldVdom, newVdom, realElemt);
  updateChildren(realElemt, oldVdom.children, newVdom.children);
}

function updateChildren(element, oldChildren, newChildren) {
  oldChildren = oldChildren || [];
  newChildren = newChildren || [];

  const oldKeys = new Map();
  oldChildren.forEach((child, index) => {
    if (typeof child !== "string" && child?.attrs?.key) {
      oldKeys.set(child.attrs.key, {
        vdom: child,
        element: element.childNodes[index],
      }); ///[key:{vdom:ch..}]
    }
  });

  const newKeys = new Set(
    newChildren
      .filter((c) => typeof c !== "string" && c?.attrs?.key)
      .map((c) => c.attrs.key)
  );
  oldKeys.forEach((value, key) => {
    if (!newKeys.has(key)) {
      element.removeChild(value.element);
    }
  });

  // Update or insert children at each position

  newChildren.forEach((newChild, i) => {
    let realChild = element.childNodes[i]; // div{div,p,spam}

    if (typeof newChild === "string") {
      if (realChild && realChild.nodeType === Node.TEXT_NODE) {
        // hello
        if (realChild.textContent !== newChild) {
          realChild.textContent = newChild;
        }
      } else {
        const textNode = document.createTextNode(newChild);
        if (realChild) {
          element.replaceChild(textNode, realChild);
        } else {
          element.appendChild(textNode);
        }
      }
    } else {
      const newKey = newChild?.attrs?.key;
      if (newKey) {
        const oldEntry = oldKeys.get(newKey);
        if (oldEntry) {
          const oldElement = oldEntry.element;
          if (oldElement !== realChild) {
            element.insertBefore(oldElement, realChild);
            realChild = oldElement;
          }
          UpdateDOM(realChild, oldEntry.vdom, newChild);
        } else {
          const newElement = createHTML(element, newChild);
          if (realChild) {
            element.insertBefore(newElement, realChild);
          } else {
            element.appendChild(newElement);
          }
        }
      } else {
        if (realChild && realChild.nodeType === Node.ELEMENT_NODE) {
          const oldChild = oldChildren[i];
          if (
            typeof oldChild === "object" &&
            oldChild.tag === newChild.tag &&
            !oldChild.attrs?.key
          ) {
            UpdateDOM(realChild, oldChild, newChild);
          } else {
            const newElement = createHTML(element, newChild);
            element.replaceChild(newElement, realChild);
          }
        } else {
          const newElement = createHTML(element, newChild);
          if (realChild) {
            element.replaceChild(newElement, realChild);
          } else {
            element.appendChild(newElement);
          }
        }
      }
    }
  });
  while (element.childNodes.length > newChildren.length) {
    element.removeChild(element.lastChild);
  }
}

function updateAttrs(oldNode, newNode, realElemt) {
  oldNode = oldNode.attrs || {};
  newNode = newNode.attrs || {};

  for (const [key, value] of Object.entries(newNode)) {
    if (typeof value === "function" && key.startsWith("on"))
      realElemt[key] = value;
    else realElemt.setAttribute(key, value);
  }
  for (const [key, _] of Object.entries(oldNode)) {
    // console.log(key);
    if (!(key in newNode)) {
      realElemt.removeAttribute(key);
      // delete realElemt.attrs[key];
    }
  }
}

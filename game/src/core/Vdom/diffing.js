import { createHTML, root } from "../dom.js";
// import { htmlToObject } from "./create.js";
// import { objectToHTML } from "./render.js";

// export function diffAndApply(oldNode, newNode) {
//   walk(oldNode, newNode, null, null);
// }

// export function UpdateDOM(realElemt = root.children[0], oldVdom, newVdom) {
//   if (!realElemt || oldVdom.tag !== newVdom.tag) {
//     console.log("different tags", oldVdom, newVdom);
//     console.log("parent", newVdom);

//     createHTML(root, newVdom)
//   }
// }


export function UpdateDOM(realElemt = root.children[0], oldVdom, newVdom) {

  // console.log("oldvdom", oldVdom);
  // console.log("newVdom", newVdom);

  if (!newVdom) {
    return;
  }
  // console.log("------------------------ test", !oldVdom || oldVdom?.tag !== newVdom?.tag);

  if (!oldVdom || oldVdom.tag !== newVdom.tag) {
    // console.log("---------------", oldVdom?.tag, newVdom?.tag);

    const newElement = createHTML(realElemt, newVdom);
    // console.log("new element created", newElement);

    realElemt?.parentNode?.replaceChild(newElement, realElemt);
    return;
  }
  // console.log("key and value", root.children);

  updateAttrs(oldVdom, newVdom, realElemt);
  updateChildren(realElemt, oldVdom.children, newVdom.children);
}

let counter = 0
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
  // if (counter === 1) console.log("__________________________", newChildren, element.children);

  newChildren.forEach((newChild, i) => {
    let realChild = element.childNodes[i]; // div{div,p,spam}
    // console.log(typeof newChild === "string" || typeof newChild === "number", newChild, realChild);

    if (typeof newChild === "string" || typeof newChild === "number") {
      if (realChild && realChild.nodeType === Node.TEXT_NODE) {
        // hello
        // console.log("real chiled", realChild);
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
      // console.log();

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
        // debugger
        if (realChild && realChild.nodeType === Node.ELEMENT_NODE) {
          const oldChild = oldChildren[i];
          if (
            typeof oldChild === "object" &&
            oldChild.tag === newChild.tag &&
            !oldChild.attrs?.key
          ) {
            // console.log(realChild);

            UpdateDOM(realChild, oldChild, newChild);
          } else {
            const newElement = createHTML(element, newChild);
            element.replaceChild(newElement, realChild);
          }
        } else {
          const newElement = createHTML(element, newChild);

          if (realChild) {
            // console.log("newElement", typeof newElement);
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
  counter++
}

function updateAttrs(oldNode, newNode, realElemt) {
  oldNode = oldNode.attrs || {};
  newNode = newNode.attrs || {};

  for (const [key, value] of Object.entries(newNode)) {

    if (typeof value === "function" && key.startsWith("on")) realElemt[key] = value;
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

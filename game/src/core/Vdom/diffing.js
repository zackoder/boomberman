import { createHTML, root } from "../dom.js";

export function UpdateDOM(realElemt = root.children[0], oldVdom, newVdom) {
  if (!newVdom) {
    // If newVdom is null/undefined, remove the element
    if (realElemt && realElemt.parentNode) {
      realElemt.parentNode.removeChild(realElemt);
    }
    return;
  }

  if (!oldVdom || oldVdom.tag !== newVdom.tag) {
    const newElement = createHTML(realElemt?.parentNode || root, newVdom);
    if (newElement && realElemt?.parentNode) {
      realElemt.parentNode.replaceChild(newElement, realElemt);
    }
    return;
  }

  updateAttrs(oldVdom, newVdom, realElemt);
  updateChildren(realElemt, oldVdom.children, newVdom.children);
}

let counter = 0;

function updateChildren(element, oldChildren, newChildren) {
  // Filter out undefined/null values and ensure arrays
  oldChildren = (oldChildren || []).filter(child => child !== undefined && child !== null);
  newChildren = (newChildren || []).filter(child => child !== undefined && child !== null);

  const oldKeys = new Map();
  const oldChildElements = Array.from(element.childNodes);

  oldChildren.forEach((child, index) => {
    if (typeof child !== "string" && child?.attrs?.key) {
      const childElement = oldChildElements[index];
      if (childElement) {
        oldKeys.set(child.attrs.key, {
          vdom: child,
          element: childElement,
        });
      }
    }
  });

  const newKeys = new Set(
    newChildren
      .filter((c) => typeof c !== "string" && c?.attrs?.key)
      .map((c) => c.attrs.key)
  );

  // Remove old keyed elements that are no longer needed
  oldKeys.forEach((value, key) => {
    if (!newKeys.has(key)) {
      if (value.element && value.element.parentNode) {
        value.element.parentNode.removeChild(value.element);
      }
    }
  });

  // Update or insert children at each position
  newChildren.forEach((newChild, i) => {
    // Skip if newChild is undefined or null (shouldn't happen after filtering, but safety check)
    if (newChild === undefined || newChild === null) {
      return;
    }

    let realChild = element.childNodes[i];

    if (typeof newChild === "string" || typeof newChild === "number") {
      const textContent = String(newChild);

      if (realChild && realChild.nodeType === Node.TEXT_NODE) {
        if (realChild.textContent !== textContent) {
          realChild.textContent = textContent;
        }
      } else {
        const textNode = document.createTextNode(textContent);
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
          if (newElement) {
            if (realChild) {
              element.insertBefore(newElement, realChild);
            } else {
              element.appendChild(newElement);
            }
          }
        }
      } else {
        if (realChild && realChild.nodeType === Node.ELEMENT_NODE) {
          const oldChild = oldChildren[i];

          if (
            oldChild &&
            typeof oldChild === "object" &&
            oldChild.tag === newChild.tag &&
            !oldChild.attrs?.key
          ) {
            UpdateDOM(realChild, oldChild, newChild);
          } else {
            const newElement = createHTML(element, newChild);
            if (newElement) {
              element.replaceChild(newElement, realChild);
            }
          }
        } else {
          const newElement = createHTML(element, newChild);
          if (newElement) {
            if (realChild) {
              element.replaceChild(newElement, realChild);
            } else {
              element.appendChild(newElement);
            }
          }
        }
      }
    }
  });

  // Remove any remaining child nodes that are no longer needed
  while (element.childNodes.length > newChildren.length) {
    const lastChild = element.lastChild;
    if (lastChild) {
      element.removeChild(lastChild);
    }
  }

  counter++;
}

function updateAttrs(oldNode, newNode, realElemt) {
  const oldAttrs = oldNode.attrs || {};
  const newAttrs = newNode.attrs || {};

  // Add or update new attributes
  for (const [key, value] of Object.entries(newAttrs)) {
    if (key === "key") continue; // Skip the key attribute as it's for virtual DOM only

    if (typeof value === "function" && key.startsWith("on")) {
      realElemt[key] = value;
    } else if (key in realElemt) {
      realElemt[key] = value;
    } else if (value !== null && value !== undefined) {
      realElemt.setAttribute(key, String(value));
    }
  }

  // Remove old attributes that are no longer present
  for (const [key, _] of Object.entries(oldAttrs)) {
    if (key === "key") continue;

    if (!(key in newAttrs)) {
      if (key.startsWith("on")) {
        realElemt[key] = null;
      } else {
        realElemt.removeAttribute(key);
      }
    }
  }
}
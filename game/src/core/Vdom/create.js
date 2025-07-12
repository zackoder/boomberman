export function htmlToObject(element) {

  if (
    element.nodeType === Node.TEXT_NODE &&
    element.textContent.trim() === ""
  ) {
    return null;
  }

  if (element.nodeType === Node.TEXT_NODE) {
    return {
      type: "text",
      content: element.textContent.trim(),
    };
  }

  const obj = {
    tag: element.tagName.toLowerCase(),
    attrs: {},
  };

  for (let attr of element.attributes || []) {
    obj.attrs[attr.name] = attr.value;
  }

  const childNodes = Array.from(element.childNodes);
  const children = [];

  for (let child of childNodes) {
    const childObj = htmlToObject(child);
    if (childObj) {
      children.push(childObj);
    }
  }

  if (children.length > 0) {
    obj.children = children;
  }

  return obj;
}

 
// console.log("still here");
const EventRegistry = {}; // Key: "elementId_eventType" → [handlers]
let idCounter = 0;

// Events your framework supports
const SupportedEvents = [
  "click",
  "dblclick",
  "input",
  "keydown",
  "scroll",
  "mouseover",
  "mouseout",
  "change",
  "submit",
  "keypress",
  "keyup",
  "blur",
  "focus",
];

function getElementId(element) {
  if (!element.dataset.eventId) {
    element.dataset.eventId = `eid_${++idCounter}`;
  }
  return element.dataset.eventId;
}

export function EventListener(target, eventType, callback) {
  if (!SupportedEvents.includes(eventType)) {
    console.warn(`[EventListener] Unsupported event type: ${eventType}`);
    return;
  }

  let element = null;

  if (typeof target === "string") {
    if (target === "document") {
      element = document;
    } else if (target === "window") {
      element = window;
    } else {
      element = document.querySelector(target);
    }
  } else {
    element = target;
  }

  if (!element) {
    console.warn(`[EventListener] Target not found for: ${target}`);
    return;
  }

  const elementId = getElementId(element);
  const registryKey = `${elementId}_${eventType}`;

  if (!EventRegistry[registryKey]) {
    EventRegistry[registryKey] = [];

    // Set up internal dispatcher
    element[`on${eventType}`] = function (event) {
      EventRegistry[registryKey].forEach((handler) => {
        handler.call(element, event);
      });
    };
  }

  EventRegistry[registryKey].push(callback);
}
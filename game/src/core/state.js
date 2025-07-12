import { render } from "./render.js";

let states = [];
export let stateIndex = 0;

export function resetStateIndex() {
  stateIndex = 0;
}

export function useState(initialValue) {
  const currentIndex = stateIndex;
  
  if (states[currentIndex] === undefined) {
    states[currentIndex] = initialValue;
  }

  function setState(newValue) {
    if (typeof newValue === "function") states[currentIndex] = newValue();
    else states[currentIndex] = newValue;
    render();
  }

  stateIndex++; // Move to next state slot
  return [states[currentIndex], setState];
}

export function jsx(tag, props, ...children) {
  if (typeof tag === "function") {
    return tag({ ...props, children });
  }
  return { tag, props: props || {}, children };
}

// Create function the useEffect
// useEffect(callfunction(), [name])
// let effects = [];
// // let effectIndex = null;
// let effectIndex = 0;
// export function useEffect(callback, dependencies) {
//   const oldDependencies = effects[effectIndex];
//   let hasChanged = true;

//   if (oldDependencies) {
//     hasChanged = dependencies.some(
//       (dep, i) => !Object.is(dep, oldDependencies[i])
//     );
//   }

//   if (hasChanged) {
//     callback();
//   }
//   effects[effectIndex] = dependencies;
//   // effectIndex = effectIndex ? 0 : effectIndex++;
//   effectIndex++;
// }

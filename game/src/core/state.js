import { render } from "./render.js";

export class useState {
  constructor(initialValue) {
    this.initialValue = initialValue
    // this.value = this.initialValue
  }
  setState(newValue) {
    if (typeof newValue === "function") this.initialValue = newValue()
    else this.initialValue = newValue
    render();
  }
  getStat() {
    return this.initialValue
  }
}

// let hookStates = [];
// let hookIndex = 0;

// export function resetStateIndex() {
//   hookIndex = 0
// }

// export function useState(initialValue) {
//   const currentIndex = hookIndex;

//   // Initialize the state if it's the first time this hook is run
//   hookStates[currentIndex] = hookStates[currentIndex] || initialValue;

//   // Update hook index for the next hook call
//   hookIndex++;

//   // Function to update state and re-render
//   const setState = (newValue) => {
//     console.log(hookStates);

//     hookStates[currentIndex] = typeof newValue === 'function'
//       ? newValue(hookStates[currentIndex])
//       : newValue;
//     render(); // Re-render the component
//   };

//   return [hookStates[currentIndex], setState];
// }

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

import { rout } from "./router.js";
import { resetStateIndex } from "./state.js";

export let currentVdom = null;

export function updateVdom(new_dome) {
  currentVdom = new_dome;
}

export function render() {

  resetStateIndex();
  rout.handleRouteChange();
}

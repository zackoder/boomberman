import { createHTML } from "./element.js";

export class Router {
  constructor() {
    this.routers = {};
    this.currentPath = window.location.pathname;
    window.addEventListener("popstate", () => this.handleRouteChange());
  }

  addrout(path, callback) {
    this.routers[path] = callback;
    createHTML("link", {
      
    })
  }

  handleRouteChange() {
    const path = window.location.pathname;
    if (this.routers[path]) {
      this.routers[path]();
    }
  }

  navigate(path) {
    history.pushState(null, null, path);
    this.handleRouteChange();
  }
}

import { root } from "./dom.js";
import NotFound from "./notfound.js";
import { currentVdom, updateVdom } from "./render.js";
import { UpdateDOM } from "./Vdom/diffing.js";

export class Router {
  constructor() {
    this.routers = { "/notfound": NotFound };
    this.currentPath = window.location.pathname;
    window.addEventListener("popstate", () => this.handleRouteChange());
  }

  addrout(path, callback) {
    this.routers[path] = callback;
  }

  handleRouteChange() {
    const path = window.location.pathname;

    if (this.routers[path]) {
      const Vdom = this.routers[path]();
      UpdateDOM(root.children[0], currentVdom, Vdom);
      updateVdom(Vdom);
    } else {
      this.navigate("/notfound");
    }

    this.currentPath = path;
  }

  navigate(path) {
    history.pushState(null, null, path);
    this.handleRouteChange();
  }
  CurrentPath() {
    return this.currentPath;
  }
}

export const rout = new Router();

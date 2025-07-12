import { jsx, root } from "./core/dom.js";
import { render } from "./core/render.js";

export class Game {
  constructor(map) {
    this.map = map;
  }
  drawMap() {
    let children = [];
    for (let row = 0; row < this.map.length; row++) {
      for (let column = 0; column < this.map.length; column++) {
        if (this.map[row][column] === 0) {
          children.push(jsx("div", { className: `emptysell` }));
        }
        if (this.map[row][column] === 1) {
          children.push(jsx("div", { className: `wall` }));
        }
        if (this.map[row][column] === 2) {
          children.push(jsx("div", { className: `softwall` }));
        }
      }
    }
    const gameContainer = jsx(
      "div",
      { className: "gameContainer" },
      ...children
    );
    // root.append(gameContainer);
    render(root, gameContainer);
  }
}

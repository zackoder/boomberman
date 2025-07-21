import { jsx, root } from "./core/dom.js";
import { render } from "./core/render.js";
export class Game {
  constructor(map, players) {
    if (players.length < 2) {
      return;
    }

    this.map = map;
    this.players = players;
  }
  setNewMap(map) {
    this.map = map;
  }
  drawMap() {
    const mapElements = [];

   
    const playerPositionMap = {};
    

    for (let row = 0; row < this.map.length; row++) {
      for (let col = 0; col < this.map[row].length; col++) {
        const cell = this.map[row][col];
      
        let children;
        if (cell >= 3 && cell < 3 + this.players.length) {
          const player = this.players[cell - 3];
          if (player) {
            children = jsx(
              "div",
              {
                class: `player player-${player.name}`,
                style: `background-color: ${player.color}`,
              },
              jsx("div", { class: "name-label" }, player.name)
            );
          }
        }

        if (cell === 0 || children) {
          mapElements.push(jsx("div", { class: "emptysell" }, children));
        } else if (cell === 1) {
          mapElements.push(jsx("div", { class: "wall" }));
        } else if (cell === 2) {
          mapElements.push(jsx("div", { class: "softwall" }));
        } else if (cell === 7) {
          mapElements.push(
            jsx(
              "div",
              { class: "emptysell" },
              jsx("div", { class: "powerup firepower" }, "🔥")
            )
          );
        } else if (cell === 8) {
          mapElements.push(
            jsx(
              "div",
              { class: "emptysell" },
              jsx("div", { class: "powerup bomb" }, "💣")
            )
          );
        } else if (cell === 9) {
          mapElements.push(
            jsx(
              "div",
              { class: "emptysell" },
              jsx("div", { class: "powerup speed" }, "🏃‍♂️")
            )
          );
        } else if (cell === 10) {
          mapElements.push(
            jsx(
              "div",
              { class: "emptysell" },
              jsx("div", { class: "bomb" }, "💣")
            )
          );
        } else if (cell === 11) {
          mapElements.push(jsx("div", { class: "emptysell explosion" }, "💥"));
        }
      }
    }

    const gameContainer = jsx(
      "div",
      {
        class: "gameContainer",
        
      },
      ...mapElements
    );

    return gameContainer;
  }
}

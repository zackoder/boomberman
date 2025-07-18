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

    // const PLAYER_START_POSITIONS = [
    //   { row: 1, col: 1 },
    //   { row: 13, col: 13 },
    //   { row: 13, col: 1 },
    //   { row: 1, col: 13 },
    // ];

    const playerPositionMap = {};
    // this.players.forEach((player, index) => {
    // const pos = PLAYER_START_POSITIONS[index];
    // if (pos) {
    //   const key = `${pos.row},${pos.col}`;
    //   playerPositionMap[key] = player;
    // }
    // });
    // console.log(this.map[1][1]);

    for (let row = 0; row < this.map.length; row++) {
      for (let col = 0; col < this.map[row].length; col++) {
        const cell = this.map[row][col];
        // console.log(cell);

        // const key = `${row},${col}`;
        // const player = playerPositionMap[key];

        let children;
        // this.players.forEach(player => {
        if (cell >= 3 && cell <= 6) {
          children = jsx(
            "div",
            {
              class: `player player-${this.players[cell - 3].name}`,
              style: `background-color: ${this.players[cell - 3].color}`,
            },
            jsx("div", { class: "name-label" }, this.players[cell - 3].name)
          );
        }
        // });

        if (cell === 0 || (cell >= 3 && cell <= 6)) {
          mapElements.push(jsx("div", { class: "emptysell" }, children));
        } else if (cell === 1) {
          mapElements.push(jsx("div", { class: "wall" }));
        } else if (cell === 2) {
          mapElements.push(jsx("div", { class: "softwall" }));
        } else if (cell === 3) {
          mapElements.push();
        }
      }
    }

    const gameContainer = jsx(
      "div",
      {
        class: "gameContainer",
        // onkeydown: (e) => {
        //   e.preventDefault();
        //   console.log("hihi");
        //   if (e.key === " " && socket?.readyState === WebSocket.OPEN) {
        //     socket.send(JSON.stringify({ type: "drop-bomb" }));
        //   }
        //   throttledMove(e);
        // }
      },
      ...mapElements
    );

    return gameContainer;
  }
}

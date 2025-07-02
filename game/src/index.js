import { createHTML } from "./core/element.js";
import { Router } from "./core/router.js";
import { Dom } from "./core/vdom.js";
import { Game } from "./game.js";
import { EventListener } from "./core/events.js";

export const rout = new Router();
const dom = new Dom();
const root = dom.getRoot()
let socket = null;
let localPlayer = null;
let allPlayers = {};
let game = null;


rout.addrout("/", homePage);
rout.addrout("/game", gamehandler);

function homePage() {
  console.log('im heree');
  
  // onmessage
  const label = createHTML("label", { for: "nameInpt", textContent: "enter your name:" })
  const input = createHTML("input", { id: "nameInpt", className: "input" })

  const form = createHTML("form", { onsubmit: submitName }, label, input)
  const game = createHTML("div", {
    className: "gameContainer"
  }, form)

  root.appendChild(game)
}

function createConnection() {
  
  if (socket !== null) return
  socket = new WebSocket("ws://0.0.0.0:3001")

socket.onmessage = (e) => {
  const data = JSON.parse(e.data);
  if (!data) return;

  if (data.error) {
    const errorContainer = createHTML("p", { className: "error" })
    errorContainer.textContent = data.error;
    root.appendChild(errorContainer);
    setTimeout(() => errorContainer.remove(), 3000);
  }

  // Handle initial map and player info
  if (data.type === "init") {
    game = new Game(data.map);
    localPlayer = {
      name: data.player.name,
      x: data.player.x,
      y: data.player.y
    };
    allPlayers[localPlayer.name] = localPlayer;
    rout.navigate("/game");
    // game.drawMap();
    renderPlayer(localPlayer);
  }

  // Handle player movement update
  if (data.type === "player-move") {
    if (!allPlayers[data.name]) {
      allPlayers[data.name] = {
        name: data.name,
        x: data.x,
        y: data.y
      };
    } else {
      allPlayers[data.name].x = data.x;
      allPlayers[data.name].y = data.y;
    }

    renderPlayer(allPlayers[data.name]);
  }
};

}

createConnection()
rout.handleRouteChange()

function gamehandler() {
  root.innerHTML = ""
  if (game === undefined) return rout.navigate("/")
  console.log(game);
  game.drawMap()
}




function renderPlayer(player) {
  // Remove any existing player divs for this name
  document.querySelectorAll(`.player-${player.name}`).forEach(el => el.remove());

  const index = player.y * 15 + player.x;  
  const cell = document.querySelectorAll(".gameContainer > div")[index];
  if (cell) {
    const playerDiv = createHTML("div", {
      className: `player player-${player.name}`
    });
    cell.appendChild(playerDiv);
  }
}

function submitName(e) {
  e.preventDefault()
  const name = e.target.children[1].value.trim()
  // console.log(ipt);
  if (!name) return
  socket.send(JSON.stringify({ "type": "name", name }))

}

EventListener("document", "keydown", (e) => {
  const keyMap = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right"
  };

  if (keyMap[e.key] && socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: "move",
      dir: keyMap[e.key]
    }));
  }
});

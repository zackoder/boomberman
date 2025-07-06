import { createHTML } from "./core/element.js";
import { Router } from "./core/router.js";
import { Dom } from "./core/vdom.js";
import { Game } from "./game.js";
import { EventListener } from "./core/events.js";
const MAX_ROWS = 15;

export const rout = new Router();
const dom = new Dom();
const root = dom.getRoot();
let socket = null;
let localPlayer = {};
let allPlayers = {};
let game = null;

rout.addrout("/", homePage);
rout.addrout("/game", gamehandler);

function homePage() {
  root.innerHTML = "";
  // onmessage
  const label = createHTML("label", {
    for: "nameInpt",
    textContent: "enter your name:",
  });
  const input = createHTML("input", { id: "nameInpt", className: "input" });

  const form = createHTML(
    "form",
    { className: "nickname", onsubmit: submitName },
    label,
    input
  );
  const game = createHTML(
    "div",
    {
      className: "gameContainer",
    },
    form
  );
  const playersCounter = createHTML("span", { className: "playersCounter" });
  game.appendChild(playersCounter);
  root.appendChild(game);
}
function chatHandler(e) {
  e.preventDefault();
  socket.send(JSON.stringify({ message: e.target.children[0].value }));
}
let allreadyStarted = false;
function createConnection() {
  if (socket !== null) return;
  socket = new WebSocket("ws://0.0.0.0:3001"); //this should be updated if needed when needed

  socket.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (!data) return;
    if (data.gameStarted) {
      if (allreadyStarted) return;
      allreadyStarted = true;
      console.log("started");

      EventListener("document", "keydown", (e) => {
        const keyMap = {
          ArrowUp: "up",
          ArrowDown: "down",
          ArrowLeft: "left",
          ArrowRight: "right",
        };

        if (keyMap[e.key] && socket?.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify({
              type: "move",
              dir: keyMap[e.key],
            })
          );
        }
        if (e.key === " " && socket?.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "drop-bomb" }));
        }
      });
    }
    if (data.restart) {
      setTimeout(() => {
        rout.navigate("/");
      }, 5000);

      const errorel = document.querySelector(".error");
      if (!errorel) {
        const error = createHTML("div", {
          className: "error",
          textContent: "the others left befor the game start",
        });
        root.prepend(error);
      }
    }
    if (data.name) {
      localPlayer.name = data.name;
    }
    if (data.time) {
      const T = document.querySelector(".timer");
      if (!T) {
        const timer = createHTML("span", {
          className: "timer",
          textContent: data.time,
        });
        root.appendChild(timer);
      } else {
        T.textContent = data.time;
      }
    }
    if (data.error) {
      const errorContainer = createHTML("p", { className: "error" });
      errorContainer.textContent = data.error;
      root.appendChild(errorContainer);
      setTimeout(() => errorContainer.remove(), 3000);
    }

    if (data.message) {
      const container = createHTML("div");
      const message = createHTML("p", {
        className: "message",
        textContent: `from: ${data.sender} ${data.message}`,
      });
      container.prepend(message);
      document.querySelector(".gameContainer").appendChild(container);
    }
    if (data.players) {
      document.querySelector(
        ".playersCounter"
      ).textContent = `${data.info} ${data.players}`;
    }
    if (data.players >= 2) {
      const chatSection = createHTML(
        "div",
        { className: "chatbox" },
        createHTML("div", { className: "mesagesContainer" }),
        createHTML(
          "form",
          { onsubmit: chatHandler, classList: "chatForm" },
          createHTML("input", { className: "chatInput" })
        )
      );
      document.querySelector(".nickname").remove();
      document.querySelector(".gameContainer").appendChild(chatSection);
    }

    // Handle initial map and player info
    if (data.type === "init") {
      game = new Game(data.map);
      for (let player of data.players) {
        console.log(player);

        allPlayers[player.name] = { ...player };
        // console.log(allPlayers);

        // if (player.name === localPlayer.name) {
        //   console.log(player);
        // }
      }
      console.log(allPlayers);

      // localPlayer = {
      //   name: data.player.name,
      //   x: data.player.x,
      //   y: data.player.y,
      // };
      // allPlayers[localPlayer.name] = localPlayer;
      rout.navigate("/game");
      game.drawMap(allPlayers);
      for (let [key, value] of Object.entries(allPlayers)) {
        console.log(key, value);
        renderPlayer(value);
      }
      // const chatSection = createHTML(
      //   "div",
      //   { className: "chatbox" },
      //   createHTML("div", { className: "mesagesContainer" }),
      //   createHTML(
      //     "form",
      //     { onsubmit: chatHandler, classList: "chatForm" },
      //     createHTML("input", { className: "chatInput" })
      //   )
      // );
      // root.appendChild(chatSection);
      const form = document.querySelector(".chatForm");
      console.log(form);

      // EventListener(".chatForm", "submit", chatHandler);
    }

    // Handle player movement update
    if (data.type === "player-move") {
      if (!allPlayers[data.name]) {
        allPlayers[data.name] = {
          name: data.name,
          x: data.x,
          y: data.y,
        };
      } else {
        allPlayers[data.name].x = data.x;
        allPlayers[data.name].y = data.y;
      }

      // for (let player in allPlayers) {
      //   renderPlayer(player);
      // }

      renderPlayer(allPlayers[data.name]);
      if (data.name === localPlayer.name) {
        checkForPowerUp(data.x, data.y);
      }
    }
    if (data.type === "player-leave") {
      document
        .querySelectorAll(`.player-${data.name}`)
        .forEach((el) => el.classList.remove("player"));
      delete allPlayers[data.name];
    }
    if (data.type === "bomb-placed") {
      drawBomb(data.x, data.y);
    }
    if (data.type === "bomb-exploded") {
      animateExplosion(data.x, data.y);
      removeBomb(data.x, data.y);
    }
    if (data.type === "player-dead") {
      document
        .querySelectorAll(`.player-${data.name}`)
        .forEach((el) => el.remove());
      delete allPlayers[data.name];
    }
    if (data.type === "powerup-appeared") {
      placePowerUp(data.x, data.y, data.powerUp);
    }
    if (data.type === "update-lives" && data.name === localPlayer.name) {
      document.querySelector("#hud-lives").textContent = data.lives;
    }
    if (data.type === "power-up-collected" && data.name === localPlayer.name) {
      document.querySelector("#hud-fire").textContent = data.newStats.firepower;
      document.querySelector("#hud-bombs").textContent = data.newStats.maxBombs;
    }
  };
}

createConnection();
rout.handleRouteChange();
function gamehandler() {
  if (game === null) return rout.navigate("/");
  root.innerHTML = "";
  const hud = createHTML("div", { className: "hud" });
  hud.innerHTML = `
  <p>❤️ Lives: <span id="hud-lives">${3}</span></p>
  <p>🔥 Firepower: <span id="hud-fire">${0}</span></p>
  <p>💣 Bombs: <span id="hud-bombs">${1}</span></p>
`;
  root.appendChild(hud);
  // game.drawMap();
  for (let player in allPlayers) renderPlayer(player);
}
// power-UPS section
function placePowerUp(x, y, kind) {
  const index = y * MAX_ROWS + x; // Assuming row-major order
  const cell = document.querySelectorAll(".gameContainer > div")[index];

  if (cell) {
    // Remove existing powerup first  if there is any
    const existing = cell.querySelector(".powerup");
    if (existing) existing.remove();

    // Create power-up
    const powerup = createHTML("div", { className: `powerup ${kind}` });
    powerup.textContent = getPowerupSymbol(kind);
    cell.appendChild(powerup);
  }
}
function getPowerupSymbol(kind) {
  switch (kind) {
    case "bomb":
      return "B";
    case "fire":
      return "F";
    case "random":
      return "?";
    default:
      return "";
  }
}
function checkForPowerUp(playerX, playerY) {
  const index = playerY * MAX_ROWS + playerX;
  const cell = document.querySelectorAll(".gameContainer > div")[index];
  const powerup = cell.querySelector(".powerup");
  if (powerup) {
    const kind = [...powerup.classList].find((cls) => cls !== "powerup");
    powerup.remove();

    console.log("Power-up collected:", kind);
  }
}

function renderPlayer(player) {
  if (!player) return;
  document
    .querySelectorAll(`.player-${player.name}`)
    .forEach((el) => el.remove());
  console.log(player.y, player.x);

  const index = player.y * 15 + player.x;
  const cell = document.querySelectorAll(".gameContainer > div")[index];
  if (cell) {
    const playerDiv = createHTML(
      "div",
      {
        className: `player player-${player.name}`,
      },
      createHTML("div", {
        className: "name-label",
        textContent: player.name,
      })
    );
    cell.appendChild(playerDiv);
  }
}

function submitName(e) {
  e.preventDefault();
  const nameInput = e.target.querySelector("#nameInpt");
  // if (nameInput)
  // console.log(ipt);
  if (!nameInput) return;
  const name = nameInput.value.trim();
  if (!name) return;
  socket.send(JSON.stringify({ type: "name", name }));
}

function animateExplosion(
  centerX,
  centerY,
  directions = ["up", "down", "left", "right"]
) {
  const affectedTiles = [{ x: centerX, y: centerY }];

  const dirMap = {
    up: { dx: 0, dy: -1 },
    down: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 },
  };

  for (const dir of directions) {
    const { dx, dy } = dirMap[dir];
    const x = centerX + dx;
    const y = centerY + dy;

    //  this condition is to prevent going into walls
    if (x >= 0 && x < MAX_ROWS && y >= 0 && y < MAX_ROWS) {
      affectedTiles.push({ x, y });
    }
  }

  for (const tile of affectedTiles) {
    const index = tile.y * MAX_ROWS + tile.x;
    const cell = document.querySelectorAll(".gameContainer > div")[index];
    if (cell) {
      if (!cell.classList.contains("wall")) {
        const explosion = createHTML("div", { className: "explosion" });
        cell.appendChild(explosion);
        setTimeout(() => explosion.remove(), 500);
      }
      console.log(cell);
      if (cell.classList.contains("softwall")) {
        cell.classList.remove("softwall");
        cell.classList.add("emptysell");
      }
    }
  }
}

function drawBomb(x, y) {
  const index = y * MAX_ROWS + x;
  const cell = document.querySelectorAll(".gameContainer > div")[index];
  if (!cell) return;
  const bomb = createHTML("div", { className: "bomb" });
  cell.appendChild(bomb);
}

function removeBomb(x, y) {
  const index = y * MAX_ROWS + x;
  const cell = document.querySelectorAll(".gameContainer > div")[index];
  if (!cell) return;
  const bomb = cell.querySelector(".bomb");
  if (bomb) bomb.remove();
}

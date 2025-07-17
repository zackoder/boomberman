import { Router } from "./core/router.js";
import { Game } from "./game.js";
import { EventListener } from "./core/events.js";
import { throttle } from "./functions/helperfunctions.js";
import { jsx, root } from "./core/dom.js";
import { render } from "./core/render.js";
import { useState } from "./core/state.js";

let moveDelay = 200;
const MAX_ROWS = 15;
export const rout = new Router();
let socket = null;
let localPlayer = {};
let allPlayers = {};

let game = null;
let players = null;
let playersCounter;
//wax tzad

rout.addrout("/", homePage);
rout.addrout("/game", gamehandler);

const ManegLocalPlayer = new useState({});
const ManageTimer = new useState(20);
const Managemessages = new useState([]);
const ManegAllPlayers = new useState({});

export function homePage() {
  localPlayer = ManegLocalPlayer.getStat()
  handlemsgs();
  const currentTime = ManageTimer.getStat()
  console.log(currentTime);

  const timerContainer = jsx("p", { class: "timer" }, "Timer : ", currentTime);

  const label = jsx(
    "label",
    {
      for: "nameInpt",
      // textContent: "enter your name:",
    },
    "Enter Your Name:"
  );
  // create input
  const input = jsx("input", {
    id: "nameInpt",
    class: "input"
  });

  // create form with label and input as children
  let currentdata
  const prevMessages = Managemessages.getStat()
  const messages = prevMessages.map(msg => {
    return jsx(
      "p",
      {
        class: "message",
      },
      jsx("span", {}, `from ${msg.sender} : `),
      jsx("span", {}, `${msg.message}`)

    );
  })
  console.log(prevMessages);

  const chatSection = jsx(
    "div",
    { class: "chatbox" },
    jsx("div", { class: "messagesContainer" }),
    jsx(
      "form",
      { onsubmit: chatHandler, class: "chatForm" },
      jsx("input", { class: "chatInput", placeholder: "enter your message" })
    )
  );

  const container = jsx("div", { class: "container-chat" }, chatSection, ...messages);

  const form = jsx(
    "form",
    { class: "form-nickname", onsubmit: submitName },
    label,
    input
  );

  // const game = jsx(
  //   "div",
  //   {
  //     class: "gameContainer",
  //   },
  //   form
  // );
  // console.log(ManegLocalPlayer.getStat());
  if (localPlayer.name) currentdata = container

  else currentdata = form
  // console.log("local player name", localPlayer.name);


  const playersCounter = jsx("span", { class: "playersCounter" }, "the number of players : " + (ManegLocalPlayer.getStat().playersCounter || 0));
  return jsx("div", { class: "home-page", },
    jsx("div",
      {
        class: "gameInfo",
      },
      localPlayer.name ? "" : form,
      timerContainer,
      playersCounter
    ),
    localPlayer.name ? container : "",
  );
  // return game;
}

function chatHandler(e) {
  e.preventDefault();
  const input = e.target.children[0]
  socket.send(JSON.stringify({ message: input.value }));
  input.value = ""
}

let alreadyStarted = false;
let throttledMove = null;
function handleMove(e) {
  // console.log("hihi", e);
  if (e.key !== "F5") e.preventDefault();
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
}

function createConnection() {
  if (socket !== null) return;
  //this should be updated if needed when needed depending on which machine we're working with
  socket = new WebSocket("ws://0.0.0.0:3001");
}

function handlemsgs() {
  localPlayer = ManegLocalPlayer.getStat()
  socket.onmessage = (e) => {
    const data = JSON.parse(e.data);

    if (!data) return;
    console.log("__________________________----------------", data);
    if (data.message) {
      const prevMessages = Managemessages.getStat()
      Managemessages.setState([data, ...prevMessages])
    }
    if (data.gameStarted) {
      if (alreadyStarted) return;
      rout.navigate("/game");

      alreadyStarted = true;
      console.log("started");
      // const throttledMove = throttle((e) => {
      //   const keyMap = {
      //     ArrowUp: "up",
      //     ArrowDown: "down",
      //     ArrowLeft: "left",
      //     ArrowRight: "right",
      //   };
      //   if (keyMap[e.key] && socket?.readyState === WebSocket.OPEN) {
      //     socket.send(
      //       JSON.stringify({
      //         type: "move",
      //         dir: keyMap[e.key],
      //       })
      //     );
      //   }
      // }, moveDelay);
      moveDelay = allPlayers[ManegLocalPlayer.getStat().name]?.speed || 200;
      throttledMove = throttle(handleMove, moveDelay);
      // EventListener("document", "keydown", (e) => {
      // jsx("document", {
      //   onkeydown: (e) => {players
      //     if (e.key === " " && socket?.readyState === WebSocket.OPEN) {
      //       socket.send(JSON.stringify({ type: "drop-bomb" }));
      //     }
      //     e.preventDefault();
      //     throttledMove(e);
      //   },
      // });
    }
    if (data.restart) {
      setTimeout(() => {
        rout.navigate("/");
      }, 5000);

      // const errorel = document.querySelector(".error");
      // if (!errorel) {
      //   const error = jsx("div", {
      //     class: "error",
      //     textContent: "the others left befor the game start",
      //   });
      //   root.prepend(error);
      // }
      if (!err) {
        const err = jsx(
          "div",
          { class: "error" },
          "the others left before the game start"
        );
        render(root, err);
      }
    }
    if (data.name) {
      ManegLocalPlayer.setState({ name: data.name });
      localPlayer.name = data.name;
    }
    if (data.time) {
      ManageTimer.setState(data.time);
    }


    if (data.players) {
      // console.log(data)
      ManegLocalPlayer.setState({ ...localPlayer, playersCounter: data.players })

      // console.log(ManegLocalPlayer.getStat())
      // document.querySelector(
      //   ".playersCounter"
      // ).textContent = `${data.info} ${data.players}`;
      // playersCounter.textContent = playersCounter
      //   ? `${data.info} ${data.players}`
      //   : "";
    }
    // Handle initial map and player info
    if (data.type === "init") {
      game = new Game(data.map, data.players);
      players = data.palayers;
      for (let player of data.players) {
        allPlayers[player.name] = { ...player };
      }
      ManegAllPlayers.setState(allPlayers)

      game.drawMap(allPlayers);
      // for (let [key, value] of Object.entries(allPlayers)) {
      //   console.log(key, value);
      //   renderPlayer(value);
      // }

      //delete this const form
      // const form = document.querySelector(".chatForm");
      // console.log(form);
    }
    if (data.type === "player-move") {
      console.log(data);

      ManegAllPlayers.setState(data.palayers)
      // ManegLocalPlayer.setState()
      // if (!allPlayers[data.name]) return;
      // allPlayers[data.name].x = data.x;
      // allPlayers[data.name].y = data.y;

      // renderPlayer(allPlayers[data.name]);
      // if (data.name === localPlayer.name) {
      //   checkForPowerUp(data.x, data.y);
      // }
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
      animateExplosion(data.explosionTiles);
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
    // this whole section should be updated there should be no queryselectors
    // ## khdaam 3la raseek a si waliiiid

    if (data.type === "update-lives" && data.name === localPlayer.name) {
      document.querySelector("#hud-lives").textContent = data.lives;
    }
    if (data.type === "power-up-collected") {
      removePowerUp(data.x, data.y);
      if (data.name === localPlayer.name) {
        document.querySelector("#hud-fire").textContent =
          data.newStats.firepower;
        document.querySelector("#hud-bombs").textContent =
          data.newStats.maxBombs;
        document.querySelector("#hud-speed").textContent = `x${200 / data.newStats.speed
          }`;
      }
    }
    if (data.type === "power-up-expired") {
      if (data.name === localPlayer.name) {
        if (data.stat === "firepower") {
          document.querySelector("#hud-fire").textContent = data.value;
          localPlayer.firepower = data.value;
        } else if (data.stat === "maxBombs") {
          document.querySelector("#hud-bombs").textContent = data.value;
          localPlayer.maxBombs = data.value;
        } else if (data.stat === "speed") {
          document.querySelector("#hud-speed").textContent = "1";
          localPlayer.speed = data.value;
        }
      }
    }
    if (data.type === "update-speed" && data.name === localPlayer.name) {
      moveDelay = data.speed;
      localPlayer.speed = data.speed;
      document.querySelector("#hud-speed").textContent = `x${200 / moveDelay}`;
      throttledMove = throttle(handleMove, moveDelay);
    }

    if (data.type === "game-over") {
      gameOver(data.winner);
    }
  };
}
createConnection();
rout.handleRouteChange();
export function gamehandler() {

  if (game === null || players === null) return rout.navigate("/");
  console.log("test");

  const lives = jsx("p", {}, "❤️ Lives:", jsx("span", { id: "hud-lives" }, 3));
  const firepower = jsx("p", {}, "🔥 Firepower:", jsx("span", { id: "hud-fire" }, 1));
  const Bombs = jsx("p", {}, "💣 Bombs: ", jsx("span", { id: "hud-bombs" }, 1));
  const Speed = jsx("p", {}, "👠 Speed: ", jsx("span", { id: "hud-speed" }, 1));
  const hud = jsx("div", { class: "hud" }, lives, firepower, Bombs, Speed)

  const map = game.drawMap(players)


  const gamee = jsx("div", {
    tabIndex: 0,
    onkeydown: (e) => {
      // console.log("hihi");
      if (e.key !== "F5") e.preventDefault();

      if (e.key === " " && socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "drop-bomb" }));
      }

      throttledMove(e);
    }
  }, hud, map)

  return gamee
}
// power-UPS section
function placePowerUp(x, y, kind) {
  const index = y * MAX_ROWS + x;
  const cell = document.querySelectorAll(".gameContainer > div")[index];

  if (cell) {
    // Remove existing powerup first ,if there is any
    const existing = cell.querySelector(".powerup");
    if (existing) existing.remove();

    // Create power-up
    const powerup = jsx("div", { class: `powerup ${kind}` });
    powerup.textContent = getPowerupSymbol(kind);
    cell.appendChild(powerup);
  }
}

function getPowerupSymbol(kind) {
  switch (kind) {
    case "bomb":
      return "B";
    case "firepower":
      return "F";
    case "speed":
      return "S";
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

// function renderPlayer(player) {
//   console.log("Playererrrrrrrr", player);

//   if (!player) return;
//   document
//     .querySelectorAll(`.player-${player.name}`)
//     .forEach((el) => el.remove());
//   console.log(player.y, player.x);

//   const index = player.y * MAX_ROWS + player.x;
//   const cell = document.querySelectorAll(".gameContainer > div")[index];
//   if (cell) {
//     const playerDiv = jsx(
//       "div",
//       {
//         class: `player player-${player.name}`,
//         style: `background-color: ${player.color}`,
//       },
//       jsx("div", {
//         class: "name-label",
//         textContent: player.name,
//       })
//     );
//     cell.appendChild(playerDiv);
//   }
// }

function submitName(e) {
  e.preventDefault();

  const nameInput = e.target.children[1]
  // if (nameInput)
  // console.log(ipt);
  if (!nameInput) return;
  const name = nameInput.value.trim();
  nameInput.value = ""
  if (!name) return;
  socket.send(JSON.stringify({ type: "name", name }));
}

function animateExplosion(explosionTiles) {
  for (const tile of explosionTiles) {
    const index = tile.y * MAX_ROWS + tile.x;
    const cell = document.querySelectorAll(".gameContainer > div")[index];
    if (cell) {
      if (!cell.classList.contains("wall")) {
        const explosion = jsx("div", { class: "explosion" });
        cell.appendChild(explosion);
        setTimeout(() => explosion.remove(), 500);
      }

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
  const bomb = jsx("div", { class: "bomb" });
  cell.appendChild(bomb);
}

function removeBomb(x, y) {
  const index = y * MAX_ROWS + x;
  const cell = document.querySelectorAll(".gameContainer > div")[index];
  if (!cell) return;
  const bomb = cell.querySelector(".bomb");
  if (bomb) bomb.remove();
}

function removePowerUp(x, y) {
  const index = y * MAX_ROWS + x;
  const cell = document.querySelectorAll(".gameContainer > div")[index];
  if (cell) {
    const powerup = cell.querySelector(".powerup");
    if (powerup) powerup.remove();
  }
}

function gameOver(winnerName = "Unknown") {
  alreadyStarted = false;
  for (let player in allPlayers) {
    document.querySelectorAll(`.player-${player}`).forEach((el) => el.remove());
  }
  allPlayers = {};
  localPlayer = {};

  const gameOverScreen = jsx("div", {
    class: "game-over",
  });

  const message = jsx("h2", {
    textContent: winnerName
      ? `🏆 Game Over! Winner: ${winnerName}`
      : "☠️ Game Over! You Lost!",
  });

  const button = jsx(
    "button",
    { class: "restart-btn", onclick: () => rout.navigate("/") },
    jsx("span", { textContent: "Return to Lobby" })
  );

  gameOverScreen.appendChild(message);
  gameOverScreen.appendChild(button);
  root.innerHTML = "";
  root.appendChild(gameOverScreen);
}
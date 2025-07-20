import { Router } from "./core/router.js";
import { Game } from "./game.js";
import { throttle } from "./functions/helperfunctions.js";
import { jsx, root } from "./core/dom.js";
import { render } from "./core/render.js";
import { useState } from "./core/state.js";

let moveDelay = 200;
// const MAX_ROWS = 15;
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
const ManageError = new useState("");
const Managewinner = new useState("");
const Manageloser = new useState("");

export function homePage() {
  localPlayer = ManegLocalPlayer.getStat();

  handlemsgs();
  const currentTime = ManageTimer.getStat();

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
    class: "input",
  });

  // create form with label and input as children
  let currentdata;
  const prevMessages = Managemessages.getStat();
  const messages = prevMessages.map((msg) => {
    return jsx(
      "p",
      {
        class: "message",
      },
      jsx("span", {}, `from ${msg.sender} : `),
      jsx("span", {}, `${msg.message}`)
    );
  });

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

  const container = jsx(
    "div",
    { class: "container-chat" },
    chatSection,
    ...messages
  );
  const err0 = jsx("div", { class: "err" }, ManageError.getStat());

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
  if (localPlayer.name) currentdata = container;
  else currentdata = form;
  // console.log("local player name", localPlayer.name);

  const info = [
    "wait for other players to join",
    "you will start after the counter ends",
  ];
  const playersCounternbr = ManegLocalPlayer.getStat().playersCounter;
  const playersCounter = jsx(
    "p",
    { class: "playersCounter" },
    "the current number of player(s) is; " +
      (playersCounternbr ? playersCounternbr : 0)
  );
  let pinfo;
  if (playersCounternbr) {
    pinfo = jsx("p", {}, info[playersCounternbr > 1 ? 1 : 0]);
  }
  return jsx(
    "div",
    { class: "home-page" },
    jsx(
      "div",
      {
        class: "gameInfo",
      },
      localPlayer.name ? "" : form,
      playersCounter,
      pinfo ? pinfo : "",
      timerContainer,
      err0
    ),
    localPlayer.name ? container : ""
  );
  // return game;
}

function chatHandler(e) {
  e.preventDefault();
  const input = e.target.children[0];
  socket.send(JSON.stringify({ message: input.value }));
  input.value = "";
}

let alreadyStarted = false;
let throttledMove = null;
function handleMove(e) {
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
  socket = new WebSocket("ws://localhost:3001");
}
const ManageMap = new useState([]);

function handlemsgs() {
  localPlayer = ManegLocalPlayer.getStat();
  socket.onmessage = (e) => {
    const data = JSON.parse(e.data);

    if (!data) return;
    if (data.winnerMessage) {
      Managewinner.setState(data.winnerMessage);
    }
    if (data.losermessage) {
      Manageloser.setState(data.losermessage);
    }
    if (data.newMap) {
      game.setNewMap(data.newMap);
      ManageMap.setState(data.newMap);
    }
    if (data.message) {
      const prevMessages = Managemessages.getStat();
      Managemessages.setState([data, ...prevMessages]);
    }
    if (data.gameStarted) {
      if (alreadyStarted) return;
      // requestAnimationFrame(() => {
      // ManageMap.getStat();
      // console.log("hi");
      rout.navigate("/game");
      // });
      // rout.navigate("/game");
      // requestAnimationFrame(game.drawMap(allPlayers));

      alreadyStarted = true;
      moveDelay = allPlayers[ManegLocalPlayer.getStat().name]?.speed || 200;
      throttledMove = throttle(handleMove, moveDelay);
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
      // if (!err) {
      //   const err = jsx(
      //     "div",
      //     { class: "error" },
      //     "the others left before the game start"
      //   );
      //   render(root, err);
      // }
    }
    if (data.error) {
      ManageError.setState(data.error);
    }
    if (data.name) {
      // console.log("-----------------------", localPlayer);
      if (!localPlayer?.name) {
        ManegLocalPlayer.setState({
          name: data.name,
          lives: 3,
          maxBombs: 1,
          firepower: 1,
          speed: 1,
        });
        localPlayer.name = data.name;
      }
      ManageError.setState("");
    }
    if (data.time) {
      ManageTimer.setState(data.time);
    }

    if (data.Upplayer) {
      localPlayer = ManegLocalPlayer.getStat();
      // console.log(data.Upplayer.name, localPlayer.name);
      if (data.Upplayer.name === localPlayer.name) {
        ManegLocalPlayer.setState(data.Upplayer);
      }
    }
    if (data.players) {
      localPlayer = ManegLocalPlayer.getStat();
      ManegLocalPlayer.setState({
        ...localPlayer,
        playersCounter: data.players,
      });
      console.log((localPlayer = ManegLocalPlayer.getStat()));
    }

    if (data.type === "init") {
      game = new Game(data.map, data.players);
      players = data.palayers;

      for (let player of data.players) {
        allPlayers[player.name] = { ...player };
      }
      // ManegAllPlayers.setState(allPlayers);
      //  requestAnimationFrame(game.drawMap(allPlayers))
      ManageMap.setState(data.map);
      // for (let [key, value] of Object.entries(allPlayers)) {
      //   console.log(key, value);
      //   renderPlayer(value);
      // }

      //delete this const form
      // const form = document.querySelector(".chatForm");
      // console.log(form);
    }
    if (data.type === "player-move") {
      ManegAllPlayers.setState(data.palayers);
      // ManegLocalPlayer.setState()
      // if (!allPlayers[data.name]) return;
      // allPlayers[data.name].x = data.x;
      // allPlayers[data.name].y = data.y;

      // renderPlayer(allPlayers[data.name]);
      // if (data.name === localPlayer.name) {
      //   checkForPowerUp(data.x, data.y);
      // }
    }
    // if (data.type === "player-leave") {
    //   ManegAllPlayers.setState(data.palayers);
    // }
    // if (data.type === "bomb-placed") {
    //   ManegAllPlayers.setState(data.palayers);
    // drawBomb(data.x, data.y);
    // }
    // if (data.type === "bomb-exploded") {
    //   ManegAllPlayers.setState(data.palayers);
    // }
    // if (data.type === "player-dead") {
    //   ManegAllPlayers.setState(data.palayers);
    // }
    // if (data.type === "powerup-appeared") {
    //   placePowerUp(data.x, data.y, data.powerUp);
    // }
    // this whole section should be updated there should be no queryselectors
    // ## khdaam 3la raseek a si waliiiid

    // if (data.type === "update-lives" && data.name === localPlayer.name) {
    //   document.querySelector("#hud-lives").textContent = data.lives;
    // }
    if (data.type === "power-up-collected") {
      ManegAllPlayers.setState(data.palayers);
      // removePowerUp(data.x, data.y);
      // if (data.name === localPlayer.name) {
      //   document.querySelector("#hud-fire").textContent =
      //     data.newStats.firepower;
      //   document.querySelector("#hud-bombs").textContent =
      //     data.newStats.maxBombs;
      //   document.querySelector("#hud-speed").textContent = `x${200 / data.newStats.speed
      //     }`;
      // }
    }
    if (data.type === "power-up-expired") {
      ManegAllPlayers.setState(data.palayers);
      if (data.name === localPlayer.name) {
        if (data.stat === "firepower") {
          ManegAllPlayers.setState(data.palayers);
        } else if (data.stat === "maxBombs") {
          ManegAllPlayers.setState(data.palayers);
        } else if (data.stat === "speed") {
          moveDelay = 200;
          ManegAllPlayers.setState(data.palayers);
        }
      }
    }
    if (data.type === "update-speed" && data.name === localPlayer.name) {
      moveDelay = data.speed;
      // localPlayer.speed = data.speed;
      // document.querySelector("#hud-speed").textContent = `x${200 / moveDelay}`;
      throttledMove = throttle(handleMove, moveDelay);
      ManegAllPlayers.setState(data.palayers);
    }
    if (data.type === "game-over") {
      gameOver(data.winner);
    }
  };
}
createConnection();
rout.handleRouteChange();
export function gamehandler() {
  // startanimating();
  if (game === null || players === null) return rout.navigate("/");
  localPlayer = ManegLocalPlayer.getStat();
  const loser = Manageloser.getStat();
  const winner = Managewinner.getStat();

  const winnerComp = jsx(
    "div",
    { class: "winner" },
    jsx("p", { class: "messageWinner" }, winner)
  );

  const loserComp = jsx(
    "div",
    { class: "loser" },
    jsx("p", { class: "messageLooser" }, loser)
  );

  if (winner) {
    return winnerComp;
  }

  if (loser) {
    return loserComp;
  }

  const lives = jsx(
    "p",
    {},
    "❤️ Lives:",
    jsx("span", { id: "hud-lives" }, localPlayer.lives)
  );
  const firepower = jsx(
    "p",
    {},
    "🔥 Firepower:",
    jsx("span", { id: "hud-fire" }, localPlayer.firepower)
  );
  const Bombs = jsx(
    "p",
    {},
    "💣 Bombs: ",
    jsx("span", { id: "hud-bombs" }, localPlayer.maxBombs)
  );
  const Speed = jsx(
    "p",
    {},
    "👠 Speed: ",
    jsx("span", { id: "hud-speed" }, "X" + localPlayer.speed)
  );
  const hud = jsx("div", { class: "hud" }, lives, firepower, Bombs, Speed);

  const map = game.drawMap(ManageMap.getStat());

  const gamee = jsx(
    "div",
    {
      tabIndex: 0,
      onkeydown: (e) => {
        // console.log("hihi");
        if (e.key !== "F5") e.preventDefault();

        if (e.key === " " && socket?.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "drop-bomb" }));
        }
        throttledMove(e);
      },
    },
    hud,
    map
  );

  return gamee;
}

function gameLoop() {
  if (game && allPlayers) game.drawMap();
  requestAnimationFrame(gameLoop);
}

gameLoop();

// function test() {
//   console.log("hello");
//   requestAnimationFrame(test);
// }
// test();
// requestAnimationFrame(test);
// function startanimating() {
//   rout.navigate("/game");
//   // game.drawMap();
// }

// function drawmap() {
// }
// power-UPS section
// function placePowerUp(x, y, kind) {
//   const index = y * MAX_ROWS + x;
//   const cell = document.querySelectorAll(".gameContainer > div")[index];

//   if (cell) {
//     // Remove existing powerup first ,if there is any
//     const existing = cell.querySelector(".powerup");
//     if (existing) existing.remove();

//     // Create power-up
//     const powerup = jsx("div", { class: `powerup ${kind}` });
//     powerup.textContent = getPowerupSymbol(kind);
//     cell.appendChild(powerup);
//   }
// }

// function getPowerupSymbol(kind) {
//   switch (kind) {
//     case "bomb":
//       return "B";
//     case "firepower":
//       return "F";
//     case "speed":
//       return "S";
//     case "random":
//       return "?";
//     default:
//       return "";
//   }
// }

// function checkForPowerUp(playerX, playerY) {
//   const index = playerY * MAX_ROWS + playerX;
//   const cell = document.querySelectorAll(".gameContainer > div")[index];
//   const powerup = cell.querySelector(".powerup");
//   if (powerup) {
//     const kind = [...powerup.classList].find((cls) => cls !== "powerup");
//     powerup.remove();

//     console.log("Power-up collected:", kind);
//   }
// }

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

  const nameInput = e.target.children[1];
  // if (nameInput)
  // console.log(ipt);
  if (!nameInput) return;
  const name = nameInput.value.trim();
  nameInput.value = "";
  if (!name) return;
  socket.send(JSON.stringify({ type: "name", name }));
}

// function animateExplosion(explosionTiles) {
//   for (const tile of explosionTiles) {
//     const index = tile.y * MAX_ROWS + tile.x;
//     const cell = document.querySelectorAll(".gameContainer > div")[index];
//     if (cell) {
//       if (!cell.classList.contains("wall")) {
//         const explosion = jsx("div", { class: "explosion" });
//         cell.appendChild(explosion);
//         setTimeout(() => explosion.remove(), 500);
//       }

//       if (cell.classList.contains("softwall")) {
//         cell.classList.remove("softwall");
//         cell.classList.add("emptysell");
//       }
//     }
//   }
// }

// function drawBomb(x, y) {
//   const index = y * MAX_ROWS + x;
//   const cell = document.querySelectorAll(".gameContainer > div")[index];
//   if (!cell) return;
//   const bomb = jsx("div", { class: "bomb" });
//   cell.appendChild(bomb);
// }

// function removeBomb(x, y) {
//   const index = y * MAX_ROWS + x;
//   const cell = document.querySelectorAll(".gameContainer > div")[index];
//   if (!cell) return;
//   const bomb = cell.querySelector(".bomb");
//   if (bomb) bomb.remove();
// }

// function removePowerUp(x, y) {
//   const index = y * MAX_ROWS + x;
//   const cell = document.querySelectorAll(".gameContainer > div")[index];
//   if (cell) {
//     const powerup = cell.querySelector(".powerup");
//     if (powerup) powerup.remove();
//   }
// }

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

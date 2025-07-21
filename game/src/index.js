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
const ManagegameStart = new useState(false);

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

 
  if (localPlayer.name) currentdata = container;
  else currentdata = form;

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
      ManagegameStart.setState(data.gameStarted);

      alreadyStarted = true;
      moveDelay = allPlayers[ManegLocalPlayer.getStat().name]?.speed || 200;
      throttledMove = throttle(handleMove, moveDelay);
    }
    if (data.restart) {
      setTimeout(() => {
        rout.navigate("/");
      }, 5000);
    }
    if (data.error) {
      ManageError.setState(data.error);
    }
    if (data.name) {
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
    }

    if (data.type === "init") {
      game = new Game(data.map, data.players);
      players = data.palayers;

      for (let player of data.players) {
        allPlayers[player.name] = { ...player };
      }
      ManageMap.setState(data.map);
      rout.navigate("/game");
    }
    if (data.type === "player-move") {
      ManegAllPlayers.setState(data.palayers);
    }

    if (data.type === "power-up-collected") {
      ManegAllPlayers.setState(data.palayers);
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
  const gamestarted = ManagegameStart.getStat();
  const currentTime = ManageTimer.getStat();
  const timerContainer = jsx(
    "p",
    { class: "timer-started" },
    gamestarted ? "you can start now" : "the game will in " + currentTime + "s"
  );

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

  console.log("gamestarted", gamestarted);

  const gamee = jsx(
    "div",
    {
      tabIndex: 0,
      ...(gamestarted
        ? {
            onkeydown: (e) => {
              if (e.key !== "F5") e.preventDefault();

              if (e.key === " " && socket?.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: "drop-bomb" }));
              }
              throttledMove(e);
            },
          }
        : {}),
    },
    timerContainer,
    hud,
    map
  );
  return gamee;
}

function gameLoop() {
  if (game && allPlayers) game.drawMap();
  requestAnimationFrame(gameLoop);
}

let randem = Math.random();

let test = { test: "test", ...{ ...(randem > 0.5 ? { test2: "test2" } : {}) } };

console.log("test", test);

gameLoop();

function submitName(e) {
  e.preventDefault();

  const nameInput = e.target.children[1];

  if (!nameInput) return;
  const name = nameInput.value.trim();
  nameInput.value = "";
  if (!name) return;
  socket.send(JSON.stringify({ type: "name", name }));
}

 

  
 
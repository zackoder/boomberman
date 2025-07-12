const {
  HandleExplosion,
  applyPowerUp,
  powerUps,
} = require("./Functions/gameFunctions");
const { broadcast } = require("./Functions/helperFunctions");

const express = require("express");
const app = express();
const http = require("http");
const wsokcet = require("websocket").server;
const server = http.createServer(app);
const ws = new wsokcet({ httpServer: server });
let map = [];
const MAX_ROWS = 15;
const bombs = [];
// const powerUps = require("./Functions/gameFunctions");
const START_POSITIONS = [
  { x: 1, y: 1 },
  { x: MAX_ROWS - 2, y: 1 },
  { x: 1, y: MAX_ROWS - 2 },
  { x: MAX_ROWS - 2, y: MAX_ROWS - 2 },
];
const MAX_FIREPOWER = 2;
const MAX_BOMBS = 3;
const MAX_SPEED = 2;
const POWER_UP_DURATION = 30000;
const info = [
  "wait for other players to join",
  "you will start after a few secends",
];
let gameStat = false;

const players = new Map();
const PLAYER_COLORS = ["red", "blue", "green", "yellow"];

ws.on("request", (req) => {
  const connection = req.accept(null, req.origin);
  if (players.size === 0) {
    gameStat = false;
  }
  connection.on("message", (message) => {
    const data = JSON.parse(message.utf8Data);
    let currentPlayer = "";
    if (gameStat && data.type === "name") {
      connection.sendUTF(
        JSON.stringify({ error: "the game already started please try again" })
      );
      return;
    }

    if (data.message) {
      const player = players.get(connection);
      broadcast({ sender: player.name, message: data.message }, players);
    }

    if (data.type === "name") {
      if (map.length === 0) {
        createmap();
      }
      for (let [conn, p] of players) {
        // console.log(p);
        console.log("player", p.name);
        if (data.name === p.name) {
          connection.sendUTF(
            JSON.stringify({ error: "the player name already existe" })
          );
          return;
        }
      }
      const startIndex = players.size;
      if (startIndex >= START_POSITIONS.length) {
        return connection.sendUTF(JSON.stringify({ error: "Room is full" }));
      }
      currentPlayer = data.name;
      const position = START_POSITIONS[startIndex];
      const player = {
        name: data.name,
        x: position.x,
        y: position.y,
        lives: 3,
        maxBombs: 1,
        activeBombs: 0,
        firepower: 1,
        speed: 200,
        color: PLAYER_COLORS[startIndex],
      };
      players.set(connection, player);
      if (map.length === 0) createmap();

      let interval = null;
      let currentTime = 300;
      let waiting = 0;
      console.log("interval condition", players.size >= 2, currentTime === 300);

      if (players.size == 2) {
        interval = setInterval(() => {
          console.log(players.size >= 2, interval === null);
          if (players.size === 2 || currentTime <= 0) {
            clearInterval(interval);
            gameStat = true;
            currentTime = 300;
            broadcast(
              { type: "init", map, players: [...players.values()] },
              players
            );
          }
          if (players.size < 2) {
            clearInterval(interval);
            currentTime = 200;
            broadcast({ time: currentTime }, players);
            return;
          }
          currentTime--;
          broadcast({ time: currentTime }, players);
        }, 1000);
      }
      let beforestart = null;
      if (!beforestart) {
        beforestart = setInterval(() => {
          if (gameStat) {
            console.log("conting donw befor the game start", waiting);

            if (players.size < 2) {
              broadcast({ players: players.size, restart: "restart" }, players);
              clearInterval(beforestart);
              return;
            }
            if (waiting <= 0) {
              broadcast({ gameStarted: true }, players);
              clearInterval(beforestart);
              return;
            }
            broadcast({ time: waiting }, players);
            waiting--;
          }
        }, 1000);
      }
    }
    if (!gameStat) {
      broadcast(
        {
          name: data.name,
          players: players.size,
          info: info[players.size < 2 ? 0 : 1],
        },
        players
      );
    }

    // Send initial map and player info
    if (data.type === "move") {
      if (!players.has(connection)) {
        return connection.sendUTF(
          JSON.stringify({ error: "Unregistered player" })
        );
      }
      const player = players.get(connection);
      if (!player || player.dead) return;

      const { dir } = data;
      const dirs = {
        up: { dx: 0, dy: -1 },
        down: { dx: 0, dy: 1 },
        left: { dx: -1, dy: 0 },
        right: { dx: 1, dy: 0 },
      };

      const direction = dirs[dir];
      if (!direction) return;

      const { dx, dy } = direction;
      const newX = player.x + dx;
      const newY = player.y + dy;

      if (map[newY]?.[newX] === 0) {
        player.x = newX;
        player.y = newY;

        broadcast(
          {
            type: "player-move",
            name: player.name,
            x: newX,
            y: newY,
            // players,
          },
          players
        );
      }
      const powerUpIndex = powerUps.findIndex(
        (p) => p.x === player.x && p.y === player.y
      );
      if (powerUpIndex !== -1) {
        const powerUp = powerUps.splice(powerUpIndex, 1)[0];

        if (powerUp.type === "firepower") {
          applyPowerUp(
            player,
            "firepower",
            MAX_FIREPOWER,
            POWER_UP_DURATION,
            players
          );
        } else if (powerUp.type === "bomb") {
          applyPowerUp(
            player,
            "maxBombs",
            MAX_BOMBS,
            POWER_UP_DURATION,
            players
          );
        } else if (powerUp.type === "speed") {
          applyPowerUp(player, "speed", null, POWER_UP_DURATION, players);
        }

        broadcast(
          {
            type: "power-up-collected",
            name: player.name,
            x: player.x,
            y: player.y,
            powerUp: powerUp.type,
            newStats: {
              firepower: player.firepower,
              maxBombs: player.maxBombs,
              speed: player.speed,
            },
          },
          players
        );
      }
    }
    if (data.type === "drop-bomb") {
      const player = players.get(connection);
      if (!player || player.lives <= 0) return;
      if (player.activeBombs >= player.maxBombs) return;

      const { x, y, name } = player;

      if (bombs.some((b) => b.x === x && b.y === y)) return;

      bombs.push({ x, y, owner: name });
      player.activeBombs++;

      // notify clients that the bomb is placed by a player !!!!!!!
      broadcast(
        {
          type: "bomb-placed",
          x,
          y,
        },
        players
      );

      // set a timeout to the explosion
      setTimeout(() => {
        HandleExplosion(map, x, y, name, players, bombs);
        player.activeBombs--;
      }, 1200);
    }
  });

  connection.on("close", () => {
    const leavingPlayer = players.get(connection);
    if (leavingPlayer) {
      broadcast(
        {
          type: "player-leave",
          name: leavingPlayer.name,
        },
        players
      );
    }
    players.delete(connection);
  });
});

function createmap() {
  let row = [];
  map = [];
  for (let rows = 0; rows < MAX_ROWS; rows++) {
    for (let colomn = 0; colomn < MAX_ROWS; colomn++) {
      if (
        (rows === 1 && colomn === 1) ||
        (rows === 1 && colomn === 2) ||
        (rows === 2 && colomn === 1)
      ) {
        row.push(0);
        continue;
      }

      if (
        (rows === 1 && colomn === MAX_ROWS - 3) ||
        (rows === 1 && colomn === MAX_ROWS - 2) ||
        (rows === 2 && colomn === MAX_ROWS - 2)
      ) {
        row.push(0);
        continue;
      }

      if (
        (rows === MAX_ROWS - 3 && colomn === 1) ||
        (rows === MAX_ROWS - 2 && colomn === 1) ||
        (rows === MAX_ROWS - 2 && colomn === 2)
      ) {
        row.push(0);
        continue;
      }
      if (
        (rows === MAX_ROWS - 2 && colomn === MAX_ROWS - 2) ||
        (rows === MAX_ROWS - 2 && colomn === MAX_ROWS - 3) ||
        (rows === MAX_ROWS - 3 && colomn === MAX_ROWS - 2)
      ) {
        row.push(0);
        continue;
      }
      if (
        rows === 0 ||
        rows === MAX_ROWS - 1 ||
        colomn === 0 ||
        colomn === MAX_ROWS - 1 ||
        (colomn % 2 !== 1 && rows % 2 !== 1)
      ) {
        // console.log("rows and colums", rows, colomn);
        row.push(1);
        continue;
      }
      row.push(Math.random() > 0.3 ? 2 : 0);
      // console.log("number ", num);
    }
    map.push(row);
    row = [];
  }
}
server.listen(3001, () => {
  console.log("Server running at http://0.0.0.0:3000");
});

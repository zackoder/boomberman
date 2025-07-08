const express = require("express");
const app = express();
const http = require("http");
const wsokcet = require("websocket").server;
const server = http.createServer(app);
const ws = new wsokcet({ httpServer: server });

let map = [];
const MAX_ROWS = 15;
const bombs = [];
const powerUps = [];
const POWER_UP_TYPES = ["firepower", "bomb"];
const START_POSITIONS = [
  { x: 1, y: 1 },
  { x: MAX_ROWS - 2, y: 1 },
  { x: 1, y: MAX_ROWS - 2 },
  { x: MAX_ROWS - 2, y: MAX_ROWS - 2 },
];
const MAX_FIREPOWER = 2;
const MAX_BOMBS = 3;
const POWER_UP_DURATION = 30000;
const info = [
  "wait for other players to join",
  "you will start after a few secends",
];
let gameStat = false;
// const MAX_PLAYERS = 4;

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
      broadcast({ sender: player.name, message: data.message });
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
        color: PLAYER_COLORS[startIndex],
      };
      players.set(connection, player);
      if (map.length === 0) createmap();

      let interval = null;
      let currentTime = 300;
      let waiting = 10;
      console.log("interval condition", players.size >= 2, currentTime === 300);

      if (players.size == 2) {
        interval = setInterval(() => {
          console.log(players.size >= 2, interval === null);
          if (players.size === 4 || currentTime <= 0) {
            clearInterval(interval);
            gameStat = true;
            currentTime = 300;
            broadcast({ type: "init", map, players: [...players.values()] });
          }
          if (players.size < 2) {
            clearInterval(interval);
            currentTime = 200;
            broadcast({ time: currentTime });
            return;
          }
          currentTime--;
          broadcast({ time: currentTime });
        }, 1000);
      }
      let beforestart = null;
      if (!beforestart) {
        beforestart = setInterval(() => {
          if (gameStat) {
            console.log("conting donw befor the game start", waiting);

            if (players.size < 2) {
              broadcast({ players: players.size, restart: "restart" });
              clearInterval(beforestart);
              return;
            }
            if (waiting <= 0) {
              broadcast({ gameStarted: true });
              clearInterval(beforestart);
              return;
            }
            broadcast({ time: waiting });
            waiting--;
          }
        }, 1000);
      }
    }
    if (!gameStat) {
      broadcast({
        name: data.name,
        players: players.size,
        info: info[players.size < 2 ? 0 : 1],
      });
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

        broadcast({
          type: "player-move",
          name: player.name,
          x: newX,
          y: newY,
        });
      }
      const powerUpIndex = powerUps.findIndex(
        (p) => p.x === player.x && p.y === player.y
      );
      if (powerUpIndex !== -1) {
        const powerUp = powerUps.splice(powerUpIndex, 1)[0];

        if (powerUp.type === "firepower") {
          applyPowerUp(player, "firepower", MAX_FIREPOWER, POWER_UP_DURATION);
        } else if (powerUp.type === "bomb") {
          applyPowerUp(player, "maxBombs", MAX_BOMBS, POWER_UP_DURATION);
        }

        broadcast({
          type: "power-up-collected",
          name: player.name,
          x: player.x,
          y: player.y,
          powerUp: powerUp.type,
          newStats: {
            firepower: player.firepower,
            maxBombs: player.maxBombs,
          },
        });
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
      broadcast({
        type: "bomb-placed",
        x,
        y,
      });

      // set a timeout to the explosion
      setTimeout(() => {
        handleExplosion(x, y, name);
        player.activeBombs--;
      }, 1200);
    }
  });

  connection.on("close", () => {
    const leavingPlayer = players.get(connection);
    if (leavingPlayer) {
      broadcast({
        type: "player-leave",
        name: leavingPlayer.name,
      });
    }
    players.delete(connection);
  });
});
function applyPowerUp(player, stat, max, duration) {
  if (player[stat] >= max) return;
  player[stat]++;
  const timeoutKey = `${stat}Timeout`;
  if (player[timeoutKey]) clearTimeout(player[timeoutKey]);
  player[timeoutKey] = setTimeout(() => {
    player[stat] = Math.max(1, player[stat] - 1);
    broadcast({
      type: "power-up-expired",
      name: player.name,
      stat,
      value: player[stat],
    });
  }, duration);
}

function broadcast(message) {
  // Send updated position to all players
  for (let [conn, p] of players) {
    conn.sendUTF(JSON.stringify(message));
  }
}

function handleExplosion(x, y, owner) {
  // Remove bomb from array
  const index = bombs.findIndex(
    (b) => b.x === x && b.y === y && b.owner === owner
  );
  if (index !== -1) bombs.splice(index, 1);

  const explosionTiles = [{ x, y }];
  const directions = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
  ];
  // Get owner's firepower
  const player = [...players.values()].find((p) => p.name === owner);
  const firepower = player?.firepower || 1;

  for (const { dx, dy } of directions) {
    let nx = x;
    let ny = y;
    for (let i = 0; i < firepower; i++) {
      nx += dx;
      ny += dy;
      if (nx < 0 || nx >= MAX_ROWS || ny < 0 || ny >= MAX_ROWS) break;
      if (map[ny][nx] === 1) break;
      explosionTiles.push({ x: nx, y: ny });

      if (map[ny][nx] === 2) {
        map[ny][nx] = 0;
        if (Math.random() < 0.3) {
          const type =
            POWER_UP_TYPES[Math.floor(Math.random() * POWER_UP_TYPES.length)];
          powerUps.push({ x: nx, y: ny, type });
          broadcast({
            type: "powerup-appeared",
            x: nx,
            y: ny,
            powerUp: type,
          });
        }
        break;
      }
    }
  }

  for (let [conn, player] of players) {
    if (explosionTiles.some((t) => t.x === player.x && t.y === player.y)) {
      player.lives--;

      conn.sendUTF(
        JSON.stringify({
          type: "update-lives",
          name: player.name,
          lives: player.lives,
        })
      );
      if (player.lives <= 0) {
        player.dead = true;
        broadcast({
          type: "player-dead",
          name: player.name,
        });
      }
    }
  }

  broadcast({
    type: "bomb-exploded",
    x,
    y,
    explosionTiles,
    map,
  });
}

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
        broadcast(rows === MAX_ROWS - 2 && colomn === MAX_ROWS - 2) ||
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

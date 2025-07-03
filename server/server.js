const express = require("express");
const app = express();
const http = require("http");
const wsokcet = require("websocket").server;
const server = http.createServer(app);
const ws = new wsokcet({ httpServer: server });
const map = [];
const MAX_ROWS = 15;
const bombs = [];
const START_POSITIONS = [
  { x: 1, y: 1 },
  { x: MAX_ROWS - 2, y: 1 },
  { x: 1, y: MAX_ROWS - 2 },
  { x: MAX_ROWS - 2, y: MAX_ROWS - 2 },
];

const players = new Map();

ws.on("request", (req) => {
  const connection = req.accept(null, req.origin);

  connection.on("message", (message) => {
    const data = JSON.parse(message.utf8Data);
    // Assign start position
    if (data.type === "name") {
      const startIndex = players.size;
      if (startIndex >= START_POSITIONS.length) {
        return connection.sendUTF(JSON.stringify({ error: "Room is full" }));
      }

      const position = START_POSITIONS[startIndex];
      const player = {
        name: data.name,
        x: position.x,
        y: position.y,
        lives: 3,
        maxBombs: 1,
        activeBombs: 0,
      };

      // Check for name duplication
      if ([...players.values()].some((p) => p.name === data.name)) {
        return connection.sendUTF(JSON.stringify({ error: "Name taken" }));
      }

      players.set(connection, player);
      if (map.length === 0) createmap();

      connection.sendUTF(JSON.stringify({ type: "init", map, player }));
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

        // Send updated position to all players
        for (let [conn, p] of players) {
          conn.sendUTF(
            JSON.stringify({
              type: "player-move",
              name: player.name,
              x: newX,
              y: newY,
            })
          );
        }
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

      // Notify clients
      for (let [conn] of players) {
        conn.sendUTF(
          JSON.stringify({
            type: "bomb-placed",
            x,
            y,
          })
        );
      }

      // Schedule explosion in 2 seconds
      setTimeout(() => {
        handleExplosion(x, y, name);
        player.activeBombs--; 
      }, 2000);
    }
  });

  connection.on("close", () => {
    const leavingPlayer = players.get(connection);
    if (leavingPlayer) {
      for (let [conn] of players) {
        conn.sendUTF(
          JSON.stringify({
            type: "player-leave",
            name: leavingPlayer.name,
          })
        );
      }
    }
    players.delete(connection);
  });
});

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
  for (const { dx, dy } of directions) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || nx >= MAX_ROWS || ny < 0 || ny >= MAX_ROWS) continue;

    if (map[ny][nx] === 1) continue;

    explosionTiles.push({ x: nx, y: ny });

    if (map[ny][nx] === 2) {
      map[ny][nx] = 0;
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
        for (let [conn] of players) {
          conn.sendUTF(
            JSON.stringify({
              type: "player-dead",
              name: player.name,
            })
          );
        }
      }
    }
  }

  for (let [conn] of players) {
    conn.sendUTF(
      JSON.stringify({
        type: "bomb-exploded",
        x,
        y,
        explosionTiles,
        map,
      })
    );
  }
}

// console.log(map);

function createmap() {
  let row = [];
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

  // console.log(row.length);
}
// console.log(map);

createmap();

server.listen(3001, () => {
  console.log("Server running at http://0.0.0.0:3001");
});

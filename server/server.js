const express = require("express");
const app = express();
const http = require("http");
const wsokcet = require("websocket").server;
const server = http.createServer(app);
const ws = new wsokcet({ httpServer: server });
const map = [];
const MAX_ROWS = 15;
const START_POSITIONS = [
  { x: 1, y: 1 },
  { x: MAX_ROWS - 2, y: 1 },
  { x: 1, y: MAX_ROWS - 2 },
  { x: MAX_ROWS - 2, y: MAX_ROWS - 2 },
];

const players = new Map(); // Map<connection, playerData>

ws.on("request", (req) => {
  const connection = req.accept(null, req.origin);

  connection.on("message", (message) => {
    const data = JSON.parse(message.utf8Data);

    // Reject if name is already taken
    if (![...players.values()].includes(data.name)) {
      players.set(connection, data.name);
      // palyers[id] = connection
      if (map.length === 0) {
        createmap();
      }
      connection.sendUTF(JSON.stringify({ map }));
    }

    // Assign start position
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
    };

    players.set(connection, player);

    // Send initial map and player info
    connection.sendUTF(JSON.stringify({ type: "init", map, player }));
    if (data.type === "move") {
      const player = players.get(connection);
      if (!player) return;
  
      const { dir } = data;
      const dirs = {
        up: { dx: 0, dy: -1 },
        down: { dx: 0, dy: 1 },
        left: { dx: -1, dy: 0 },
        right: { dx: 1, dy: 0 },
      };
  
      const { dx, dy } = dirs[dir] || {};
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
  });

  connection.on("close", () => {
    players.delete(connection);
  });
});

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

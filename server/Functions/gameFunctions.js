const { broadcast } = require("./helperFunctions");
const MAX_ROWS = 15;
const POWER_UP_TYPES = ["speed", "firepower", "maxBombs"];
const powerUps = [];
const DEFAULT_STATS = {
  firepower: 1,
  maxBombs: 1,
  speed: 200,
};

function HandleExplosion(map, x, y, owner, players, bombs, aliveplayers) {
  const index = bombs.findIndex(
    (b) => b.x === x && b.y === y && b.owner === owner
  );
  if (index !== -1) bombs.splice(index, 1);

  const explosionTiles = [{ x, y }];
  const directions = [
    { dx: 0, dy: -1 }, // up
    { dx: 0, dy: 1 }, // down
    { dx: -1, dy: 0 }, // left
    { dx: 1, dy: 0 }, // right
  ];

  const player = [...players.values()].find((p) => p.name === owner);
  const firepower = player?.firepower || 1;

  for (const { dx, dy } of directions) {
    let nx = x;
    let ny = y;

    for (let i = 0; i < firepower; i++) {
      nx += dx;
      ny += dy;

      if (nx < 0 || nx >= MAX_ROWS || ny < 0 || ny >= MAX_ROWS) break;
      if (map[ny][nx] === 1) break; // hard wall

      explosionTiles.push({ x: nx, y: ny });

      if (map[ny][nx] === 2) {
        // soft wall destroyed
        map[ny][nx] = 0;

        if (Math.random() < 0.3) {
          const powerupindex = Math.floor(
            Math.random() * POWER_UP_TYPES.length
          );
          const type = POWER_UP_TYPES[powerupindex];
          powerUps.push({ x: nx, y: ny, type });
          map[ny][nx] = 6 + powerupindex;

          broadcast(
            {
              type: "powerup-appeared",
              newMap: map,
            },
            players
          );
        }

        break; // stop fire after hitting soft wall
      }
    }
  }

  // 💥 Mark explosion tiles in the map
  for (const tile of explosionTiles) {
    const val = map[tile.y][tile.x];
    // Only overwrite if not hardwall, softwall, or power-up
    if (val !== 1 && val !== 2 && val < 7) {
      map[tile.y][tile.x] = 11; // explosion tile
    }
  }

  // 💀 Handle damage
  for (const [conn, player] of players.entries()) {
    if (explosionTiles.some((t) => t.x === player.x && t.y === player.y)) {
      player.lives--;

      // conn.sendUTF(
      //   JSON.stringify({
      //     type: "update-lives",
      //     name: player.name,
      //     lives: player.lives,
      //   })
      // );

      if (player.lives <= 0) {
        player.dead = true;
        map[player.y][player.x] = 0;
        player.x = 0;
        player.y = 0;

        aliveplayers--

        // conn.sendUTF(
        //   JSON.stringify({
        //     restart: "restart",
        //     message: "You lost!",
        //   })
        // );
      }
      /* 
        name: 'zzzzz',
        x: 10,
        y: 1,
        id: 4,
        lives: 1,
        maxBombs: 2,
        activeBombs: 1,
        firepower: 1,
        speed: 200,
        color: 'blue',

      */
      console.log("aliveplayers", aliveplayers);

      if (aliveplayers === 1) {

        // const alivePlayers = [...players.values()].filter((p) => {  conn, !p.dead });
        // if (alivePlayers.length <= 1) {
        // const winner = alivePlayers[0]?.name || null;
        for (const [conn, player] of players.entries()) {
          console.log("hello", player.name);

          if (!player.dead) {
            conn.sendUTF(
              JSON.stringify({
                // restart: "restart",
                winnerMessage: "we have a winner " + player.name,
              })
            );
          } else {
            conn.sendUTF(
              JSON.stringify({
                // restart: "restart",
                losermessage: "fuck of loser " + player.name,
              })
            );
          }
          // alivePlayers.conn
        }

        // broadcast({ type: "game-over", winner }, players);
        // }
      }

      broadcast(
        { Upplayer: { name: player.name, lives: player.lives, maxBombs: player.maxBombs, firepower: player.firepower, speed: player.speed === 200 ? 1 : 2 }, type: "player-dead", newMap: map, name: player.name },
        players
      );
    }
  }



  // 🎆 Send explosion event
  broadcast(
    {
      type: "bomb-exploded",
      explosionTiles,
      newMap: map,
    },
    players
  );

  // 🧹 Reset explosion tiles after short delay (e.g., 500ms)
  setTimeout(() => {
    for (const tile of explosionTiles) {
      if (map[tile.y][tile.x] === 11) {

        for (let [conn, p] of players) {

          if (tile.y === p.y && p.x === tile.x) {
            map[tile.y][tile.x] = p.id;
            break;
          } else {
            map[tile.y][tile.x] = 0;
          }
        }
      } else {
      }
    }
    broadcast({ type: "explosion-cleared", newMap: map }, players);
  }, 500);
}
function applyPowerUp(player, power, POWER_UP_DURATION, players) {
  // if (!player || player.dead) return;

  let stat;
  let max;

  if (power === 7 && player.firepower < 2) {
    stat = "firepower";
    player.firepower++;
    max = 2;
  } else if (power === 8 && player.maxBombs < 3) {
    stat = "maxBombs";
    player.maxBombs++;
    max = 3;
  } else if (power === 9) {
    stat = "speed";
    player.speed = 100;
    broadcast({ type: "update-speed" }, players)
  } else {
    return;
  }

  // Broadcast new stat value
  broadcast({
    type: "power-up-collected",
    name: player.name,
    x: player.x,
    y: player.y,
    powerUp: stat,
    Upplayer: {
      name: player.name,
      lives: player.lives,
      maxBombs: player.maxBombs,
      firepower: player.firepower,
      speed: player.speed === 200 ? 1 : 2
    }
    // newStats: {
    //   firepower: player.firepower,
    //   maxBombs: player.maxBombs,
    //   speed: player.speed,
    // },
  }, players);

  // Schedule stat reset
  const timeoutKey = `${stat}Timeout`;
  if (player[timeoutKey]) {
    clearTimeout(player[timeoutKey]);
  }

  player[timeoutKey] = setTimeout(() => {
    player[stat] = DEFAULT_STATS[stat];

    broadcast({
      type: "power-up-expired",
      name: player.name,
      stat,
      value: player[stat],
      Upplayer: {
        name: player.name,
        lives: player.lives,
        maxBombs: player.maxBombs,
        firepower: player.firepower,
        speed: player.speed === 200 ? 1 : 2
      }
    }, players);

    if (stat === "speed") {
      broadcast({
        type: "update-speed",
        name: player.name,
        speed: DEFAULT_STATS.speed,
      }, players);
    }
  }, POWER_UP_DURATION);
}

module.exports = { HandleExplosion, applyPowerUp, powerUps, POWER_UP_TYPES };

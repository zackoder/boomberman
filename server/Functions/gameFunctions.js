const { broadcast } = require("./helperFunctions");
const MAX_ROWS = 15;
const POWER_UP_TYPES = ["firepower", "maxBombs", "speed"];
const powerUps = [];
const DEFAULT_STATS = {
  firepower: 1,
  maxBombs: 1,
  speed: 200,
};

function HandleExplosion(map, x, y, owner, players, bombs) {
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

      conn.sendUTF(
        JSON.stringify({
          type: "update-lives",
          name: player.name,
          lives: player.lives,
        })
      );

      if (player.lives <= 0) {
        player.dead = true;
        map[player.y][player.x] = 0;
        player.x = 0;
        player.y = 0;
        broadcast(
          { type: "player-dead", newMap: map, name: player.name },
          players
        );

        conn.sendUTF(
          JSON.stringify({
            restart: "restart",
            message: "You lost!",
          })
        );
      }
    }
  }

  const alivePlayers = [...players.values()].filter((p) => !p.dead);
  if (alivePlayers.length <= 1) {
    const winner = alivePlayers[0]?.name || null;
    broadcast({ type: "game-over", winner }, players);
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
          console.log("player name", p.name);

          if (tile.y === p.y && p.x === tile.x) {
            console.log("here", p.name);
            // if (player.)

            map[tile.y][tile.x] = p.id;
            // console.log("return to 0", p);
            break;
          } else {
            // console.log(p);
            // map[player.y][player.x] = 0;
            console.log("here didn't die", p.name);
            // if (map[tile.y][tile.x] === 11){
              
            // }
            map[tile.y][tile.x] = 0;
            // break;

            
            
          }
        }
      } else {
        console.log("here 2", map[tile.y][tile.x]);
      }
    }
    broadcast({ type: "explosion-cleared", newMap: map }, players);
  }, 500);
}
function applyPowerUp(player, stat, max, duration, players) {
  if (max !== null && player[stat] >= max) return;
  //  console.log(player[stat]);

  player.maxBombs++;
  //  console.log(player[stat]);

  const timeoutKey = `${stat}Timeout`;

  // Clear any existing timeout for this stat
  if (player[timeoutKey]) {
    clearTimeout(player[timeoutKey]);
  }

  // Schedule stat reset after duration
  player[timeoutKey] = setTimeout(() => {
    player[stat] = DEFAULT_STATS[stat];
    // player.maxBombs--;

    // Notify client of expired power-up
    broadcast(
      {
        type: "power-up-expired",
        name: player.name,
        stat,
        value: player[stat],
      },
      players
    );

    // If it's speed, also re-trigger update-speed so client re-throttles
    if (stat === "speed") {
      broadcast(
        {
          type: "update-speed",
          name: player.name,
          speed: DEFAULT_STATS.speed,
        },
        players
      );
    }
  }, duration);
}

module.exports = { HandleExplosion, applyPowerUp, powerUps, POWER_UP_TYPES };

const { broadcast } = require("./helperFunctions");
const MAX_ROWS = 15;
const POWER_UP_TYPES = ["firepower", "bomb", "speed"];
const powerUps = [];
const DEFAULT_STATS = {
  firepower: 1,
  maxBombs: 1,
  speed: 200,
};

function HandleExplosion(map, x, y, owner, players, bombs) {
  // 🧨 Remove bomb from list
  const index = bombs.findIndex(b => b.x === x && b.y === y && b.owner === owner);
  if (index !== -1) bombs.splice(index, 1);

  const explosionTiles = [{ x, y }];
  const directions = [
    { dx: 0, dy: -1 }, // up
    { dx: 0, dy: 1 },  // down
    { dx: -1, dy: 0 }, // left
    { dx: 1, dy: 0 },  // right
  ];

  // 🔥 Determine blast range from player firepower
  const player = [...players.values()].find(p => p.name === owner);
  const firepower = player?.firepower || 1;

  // 🌩 Expand in each direction
  for (const { dx, dy } of directions) {
    let nx = x;
    let ny = y;

    for (let i = 0; i < firepower; i++) {
      nx += dx;
      ny += dy;

      // 🧱 Stop at map boundary or hard wall
      if (nx < 0 || nx >= MAX_ROWS || ny < 0 || ny >= MAX_ROWS) break;
      if (map[ny][nx] === 1) break;

      explosionTiles.push({ x: nx, y: ny });

      // 🌿 If soft wall is hit, destroy it and maybe spawn a power-up
      if (map[ny][nx] === 2) {
        map[ny][nx] = 0;

        if (Math.random() < 0.3) {
          const type = POWER_UP_TYPES[Math.floor(Math.random() * POWER_UP_TYPES.length)];
          powerUps.push({ x: nx, y: ny, type });

          broadcast({
            type: "powerup-appeared",
            x: nx,
            y: ny,
            powerUp: type,
          }, players);
        }
        break; // 🔥 Stop fire in that direction after soft wall
      }
    }
  }

  // 💀 Check for player deaths
  for (const [conn, player] of players.entries()) {
    if (explosionTiles.some(t => t.x === player.x && t.y === player.y)) {
      player.lives--;

      conn.sendUTF(JSON.stringify({
        type: "update-lives",
        name: player.name,
        lives: player.lives,
      }));

      if (player.lives <= 0) {
        player.dead = true;

        broadcast({ type: "player-dead", name: player.name }, players);

        conn.sendUTF(JSON.stringify({
          restart: "restart",
          message: "You lost!",
        }));
      }
    }
  }

  // 🏆 End game if only one player remains
  const alivePlayers = [...players.values()].filter(p => !p.dead);
  if (alivePlayers.length <= 1) {
    const winner = alivePlayers[0]?.name || null;
    broadcast({ type: "game-over", winner }, players);
  }

  // 🎆 Notify all players of the explosion animation
  broadcast({
    type: "bomb-exploded",
    x,
    y,
    explosionTiles,
    map,
  }, players);
}

function applyPowerUp(player, stat, max, duration, players) {
  if (max !== null && player[stat] >= max) return;

  player[stat]++;

  const timeoutKey = `${stat}Timeout`;

  // Clear any existing timeout for this stat
  if (player[timeoutKey]) {
    clearTimeout(player[timeoutKey]);
  }

  // Schedule stat reset after duration
  player[timeoutKey] = setTimeout(() => {
    player[stat] = DEFAULT_STATS[stat] ?? 1;

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

module.exports = { HandleExplosion, applyPowerUp, powerUps };

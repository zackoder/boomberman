const { broadcast } = require("./helperFunctions");
const MAX_ROWS = 15;
const POWER_UP_TYPES = ["firepower", "bomb"];
const powerUps = []
function HandleExplosion(map, x, y, owner, players,bombs) {
    // first thing we start with is to romove the bomb from the array
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
          },players);
        }
        break;
      }
    }
  }

  // const deadConnections = [];
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
        },players);
        conn.sendUTF( JSON.stringify({restart:"restart", message:"hhh you lose"}))
        // deadConnections.push(conn);
      }
    }
  }

  // for (let conn of deadConnections) {
  //   players.delete(conn);
  // }

  const alivePlayers = [...players.values()].filter((p) => !p.dead);
  if (alivePlayers.length <= 1) {
    const winner = alivePlayers[0]?.name || null;
    broadcast({
      type: "game-over",
      winner,
    },players);
  }

  broadcast({
    type: "bomb-exploded",
    x,
    y,
    explosionTiles,
    map,
  },players);
}



function applyPowerUp(player, stat, max, duration,players) {
  if (player[stat] >= max) return;
  player[stat]++;
  const timeoutKey = `${stat}Timeout`;
  if (player[timeoutKey]) clearTimeout(player[timeoutKey]);
  player[timeoutKey] = setTimeout(() => {
    player[stat] = 1;
    broadcast({
      type: "power-up-expired",
      name: player.name,
      stat,
      value: player[stat],
    },players);
    
  }, duration);
}


module.exports = { HandleExplosion, applyPowerUp, powerUps};
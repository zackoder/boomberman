function broadcast(data, players={}) {
  if (!players || typeof players[Symbol.iterator] !== 'function') {
    throw new Error("Missing or invalid 'players' argument in broadcast");
  }
  for (let [conn, player] of players) {
    conn.sendUTF(JSON.stringify(data));
  }
}



module.exports = {broadcast};

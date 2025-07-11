function broadcast(data, players={}) {
  if (!players || typeof players[Symbol.iterator] !== 'function') {
    throw new Error("Missing or invalid 'players' argument in broadcast");
  }
  for (let [conn, player] of players) {
    conn.sendUTF(JSON.stringify(data));
  }
}

function throttle (fn , delay) {
    let lastTime =0
    //let id = 0
    return (event) => {
        const now = new Date().getTime()
       // id++
            if (now - lastTime < delay) return

            lastTime = now
           // console.log(id)
            fn(event)

    }
}


module.exports = { broadcast, throttle};
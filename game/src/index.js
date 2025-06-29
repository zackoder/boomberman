import { createHTML } from "./core/element.js";
import { Router } from "./core/router.js";
import { Dom } from "./core/vdom.js";
import { Game } from "./game.js";

export const rout = new Router();
const dom = new Dom();
const root = dom.getRoot()
let socket = null
let game;


rout.addrout("/", homePage);
rout.addrout("/game", gamehandler);

function homePage() {
  // onmessage
  const label = createHTML("label", { for: "nameInpt", textContent: "enter your name:" })
  const input = createHTML("input", { id: "nameInpt", className: "input" })

  const form = createHTML("form", { onsubmit: submitName }, label, input)
  const game = createHTML("div", {
    className: "gameContainer"
  }, form)

  root.appendChild(game)
}

function createConnection() {
  if (socket !== null) return
  socket = new WebSocket("ws://localhost:3001")
  socket.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (!data) return
    if (data.error) {
      const errorContainer = createHTML("p", { className: "error" })
      errorContainer.textContent = data.error
      root.appendChild(errorContainer)
      setTimeout(() => {
        errorContainer.remove()
      }, 3000);
    } else if (data.map) {
      game = new Game(data.map)
      rout.navigate("/game")
      console.log(data.map);
    }
  }
}

function submitName(e) {
  e.preventDefault()
  const name = e.target.children[1].value.trim()
  // console.log(ipt);
  if (!name) return
  socket.send(JSON.stringify({ "type": "name", name }))

}

createConnection()
rout.handleRouteChange()

function gamehandler() {
  root.innerHTML = ""
  if (game === undefined) return rout.navigate("/")
  console.log(game);
  game.drawMap()
}
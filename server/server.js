const express = require("express");
const app = express();
const http = require("http")
const wsokcet = require("websocket").server;
const server = http.createServer(app)

const ws = new wsokcet({ httpServer: server })
const palyers = new Map()
const map = []
const MAX_ROWS = 15

ws.on("request", (req) => {
    const connection = req.accept(null, req.origin)
    connection.on("message", (message) => {
        const data = JSON.parse(message.utf8Data);
        if (!palyers[data.name]) {
            palyers[connection] = data.name
            // palyers[id] = connection
            if (map.length === 0) {
                createmap()
            }
            connection.sendUTF(JSON.stringify({ map }))
        }
        else return connection.sendUTF(JSON.stringify({ error: "chose another name" }))
    })
    connection.on("close", () => {
        // palyers[connection]
        palyers.delete(connection)
        // console.log(palyers[""]);
    })
})


// console.log(map);

function createmap() {
    let row = []
    for (let rows = 0; rows < MAX_ROWS; rows++) {
        for (let colomn = 0; colomn < MAX_ROWS; colomn++) {
            if ((rows === 1 && colomn === 1) || (rows === 1 && colomn === 2) || (rows === 2 && colomn === 1)) {
                row.push(0)
                continue
            }

            if ((rows === 1 && colomn === MAX_ROWS - 3) || (rows === 1 && colomn === MAX_ROWS - 2) || (rows === 2 && colomn === MAX_ROWS - 2)) {
                row.push(0)
                continue
            }

            if ((rows === MAX_ROWS - 3 && colomn === 1) || (rows === MAX_ROWS - 2 && colomn === 1) || (rows === MAX_ROWS - 2 && colomn === 2)) {
                row.push(0)
                continue
            }
            if ((rows === MAX_ROWS - 2 && colomn === MAX_ROWS - 2) || (rows === MAX_ROWS - 2 && colomn === MAX_ROWS - 3) || (rows === MAX_ROWS - 3 && colomn === MAX_ROWS - 2)) {
                row.push(0)
                continue
            }
            if (rows === 0 || rows === MAX_ROWS - 1 || colomn === 0 || colomn === MAX_ROWS - 1 || (colomn % 2 !== 1 && rows % 2 !== 1)) {
                // console.log("rows and colums", rows, colomn);
                row.push(1)
                continue
            }
            row.push(Math.random() > 0.3 ? 2 : 0)
            // console.log("number ", num);
        }
        map.push(row)
        row = []
    }

    // console.log(row.length);
}
// console.log(map);



createmap()

server.listen(3001, () => {
    console.log("Server running at http://localhost:3001");
});

const express = require("express")
const path = require("path")
const app = express()
const statics = path.join(__dirname, "../src")

app.use("/src", express.static(statics))
app.use("", (req, res) => {
    res.sendFile(path.join(__dirname, "../index.html"))
})
app.listen(3000)
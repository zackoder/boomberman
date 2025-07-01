import { createHTML } from "./core/element.js";

export class Game {
    constructor(map) {
        this.map = map
    }
    drawMap() {
        console.log(this.map);
        let children = []
        for (let row = 0; row < this.map.length; row++) {
            for (let column = 0; column < this.map.length; column++) {
                if (this.map[row][column] === 0) {
                    children.push(createHTML("div", { className: `emptysell` } ))
                }
                if (this.map[row][column] === 1) {
                    children.push(createHTML("div", { className: `wall` }))
                }
                if (this.map[row][column] === 2) {
                    children.push(createHTML("div", { className: `softwall` }))
                }
            }
        }
        const gameContainer = createHTML("div", { className: "gameContainer" }, ...children)
        root.append(gameContainer)
    }
}
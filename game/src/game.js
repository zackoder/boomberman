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
                    children.push(createHTML("div", { className: `image-crop-container` }, createHTML("img", { className: "img wall", src: "http://localhost:3000/src/TurboGrafx-16 - Bomberman - Battle Stage.png" })))
                }
                if (this.map[row][column] === 1) {
                    children.push(createHTML("div", { className: `image-crop-container` }, createHTML("img", { className: "img emptysell", src: "http://localhost:3000/src/TurboGrafx-16 - Bomberman - Battle Stage.png" })))
                }
                if (this.map[row][column] === 2) {
                    children.push(createHTML("div", { className: `image-crop-container` }, createHTML("img", { className: "img cropped-image", src: "http://localhost:3000/src/TurboGrafx-16 - Bomberman - Battle Stage.png" })))
                }
            }
        }
        const gameContainer = createHTML("div", { className: "gameContainer" }, ...children)
        root.append(gameContainer)
    }
}
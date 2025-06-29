export class Dom {
    constructor() {
        this.root = document.getElementById("root")
        this.Vdom = this.root
    }
    getRoot() {
        return this.root
    }
    update(...elements) {
        this.root.append(...elements)
    }
}
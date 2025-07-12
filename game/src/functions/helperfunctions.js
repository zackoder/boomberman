export function throttle (fn , delay) {
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
let test = document.querySelector(".letters.notranslate").innerText

function type(element, key) {
  let event = new KeyboardEvent("keydown", {
    key: key,
    bubbles: true,
    cancelable: true
  })
  
  element.dispatchEvent(event)
}

let i = 0
let speed = test.length-2
function animate() {
  requestAnimationFrame(animate)
  for (let j = 0; j < speed; j++) {
    if (i > test.length) return
    type(document.querySelector(".letters.notranslate"), test[i])
    i++
  }
}
requestAnimationFrame(animate)

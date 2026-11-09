let elements
await new Promise((res) => {
  let i = setInterval(() => {
    elements = document.querySelectorAll("div.square")
    if (elements.length > 0) {
      clearInterval(i)
      res()
      return
    }
  })
  
})

function press(element) {
  let event = new MouseEvent("mousedown", {
    bubbles: true,
    cancelable: true,
    view: window
  })
  element.dispatchEvent(event)
  element.style.background = "white"
  element.style.opacity = 1
  element.style.transform = "scale(1,1)"
  element.style.transition = "none"
  setTimeout(() => {
    element.style.removeProperty("background")
    element.style.removeProperty("opacity")
    element.style.removeProperty("transform")
    element.style.removeProperty("transition")
  })
}

function initObserver(element, callback) {
  let observer = new MutationObserver(callback)
  observer.observe(element, { 
    attributes: true, 
    attributeFilter: ['class'],
    characterData: true, 
    subtree: true 
  })
}

let history = []
let timeout = 1000
let lastEvent = 0
let playing = false
function callback(e) {
  if (!playing && e.classList.contains("active")) {
    history.push(e)
    lastEvent = Date.now()
  }
}

for (let e of elements) initObserver(e, () => callback(e))

let lastFrame = 0
let fps = 15
function animate() {
  requestAnimationFrame(animate)
  if (Date.now() - lastFrame < 1000 / fps) return
  lastFrame = Date.now()
  
  if (history.length > 0 && Date.now() > lastEvent + timeout) {
    playing = true
  }
  if (playing) {
    press(history[0])
    history.shift()
  }
  if (history.length <= 0) playing = false
}
requestAnimationFrame(animate)

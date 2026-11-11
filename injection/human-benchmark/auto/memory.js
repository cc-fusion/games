function press(element) {
  let event = new MouseEvent("mousedown", {
    bubbles: true,
    cancelable: true,
    view: window
  })
  element.dispatchEvent(event)
}
function initObserver(element, callback, options = { 
    attributes: true, 
    attributeFilter: ['class'],
    characterData: true, 
    subtree: true 
  }) {
  let observer = new MutationObserver(callback)
  observer.observe(element, options)
  
    return observer
}

function wait(callback,t=30) {
    return new Promise((res) => {
        let interval = setInterval(() => {
            if (callback()) {
                res()
                clearInterval(interval)
                return
            }
        },t)
    })
}
async function play() {
  let elements
  await wait(() => {
    try {
      elements = document.querySelector(".css-1qk3bhi").querySelectorAll(".css-hqmwod")
    } catch (e) {
      return false
    }
    return elements.length > 0
  })
  let toClick = []
  let lastEvent = 1/0
  function callback(e) {
    if (e.classList.contains("active")) {
      console.log(e)
      lastEvent = Date.now()  
      toClick.push(e)
    }
  }
  let observers = []
  for (let e of elements) observers.push(initObserver(e, () => callback(e)))
  let i = 0
  let playing = false
  let interval = setInterval(() => {
    if (Date.now() - lastEvent > 2000 && toClick.length > 0) playing = true
    if (!playing) return
    if (i >= toClick.length) {
      clearInterval(interval)
      for (let o of observers) o.disconnect()
      return
    }
    press(toClick[i])
    i++
  }, 1000/15)
  return true
}
initObserver(document.querySelector("span.css-4rar09"), (e) => {
  console.log("PLAYING")
  play()
}, {characterData: true, childList: true, subtree: true})

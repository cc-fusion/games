let element = document.querySelector('div.css-yg2dtu')

function callback(mutationsList, observer) {
  let text = element.innerText.trim()
  if (text == "Click!") {
    let event = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      view: window
    })
    element.dispatchEvent(event)
  }
}

let observer = new MutationObserver(callback)

observer.observe(element,  {
  childList: true,
  characterData: true,
  subtree: true
})

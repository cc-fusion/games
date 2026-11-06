function simulateClick(x,y) {
  let event = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    screenX: x,
    screenY: y
  });

  const element = document.elementFromPoint(x, y);
  if (element) {
    element.dispatchEvent(event);
  }
  element.click()
  return element
}
let keys = {}
addEventListener("keydown", (e) => {
  let key = e.key.toLowerCase()
  keys[key] = true
})
addEventListener("keyup", (e) => {
  let key = e.key.toLowerCase()
  keys[key] = false
})
let mouse = {x:0,y:0,down:false,element:null}
addEventListener("mousedown", (e) => {
  mouse.down = true
  mouse.x = e.clientX
  mouse.y = e.clientY
  mouse.element = document.elementFromPoint(e.clientX, e.clientY)
})
addEventListener("mousemove", (e) => {
  mouse.x = e.clientX
  mouse.y = e.clientY
  mouse.element = document.elementFromPoint(e.clientX, e.clientY)
})
addEventListener("mouseup", (e) => {
  mouse.down = false
  mouse.element = null
})

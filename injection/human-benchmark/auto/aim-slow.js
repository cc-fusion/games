
function press(element) {
  let rect = element.getBoundingClientRect()
  let event = new MouseEvent("mousedown", {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2
  })
  element.dispatchEvent(event)
}
function animate() {
  requestAnimationFrame(animate)
  let e = document.querySelector(".css-y2rt7i")
  if (e) {
    press(e)
  }
}
requestAnimationFrame(animate)

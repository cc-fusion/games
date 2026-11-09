function submit(x) {
  let input = document.querySelector("input")
input.focus()
  input.value = x
  input.dispatchEvent(new Event("change", { bubbles: true }))
  setTimeout(() => {
    let clickEvent = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true
    })
    document.querySelector(".css-1bnidmp").dispatchEvent(clickEvent)
  },60)
}

function getNumber() {
  return document.querySelector(".big-number")?.innerText?.trim() || -1
}
let number = 0

setInterval(() => {
  let tempNum = getNumber()
  if (tempNum != -1) {
    number = tempNum
  } else if (document.querySelector("input")) {
    submit(number)
  }
}, 250)

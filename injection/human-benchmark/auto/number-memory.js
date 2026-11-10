function submit(x) {
  let input = document.querySelector("input")
  
  input.focus()

  let prototype = input instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype

  let setter = Object.getOwnPropertyDescriptor(
    prototype,
    "value"
  ).set

  for (let char of x) {
    input.dispatchEvent(new KeyboardEvent("keydown", {
      key: char,
      bubbles: true,
      cancelable: true
    }))

    input.dispatchEvent(new InputEvent("beforeinput", {
      bubbles: true,
      cancelable: true,
      inputType: "insertText",
      data: char
    }))

    setter.call(input, input.value + char);

    input.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      inputType: "insertText",
      data: char
    }));

    input.dispatchEvent(new KeyboardEvent("keyup", {
      key: char,
      bubbles: true
    }));
  }

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

let interval = setInterval(() => {
  let tempNum = getNumber()
  if (tempNum != -1) {
    number = tempNum
  } else if (document.querySelector("input")) {
    submit(number)
  } else if (document.querySelector(".css-1bnidmp")) {
    document.querySelector(".css-1bnidmp").click()
  }
}, 250)

function STOP() {
  clearInterval(interval)
}

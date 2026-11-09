function clickSeen() {
    document.querySelectorAll(".css-1bnidmp")[0].click()
}
function clickNew() {
    document.querySelectorAll(".css-1bnidmp")[1].click()
}
function getWord() {
    return document.querySelector("div.word").innerText
}
let words = new Set()
function animate() {
  requestAnimationFrame(animate)
  let word = getWord()
  if (words.has(word)) {
      clickSeen()
  } else {
      words.add(word)
      clickNew()
  }
}
requestAnimationFrame(animate)

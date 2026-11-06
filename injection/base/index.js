let keys = {}
addEventListener("keydown", (e) => {
  let key = e.key.toLowerCase()
  keys[key] = true
})
addEventListener("keyup", (e) => {
  let key = e.key.toLowerCase()
  keys[key] = false
})

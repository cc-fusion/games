
const posCache = new WeakMap()

function getPos(element) {
  const now = performance.now()
  const cached = posCache.get(element)

  if (cached && (now - cached.t) < 1600) {
    return cached
  }

  if (!cached) {
    posCache.set(element, { x: 0, y: 0, t: 0, fresh: true })
    return null
  }

  const rect = element.getBoundingClientRect()
  cached.x = rect.left + rect.width * 0.5
  cached.y = rect.top + rect.height * 0.5
  cached.t = now
  cached.fresh = false
  return cached
}

const fakeCursorURL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 40'%3E%3Cpath d='M3 2 L3 32 L10 25 L15 37 L20 35 L15 23 L26 23 Z' fill='black' stroke='white' stroke-width='2.4' stroke-linejoin='round'/%3E%3C/svg%3E"

const cursorImg = document.createElement("img")
cursorImg.src = fakeCursorURL
cursorImg.alt = ""
cursorImg.draggable = false

Object.assign(cursorImg.style, {
  position: "fixed",
  left: "0px",
  top: "0px",
  width: "25px",
  height: "25px",
  pointerEvents: "none",
  zIndex: "2147483647",
  userSelect: "none"
})

document.body.appendChild(cursorImg)

let mouse = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  movementX: 0,
  movementY: 0
}

let sensitivity = 1
let enabled = false

const overlay = document.createElement("div")

Object.assign(overlay.style, {
  position: "fixed",
  inset: "0",
  background: "rgba(0, 0, 0, 0.45)",
  zIndex: "2147483645",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  font: "16px sans-serif",
  cursor: "pointer",
  textAlign: "center"
})

overlay.innerHTML = `
<div style=" padding: 16px; max-width: 360px; background: #222; border-radius: 12px; line-height: 1.4; ">
  <h3 style="margin-top:0; margin-bottom: 4px; color: #fff;">Fake Cursor</h3>
  <p style="font-size:13px; color:#bbb; margin: 0;">Click to control. Esc to release.</p>
</div>
`

document.body.appendChild(overlay)

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function updateCursor() {
  cursorImg.style.left = `${mouse.x}px`
  cursorImg.style.top = `${mouse.y}px`
}

updateCursor()

overlay.addEventListener("click", async () => {
  try {
    await document.body.requestPointerLock()
  } catch (error) {
    console.error("Could not lock pointer:", error)
  }
})

document.addEventListener("pointerlockchange", () => {
  enabled = document.pointerLockElement === document.body

  overlay.style.display = enabled ? "none" : "flex"
  cursorImg.style.display = enabled ? "block" : "none"

  if (enabled) {
    mouse.x = window.innerWidth / 2
    mouse.y = window.innerHeight / 2
    updateCursor()
  }
})

function angleDistance(angle1, angle2) {
  return Math.atan2(Math.sin(angle2 - angle1), Math.cos(angle2 - angle1))
}

let aimAssist = {
  score: -Infinity,
  target: null
}

document.addEventListener("mousemove", (e) => {
  if (!enabled) return
  let movementX = e.movementX
  let movementY = e.movementY
  if (
    aimAssist.score > window.AIMASSIST_CONFIG.assistThreshold.min &&
    aimAssist.score < window.AIMASSIST_CONFIG.assistThreshold.max
  ) {
    movementX += (aimAssist.target.x - mouse.x) * window.AIMASSIST_CONFIG.snapSpeed
    movementY += (aimAssist.target.y - mouse.y) * window.AIMASSIST_CONFIG.snapSpeed
  }
  mouse.x = clamp(mouse.x + movementX * sensitivity, 0, window.innerWidth - 1)
  mouse.y = clamp(mouse.y + movementY * sensitivity, 0, window.innerHeight - 1)
  mouse.movementX = movementX * sensitivity
  mouse.movementY = movementY * sensitivity

  updateCursor()
})

function dispatchMouseEvent(type, target, button = 0) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: mouse.x,
    clientY: mouse.y,
    screenX: window.screenX + mouse.x,
    screenY: window.screenY + mouse.y,
    button,
    buttons: type === "mousedown" ? 1 : 0
  })
  return target.dispatchEvent(event)
}

function clickAtCursor(button = 0) {
  if (!enabled) return
  const target = document.elementFromPoint(mouse.x, mouse.y)
  if (!target || target === cursorImg || target === overlay) return
  dispatchMouseEvent("mousedown", target, button)
  dispatchMouseEvent("mouseup", target, button)
  dispatchMouseEvent("click", target, button)
}

document.addEventListener("mousedown", (e) => {
  if (!enabled || e.button !== 0 || !e.isTrusted) return
  e.preventDefault()
  clickAtCursor(0)
}, true)

let gameWrapper = null
let targets = []

function getDistance(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

const fps = 30
const interval = 1000 / fps
let lastFrameTime = 0

function loop(timestamp) {
  requestAnimationFrame(loop)

  const delta = timestamp - lastFrameTime
  if (delta < interval) return
  lastFrameTime = timestamp - (delta % interval)

  aimAssist.score = -Infinity
  aimAssist.target = null

  if (!gameWrapper) {
    gameWrapper = document.getElementById("game-wrapper")
    if (!gameWrapper) return
  }

  targets = gameWrapper.querySelectorAll(".target:not(.hit)")
  if (targets.length === 0) return

  const mx = mouse.x, my = mouse.y
  const mvx = mouse.movementX, mvy = mouse.movementY
  const useAngle = mvx !== 0 && mvy !== 0
  const mouseMovementAngle = useAngle ? Math.atan2(mvy, mvx) : 0

  let closestTarget = null
  let closestScore = -Infinity
  let closestDistance = Infinity

  let freshCount = 0

  for (let i = 0; i < targets.length; i++) {
    const pos = getPos(targets[i])
    if (!pos) {
      freshCount++
      continue
    }

    const dx = pos.x - mx, dy = pos.y - my
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance === 0) continue

    let score
    if (useAngle) {
      const angle = Math.atan2(dy, dx)
      score = (Math.PI - Math.abs(angleDistance(mouseMovementAngle, angle))) / distance
    } else {
      score = 1 / distance
    }

    if (score > closestScore) {
      closestScore = score
      closestTarget = pos
      closestDistance = distance
    }
  }

  if (freshCount > 0) {
    const now = performance.now()
    for (let i = 0; i < targets.length; i++) {
      const c = posCache.get(targets[i])
      if (c && c.fresh) {
        const rect = targets[i].getBoundingClientRect()
        c.x = rect.left + rect.width * 0.5
        c.y = rect.top + rect.height * 0.5
        c.t = now
        c.fresh = false
      }
    }
  }

  if (!closestTarget) return

  aimAssist.score = closestScore
  aimAssist.target = closestTarget

  if (closestDistance < window.AIMASSIST_CONFIG.teleport_distance) {
    mouse.x = closestTarget.x
    mouse.y = closestTarget.y
    if (window.AIMASSIST_CONFIG.autoclick) clickAtCursor(0)
  }
}

requestAnimationFrame(loop)

window.AIMASSIST_CONFIG = {
  teleport_distance: 20,
  autoclick: true,
  assistThreshold: { min: 0, max: 1000000 },
  snapSpeed: 0.1
}
